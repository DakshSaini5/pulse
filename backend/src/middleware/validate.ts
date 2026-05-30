import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { z } from 'zod';

// -----------------------------------------------
// Generic Zod Validation Middleware
// -----------------------------------------------
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors = (err as any).issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          message: 'Validation failed. Please check your input.',
          errors: formattedErrors,
        });
      }
      next(err);
    }
  };
};

// -----------------------------------------------
// Validation Schemas
// -----------------------------------------------

// Auth Schemas
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be under 100 characters.')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please provide a valid email address.')
    .max(255, 'Email must be under 255 characters.')
    .trim()
    .toLowerCase(),
  passwordHash: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be under 128 characters.'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please provide a valid email address.')
    .trim()
    .toLowerCase(),
  passwordHash: z
    .string()
    .min(1, 'Password is required.'),
});

export const googleAuthSchema = z.object({
  credential: z
    .string()
    .min(1, 'Google credential token is required.'),
});

// Hospital Review Schema
export const reviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number.')
    .min(1, 'Rating must be between 1 and 5.')
    .max(5, 'Rating must be between 1 and 5.'),
  reviewText: z
    .string()
    .min(10, 'Review must be at least 10 characters.')
    .max(1000, 'Review must be under 1000 characters.')
    .trim(),
});

// Profile Update Schema
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be under 100 characters.')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Please provide a valid email address.')
    .max(255, 'Email must be under 255 characters.')
    .trim()
    .toLowerCase()
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required.'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters.')
    .max(128, 'New password must be under 128 characters.'),
});

// UUID param validator (for route params like :id)
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format.'),
});

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request parameters.',
          errors: (err as any).issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
};
