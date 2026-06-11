import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

// -----------------------------------------------
// Rate Limiters for Different Endpoint Tiers
// Using Redis Store if REDIS_URL is provided, otherwise falling back to memory.
// -----------------------------------------------

// Initialize Redis client if REDIS_URL exists
let redisClient: ReturnType<typeof createClient> | undefined;

if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  
  // Suppress connection errors from crashing the app if Redis goes down,
  // rate-limit-redis will gracefully degrade or we can handle it
  redisClient.on('error', (err) => console.warn('Redis Client Error:', err));
  
  redisClient.connect().catch((err) => console.warn('Redis connection failed:', err));
}

const getStore = (prefix: string) => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      prefix: `pulse_rl_${prefix}:`,
    });
  }
  return undefined; // Falls back to default memory store if no Redis
};

const keyGenerator = (req: any) => {
  // Use the real IP from Render's reverse proxy, fallback to socket IP
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
};

// Auth endpoints: 5 requests per 15 minutes per IP (prevents brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: getStore('auth'),
  keyGenerator,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI/Analysis endpoints: 10 requests per minute per IP (prevents Gemini cost abuse)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  store: getStore('ai'),
  keyGenerator,
  message: {
    message: 'AI analysis rate limit reached. Please wait a moment before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload endpoints: 5 uploads per hour per IP
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: getStore('upload'),
  keyGenerator,
  message: {
    message: 'Upload limit reached. You can upload up to 5 files per hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: getStore('general'),
  keyGenerator,
  message: {
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search endpoints: 60 requests per minute per IP
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: getStore('search'),
  keyGenerator,
  message: {
    message: 'Search rate limit reached. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
