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
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('authentication attempts', 5, '15 minutes')
});

// 2. Document AI Analysis (Prescriptions & Reports): Disabled for testing
export const documentAiLimiter = (req: any, res: any, next: any) => next();

// 3. Global Drug Interaction Scanner: Disabled for testing
export const interactionsLimiter = (req: any, res: any, next: any) => next();

// 4. Health Risk Score Calculator: Disabled for testing
export const riskScoreLimiter = (req: any, res: any, next: any) => next();

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
