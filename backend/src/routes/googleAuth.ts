import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db';
import { validate, googleAuthSchema } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// Initialize Google OAuth2 client dynamically
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { client: null, clientId: null };
  return { client: new OAuth2Client(clientId), clientId };
};

// POST /api/auth/google — Google OAuth login/register
router.post('/google', authLimiter, validate(googleAuthSchema), async (req: Request, res: Response) => {
  const { credential } = req.body;
  const { client, clientId } = getGoogleClient();

  if (!client || !clientId) {
    return res.status(503).json({ 
      message: 'Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
    });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google credential. Could not extract user data.' });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { googleId: googleId },
        ],
      },
    });

    if (user) {
      // Update Google info if they logged in with email before but now using Google
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar: picture || user.avatar,
            authProvider: 'GOOGLE',
          },
        });
      }
    } else {
      // Create new user — no password needed for Google users
      user = await prisma.user.create({
        data: {
          email: email!,
          name: name || email!.split('@')[0],
          googleId,
          avatar: picture || null,
          authProvider: 'GOOGLE',
          role: 'USER',
          notifications: {
            create: {
              title: 'Welcome to Pulse!',
              message: 'Your account is created via Google. Start scanning prescriptions or search hospitals near your location.',
              type: 'SUCCESS',
            },
          },
        },
      });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (err: any) {
    console.error('Google OAuth error:', err.message || err);
    return res.status(401).json({ 
      message: 'Google authentication failed. The token may be expired or invalid.' 
    });
  }
});

export default router;
