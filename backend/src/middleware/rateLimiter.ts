import rateLimit from 'express-rate-limit';

// -----------------------------------------------
// Rate Limiters for Different Endpoint Tiers
// NOTE (BUG-18): These use express-rate-limit's default in-memory store.
// Rate limit counts reset on every server restart (e.g. Render cold starts).
// For production-grade persistence, swap to rate-limit-redis or rate-limit-postgresql.
// Current mitigation: trust the Render/Vercel proxy IP header correctly via
// app.set('trust proxy', 1) in index.ts, and use keyGenerator to prevent spoofing.
// -----------------------------------------------

const keyGenerator = (req: any) => {
  // Use the real IP from Render's reverse proxy, fallback to socket IP
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
};

// Auth endpoints: 5 requests per 15 minutes per IP (prevents brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
  keyGenerator,
  message: {
    message: 'Search rate limit reached. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
