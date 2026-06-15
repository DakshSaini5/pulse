import rateLimit from 'express-rate-limit';

// Global error handler message wrapper
const createRateLimitMessage = (feature: string, limit: number, timeframe: string) => {
  return {
    success: false,
    message: `You have reached your limit of ${limit} ${feature} per ${timeframe}. Please try again later.`,
    error: 'RATE_LIMIT_EXCEEDED'
  };
};

// 1. Authentication Endpoints: 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('authentication attempts', 100, '15 minutes')
});

// 2. Document AI Analysis (Prescriptions & Reports): Max 10 requests per hour per IP
export const documentAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('document analysis requests', 10, '1 hour')
});

// 3. Global Drug Interaction Scanner: Max 20 requests per hour per IP
export const interactionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('drug interaction checks', 20, '1 hour')
});

// 4. Health Risk Score Calculator: Max 20 requests per hour per IP
export const riskScoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('health risk score calculations', 20, '1 hour')
});

// 5. General API Limiter (Global fallback to prevent DDOS)
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow up to 200 general requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to the API. Please slow down.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});
