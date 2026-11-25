import crypto from 'crypto';
import rateLimit, {
  Store,
  Options as RateLimitOptions,
  IncrementResponse,
  ClientRateLimitInfo,
  MemoryStore,
  ipKeyGenerator,
} from 'express-rate-limit';
import type { Request } from 'express';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisReady } from '../config/redis';

/**
 * Thrown when Redis is unavailable/timing out in production for security-sensitive
 * authentication routes, enforcing fail-closed 503 behavior instead of silent
 * per-process memory fallback.
 */
export class RateLimitOutageError extends Error {
  public readonly status = 503;
  public readonly isRateLimitOutage = true;

  constructor(message = 'Authentication service is temporarily unavailable. Please try again shortly.') {
    super(message);
    this.name = 'RateLimitOutageError';
  }
}

/**
 * ResilientRateLimitStore implements the express-rate-limit Store interface.
 *
 * Architecture:
 * 1. Distributed Redis Mode: When Redis is configured and healthy, increments are executed
 *    atomically in Redis via Lua scripts, sharing rate-limit counters across all backend processes.
 * 2. In-Memory Development Mode: When REDIS_URL is not configured in local development, it uses
 *    express-rate-limit's built-in MemoryStore cleanly.
 * 3. Outage Resilience & Flood Protection: If Redis is temporarily unreachable or times out,
 *    it activates an emergency local memory throttle and logs a high-visibility operational alert.
 *    This ensures Redis outages do not result in uncontrolled request floods or total user lockouts.
 */
export class ResilientRateLimitStore implements Store {
  private memoryStore: MemoryStore;
  private redisStore: RedisStore | null = null;
  public readonly prefix: string;
  public readonly isSensitive: boolean;
  private windowMs: number = 60000;

  constructor(options: { prefix: string; isSensitive?: boolean }) {
    this.prefix = options.prefix;
    this.isSensitive = Boolean(options.isSensitive);
    this.memoryStore = new MemoryStore();

    if (process.env.REDIS_URL && process.env.REDIS_URL.trim().length > 0) {
      this.redisStore = new RedisStore({
        prefix: this.prefix,
        resetExpiryOnChange: false,
        sendCommand: async (...args: string[]): Promise<any> => {
          const client = getRedisClient();
          if (!client || !client.isOpen) {
            throw new Error('Redis client is closed or not connected');
          }

          // Bound command execution to 1000ms to prevent hanging requests during Redis latency spikes
          let timer: NodeJS.Timeout | undefined;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('Redis command timeout (1000ms)')), 1000);
          });

          try {
            return await Promise.race([client.sendCommand(args), timeoutPromise]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        },
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`🚨 [RateLimit Alert] PRODUCTION NOTICE: REDIS_URL not configured for prefix '${this.prefix}'. Distributed rate limiting is inactive.`);
      } else {
        console.log(`ℹ️  [RateLimit] Redis not configured for prefix '${this.prefix}'. Using local MemoryStore.`);
      }
    }
  }

  /**
   * Initializes store configuration from express-rate-limit.
   */
  async init(options: RateLimitOptions): Promise<void> {
    this.windowMs = options.windowMs;
    this.memoryStore.init(options);

    if (this.redisStore) {
      try {
        await this.redisStore.init(options);
      } catch (err: any) {
        // Deferred script loading: RedisStore will automatically load scripts on first request
        console.warn(`⚠️  [RateLimit] RedisStore pre-init deferred for '${this.prefix}': ${err?.message || err}`);
      }
    }
  }

  /**
   * Returns current active storage backend: 'redis' when ready, else 'memory'.
   */
  getActiveBackend(): 'redis' | 'memory' {
    return this.redisStore && isRedisReady() ? 'redis' : 'memory';
  }

  /**
   * Whether Redis is configured as a potential backend for this store.
   */
  isConfiguredWithRedis(): boolean {
    return Boolean(this.redisStore);
  }

  /**
   * Increments the hit counter for the given client key.
   *
   * Outage Policy:
   * - In production on security-sensitive routes (`isSensitive: true`), Redis outage or timeout
   *   fails closed with `RateLimitOutageError` (HTTP 503) rather than silently falling back to
   *   uncoordinated per-process memory counters.
   * - In non-production or on non-security-critical routes (`isSensitive: false`), falls back to
   *   bounded local MemoryStore.
   */
  async increment(key: string): Promise<IncrementResponse> {
    const isProd = process.env.NODE_ENV === 'production';

    if (this.redisStore && isRedisReady()) {
      try {
        return await this.redisStore.increment(key);
      } catch (err: any) {
        this.logOutage('increment', err);
        if (isProd && this.isSensitive) {
          throw new RateLimitOutageError();
        }
      }
    } else if (isProd && this.isSensitive) {
      this.logOutage('increment', new Error('Redis unavailable in production'));
      throw new RateLimitOutageError();
    }

    // Non-production OR non-security-critical route: bounded local memory throttle
    return this.memoryStore.increment(key);
  }

  /**
   * Decrements the hit counter for the given client key.
   */
  async decrement(key: string): Promise<void> {
    if (this.redisStore && isRedisReady()) {
      try {
        await this.redisStore.decrement(key);
        return;
      } catch (err: any) {
        this.logOutage('decrement', err);
      }
    }

    return this.memoryStore.decrement(key);
  }

  /**
   * Resets the hit counter for the given client key.
   */
  async resetKey(key: string): Promise<void> {
    if (this.redisStore && isRedisReady()) {
      try {
        await this.redisStore.resetKey(key);
      } catch (err: any) {
        this.logOutage('resetKey', err);
      }
    }

    return this.memoryStore.resetKey(key);
  }

  /**
   * Resets all keys in the store.
   */
  async resetAll(): Promise<void> {
    await this.memoryStore.resetAll?.();
  }

  /**
   * Retrieves client rate limit info.
   */
  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    if (this.redisStore && isRedisReady()) {
      try {
        return await this.redisStore.get(key);
      } catch (err: any) {
        this.logOutage('get', err);
      }
    }

    return this.memoryStore.get(key);
  }

  /**
   * Logs store failure warnings without leaking sensitive client identifiers or secrets.
   */
  private logOutage(operation: string, err: Error): void {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      if (this.isSensitive) {
        console.error(`🚨 [RateLimit Alert] CRITICAL OUTAGE: Redis ${operation} failed for sensitive prefix '${this.prefix}'. Activating local memory throttle fallback.`);
      } else {
        console.warn(`⚠️  [RateLimit Alert] Redis ${operation} failed for prefix '${this.prefix}'. Falling back to local memory throttle.`);
      }
    } else {
      console.warn(`ℹ️  [RateLimit] Redis ${operation} unavailable for prefix '${this.prefix}' (${err?.message || 'offline'}). Using local memory.`);
    }
  }
}

