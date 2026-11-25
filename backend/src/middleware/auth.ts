import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserTokenVersion } from '../utils/accountSecurity';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    iat?: number;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: 'Access denied. Invalid token identity.' });
    }

    // Purpose validation: strictly require purpose === 'access' (rejects missing purpose, refresh, reset, file tokens)
    if (decoded.purpose !== 'access') {
      return res.status(403).json({ message: 'Access denied. Invalid token purpose.' });
    }

    // Session validation: strictly require a valid integer tokenVersion (rejects legacy tokens without v)
    if (typeof decoded.v !== 'number' || !Number.isInteger(decoded.v) || decoded.v < 1) {
      return res.status(401).json({ message: 'Session has been invalidated. Please log in again.' });
    }

    const currentVersion = await getUserTokenVersion(decoded.id);
    if (decoded.v !== currentVersion) {
      return res.status(401).json({ message: 'Session has been revoked. Please log in again.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: typeof decoded.iat === 'number' ? decoded.iat : undefined,
    };
    next();
  } catch (err: any) {
    return res.status(403).json({ message: 'Access denied. Expired or corrupt token.' });
  }
};

export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
  }
  next();
};
