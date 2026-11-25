import { createClient } from 'redis';

export type RedisConnectionStatus =
  | 'DISABLED'
  | 'CONFIGURED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'ERROR';

export type RedisClient = ReturnType<typeof createClient<any, any, any, any>>;

export interface RedisStatusInfo {
  status: RedisConnectionStatus;
  url: string;
  isReady: boolean;
  isEnabled: boolean;
}

let clientInstance: RedisClient | null = null;
let connectingPromise: Promise<RedisClient | null> | null = null;
let currentStatus: RedisConnectionStatus = 'DISABLED';

/**
 * Sanitizes a Redis connection string by replacing passwords and usernames
 * with masked strings and stripping query parameters. Never logs secrets.
 */
export function sanitizeRedisUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '(not configured)';
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.password) parsed.password = '***';
    if (parsed.username) parsed.username = '***';
    parsed.search = '';
    return parsed.toString();
  } catch {
    return '[invalid-url-format]';
  }
}

/**
 * Checks whether Redis is connected and ready to process commands.
 */
export function isRedisReady(): boolean {
  return Boolean(clientInstance && clientInstance.isOpen && clientInstance.isReady && currentStatus === 'CONNECTED');
}

/**
 * Returns the current connection status and sanitized metadata.
 */
export function getRedisStatus(): RedisStatusInfo {
  const url = process.env.REDIS_URL;
  return {
    status: currentStatus,
    url: sanitizeRedisUrl(url),
    isReady: isRedisReady(),
    isEnabled: Boolean(url && url.trim().length > 0),
  };
}

/**
 * Returns the existing Redis client singleton, or null if not initialized or disabled.
 */
export function getRedisClient(): RedisClient | null {
  return clientInstance;
}

/**
 * Initializes and connects the singleton Redis client.
 * Non-blocking for local development if REDIS_URL is not set.
 * Emits descriptive logs without leaking credentials.
 */
export async function initRedis(): Promise<RedisClient | null> {
  const rawUrl = process.env.REDIS_URL?.trim();

  if (!rawUrl) {
    currentStatus = 'DISABLED';
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  [Redis Warning] PRODUCTION NOTICE: REDIS_URL is not configured. Distributed rate limiting and shared caching are inactive.');
    } else {
      console.log('ℹ️  [Redis] REDIS_URL is not configured. Running in local standalone mode without Redis.');
    }
    return null;
  }

  // Return existing active instance if already initialized
  if (clientInstance) {
    return clientInstance;
  }

  // Prevent multiple simultaneous connection handshakes
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const sanitizedUrl = sanitizeRedisUrl(rawUrl);
    currentStatus = 'CONFIGURED';

    try {
      console.log(`🔌 [Redis] Initializing client for ${sanitizedUrl}...`);

      const client = createClient({
        url: rawUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            const maxAttempts = parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || '10', 10);
            if (retries >= maxAttempts) {
              console.error(`❌ [Redis] Max reconnection attempts (${retries}/${maxAttempts}) reached for ${sanitizedUrl}. Halting reconnection.`);
              return false; // Stop reconnecting to prevent unbounded loops
            }
            // Bounded backoff: exponential backoff capped at 3000ms
            const delay = Math.min(Math.pow(2, retries) * 50 + Math.floor(Math.random() * 50), 3000);
            console.warn(`🔄 [Redis] Reconnecting attempt ${retries + 1}/${maxAttempts} in ${delay}ms...`);
            return delay;
          },
        },
      });

      // Register connection lifecycle listeners BEFORE connecting to catch any initialization errors
      client.on('error', (err) => {
        // Prevent unhandled error exceptions in event loop
        if (!client.isReady) {
          currentStatus = 'ERROR';
        }
        console.error(`❌ [Redis Error] ${err?.message || 'Connection error occurred'}`);
      });

      client.on('connect', () => {
        currentStatus = 'CONNECTING';
        console.log(`🔌 [Redis] Socket connected to ${sanitizedUrl}.`);
      });

      client.on('ready', () => {
        currentStatus = 'CONNECTED';
        console.log(`✅ [Redis] Connection ready and operational at ${sanitizedUrl}.`);
      });

      client.on('reconnecting', () => {
        currentStatus = 'RECONNECTING';
        console.warn(`⚠️  [Redis] Reconnecting to ${sanitizedUrl}...`);
      });

      client.on('end', () => {
        currentStatus = 'DISCONNECTED';
        console.log('ℹ️  [Redis] Connection closed.');
      });

      clientInstance = client;

      await client.connect();
      return clientInstance;
    } catch (err: any) {
      currentStatus = 'ERROR';
      console.error(`❌ [Redis Connection Failed] Unable to establish initial connection to ${sanitizedUrl}:`, err?.message || err);
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 [Redis Alert] PRODUCTION WARNING: Redis connection could not be established. Distributed rate limiting is degraded.');
      }
      return clientInstance;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/**
 * Closes the Redis connection cleanly during graceful server shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (!clientInstance) {
    currentStatus = process.env.REDIS_URL ? 'DISCONNECTED' : 'DISABLED';
    return;
  }

  const clientToClose = clientInstance;
  clientInstance = null;
  connectingPromise = null;

  try {
    if (clientToClose.isOpen) {
      // Race quit with timeout so server shutdown is never blocked indefinitely
      await Promise.race([
        clientToClose.quit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis quit timeout after 3s')), 3000)),
      ]);
      console.log('🛑 [Redis] Connection closed cleanly.');
    } else {
      clientToClose.disconnect();
    }
  } catch (err: any) {
    console.warn('⚠️  [Redis] Error during quit, forcing disconnect:', err?.message || err);
    try {
      clientToClose.disconnect();
    } catch {}
  } finally {
    currentStatus = process.env.REDIS_URL ? 'DISCONNECTED' : 'DISABLED';
  }
}

/**
 * Internal testing helper to reset the module's state between test runs.
 */
export function _resetRedisClientForTesting(): void {
  clientInstance = null;
  connectingPromise = null;
  currentStatus = process.env.REDIS_URL ? 'CONFIGURED' : 'DISABLED';
}