/**
 * Registry to prevent duplicate RedisStore instantiation for the same prefix.
 */
const storeRegistry = new Map<string, ResilientRateLimitStore>();

/**
 * Factory to retrieve or create a ResilientRateLimitStore singleton for a prefix.
 */
export function createRateLimitStore(options: { prefix: string; isSensitive?: boolean }): ResilientRateLimitStore {
  const existing = storeRegistry.get(options.prefix);
  if (existing) {
    return existing;
  }
  const store = new ResilientRateLimitStore(options);
  storeRegistry.set(options.prefix, store);
  return store;
}

/**
 * Internal testing helper to reset the store registry between unit tests.
 */
export function _resetStoreRegistryForTesting(): void {
  storeRegistry.clear();
}

// ============================================================================
// KEY GENERATION HELPERS (IP + Normalized Identifier)
// ============================================================================

function getNormalizedClientIp(req: Request): string {
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || '127.0.0.1');
}

export function hashRateLimitIdentifier(rawIdentifier: string): string {
  return crypto
    .createHash('sha256')
    .update(rawIdentifier.trim().toLowerCase().slice(0, 128))
    .digest('hex')
    .slice(0, 32);
}

function getNormalizedIdentifierHash(req: Request): string | null {
  const raw = req.body?.email || req.body?.identifier;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase().slice(0, 128);
  return trimmed.length > 0 ? hashRateLimitIdentifier(trimmed) : null;
}

export function ipAndIdentifierKey(req: Request): string {
  const ip = getNormalizedClientIp(req);
  const idHash = getNormalizedIdentifierHash(req);
  return idHash ? `${ip}:id:${idHash}` : `ip:${ip}`;
}

