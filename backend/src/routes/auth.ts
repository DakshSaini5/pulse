import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { validate, registerSchema, loginSchema } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, passwordHash } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(passwordHash, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role: 'USER',
        authProvider: 'EMAIL',
        notifications: {
          create: {
            title: 'Welcome to Pulse!',
            message: 'Your account is created. Start scanning prescriptions or search hospitals near your location.',
            type: 'SUCCESS'
          }
        }
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server registration error.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { email, passwordHash } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // Google OAuth users don't have a password
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'This account uses Google Sign-In. Please log in with Google.' 
      });
    }

    const matches = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me — Verify token and return current user data
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        authProvider: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Me endpoint error:', err);
    return res.status(500).json({ message: 'Error retrieving user data.' });
  }
});

export default router;
