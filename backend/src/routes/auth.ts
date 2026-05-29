import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pulse_premium_healthcare_security_secret_2894_7421';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, passwordHash } = req.body;

  if (!name || !email || !passwordHash) {
    return res.status(400).json({ message: 'Missing required account details.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(passwordHash, 10);
    // Assign ADMIN role to a designated default email for testing convenience
    const role = email.toLowerCase() === 'admin@pulse.com' ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role,
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
router.post('/login', async (req: Request, res: Response) => {
  const { email, passwordHash } = req.body;

  if (!email || !passwordHash) {
    return res.status(400).json({ message: 'Please provide credentials.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
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
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

export default router;