export function identifierOnlyKey(req: Request): string {
  const idHash = getNormalizedIdentifierHash(req);
  if (idHash) return `id:${idHash}`;
  const resetToken = typeof req.body?.resetToken === 'string' ? req.body.resetToken.trim() : '';
  if (resetToken.length > 0) {
    return `rt:${hashRateLimitIdentifier(resetToken)}`;
  }
  return `ip:${getNormalizedClientIp(req)}`;
}

// ============================================================================
// EXPORTED RATE LIMITERS
// ============================================================================

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore({ prefix: 'rl:general:' }),
  message: { error: 'Too many requests. 0 attempts left. Please try again in 15 minutes.' },
});

// Preserved for backward compatibility
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore({ prefix: 'rl:auth:', isSensitive: true }),
  message: { error: 'Security limit reached. 0 login attempts left. Please try again in 15 minutes.' },
});

// Route-specific authentication limiters (NAT-friendly per-account+IP + IP-wide flood caps)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipAndIdentifierKey,
  store: createRateLimitStore({ prefix: 'rl:auth:login:', isSensitive: true }),
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

export const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:auth:login-ip:', isSensitive: true }),
  message: { error: 'Too many login requests from this network. Please try again in 15 minutes.' },
});

// Progressive, short-lived IP-independent identifier throttle (resists IP rotation without permanent account DoS)
export const loginAccountLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: identifierOnlyKey,
  store: createRateLimitStore({ prefix: 'rl:auth:login-acct:', isSensitive: true }),
  message: { error: 'Too many authentication attempts. Please try again in a few minutes.' },
});

export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipAndIdentifierKey,
  store: createRateLimitStore({ prefix: 'rl:auth:otp-send:', isSensitive: true }),
  message: { error: 'Too many verification code requests. Please try again in 15 minutes.' },
});

export const otpSendIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:auth:otp-send-ip:', isSensitive: true }),
  message: { error: 'Too many verification code requests from this network. Please try again in 15 minutes.' },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipAndIdentifierKey,
  store: createRateLimitStore({ prefix: 'rl:auth:otp-verify:', isSensitive: true }),
  message: { error: 'Too many verification attempts. Please try again in 15 minutes.' },
});

export const otpVerifyIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:auth:otp-verify-ip:', isSensitive: true }),
  message: { error: 'Too many verification attempts from this network. Please try again in 15 minutes.' },
});

export const otpVerifyAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: identifierOnlyKey,
  store: createRateLimitStore({ prefix: 'rl:auth:otp-verify-acct:', isSensitive: true }),
  message: { error: 'Too many verification attempts. Please try again in 15 minutes.' },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:auth:refresh:', isSensitive: true }),
  message: { error: 'Too many token refresh requests. Please try again shortly.' },
});

export const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:auth:google:', isSensitive: true }),
  message: { error: 'Too many Google Sign-In attempts. Please try again in 15 minutes.' },
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req.user?.id ? `user:${req.user.id}` : getNormalizedClientIp(req)),
  store: createRateLimitStore({ prefix: 'rl:auth:pw-change:', isSensitive: true }),
  message: { error: 'Too many password change attempts. Please try again in 15 minutes.' },
});

export const sosUserLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req.user?.id ? `user:${req.user.id}` : getNormalizedClientIp(req)),
  store: createRateLimitStore({ prefix: 'rl:sos:user:', isSensitive: true }),
  message: { message: 'Too many emergency alerts. Please wait 10 minutes before triggering again.' },
});

export const sosIpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getNormalizedClientIp,
  store: createRateLimitStore({ prefix: 'rl:sos:ip:', isSensitive: true }),
  message: { message: 'Too many emergency alerts from this network. Please wait 10 minutes before triggering again.' },
});

export const geocodingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req.user?.id ? `user:${req.user.id}` : getNormalizedClientIp(req)),
  store: createRateLimitStore({ prefix: 'rl:geocoding:', isSensitive: true }),
  message: { message: 'Too many location lookup requests. Please try again shortly.' },
});

export const documentAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore({ prefix: 'rl:doc-ai:' }),
  message: { error: 'You have 0 document scans left. Please try again next hour.' },
});

export const chatHttpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore({ prefix: 'rl:chat-http:' }),
  message: { error: 'Chat limit reached. 0 messages left. Please wait a few minutes.' },
});

export const riskScoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore({ prefix: 'rl:risk-score:' }),
  message: { error: 'You have 0 risk score calculations left. Please try again next hour.' },
});
