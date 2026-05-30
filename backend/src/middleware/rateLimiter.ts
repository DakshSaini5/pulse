import rateLimit from 'express-rate-limit';

// -----------------------------------------------
// Rate Limiters for Different Endpoint Tiers
// -----------------------------------------------

// Auth endpoints: 5 requests per 15 minutes per IP (prevents brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
  message: {
    message: 'Search rate limit reached. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
