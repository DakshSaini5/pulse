import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { validate, registerSchema, loginSchema } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
  : [];

// Helper to generate 6-digit numeric code
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register/send-otp
router.post('/register/send-otp', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const emailLower = email.toLowerCase();
    
    // Check if email already in use
    const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // BUG-01 FIX: Purge any old OTP records for this email before creating a fresh one
    await prisma.oTPVerification.deleteMany({ where: { email: emailLower } });

    // Store in DB
    await prisma.oTPVerification.create({
      data: {
        email: emailLower,
        code,
        expiresAt
      }
    });

    console.log(`✉️ [REGISTRATION OTP] Sent to ${emailLower}: ${code}`);

    const resendApiKey = process.env.RESEND_API_KEY;
    let sentViaResend = false;
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.SENDER_EMAIL || 'Pulse Security <security@resend.dev>',
            to: emailLower,
            subject: 'Pulse Account Verification Code',
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #1E60D5; margin-bottom: 8px;">Verify Your Email Address</h2>
                <p style="color: #475569; font-size: 14px;">Welcome to Pulse! Use the verification code below to verify your email and complete registration:</p>
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This verification code will expire in 15 minutes. If you did not register for a Pulse account, you can safely ignore this email.</p>
              </div>
            `
          })
        });

        if (response.ok) {
          sentViaResend = true;
        } else {
          const errData = await response.json();
          console.error('Resend registration OTP delivery failed:', errData);
        }
      } catch (emailErr) {
        console.error('Resend registration OTP delivery exception:', emailErr);
      }
    }

    if (!sentViaResend) {
      console.warn(`[WARNING] Resend API failed. Email was not delivered to ${emailLower}`);
    }

    const isDev = process.env.NODE_ENV === 'development';
    return res.json({ 
      message: 'Verification OTP has been sent to your email.',
      devOtpFallback: isDev ? code : undefined // ONLY IN DEV MODE
    });
  } catch (err: any) {
    console.error('Request registration email OTP error:', err);
    return res.status(500).json({ message: 'Internal server error requesting verification code.' });
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, mobileNumber, password, code } = req.body;

  try {
    const emailLower = email.toLowerCase();
    
    // 1. Verify OTP code first
    const verification = await prisma.oTPVerification.findFirst({
      where: {
        email: emailLower,
        code,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // 2. Check if email already in use
    const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    if (mobileNumber) {
      const existingMobile = await prisma.user.findUnique({ where: { mobileNumber } });
      if (existingMobile) {
        return res.status(400).json({ message: 'An account with this mobile number already exists.' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const userRole = ADMIN_EMAILS.includes(emailLower) ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        mobileNumber,
        passwordHash: hashed,
        role: userRole,
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

    // Clean up used OTPs
    await prisma.oTPVerification.deleteMany({
      where: { email: emailLower }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d',
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server registration error.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    // Find user by email OR mobileNumber
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { mobileNumber: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    // Google OAuth users don't have a password
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'This account uses Google Sign-In. Please log in with Google.' 
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash!);
    if (!matches) {
      return res.status(400).json({ message: 'Invalid identifier or password.' });
    }

    let userRole = user.role;
    if (ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      userRole = 'ADMIN';
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: userRole }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d',
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: userRole,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// POST /api/auth/check-mobile (Check if mobile is already registered)
router.post('/check-mobile', authLimiter, async (req: Request, res: Response) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ message: 'Mobile number is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { mobileNumber }
    });

    return res.json({ exists: !!user });
  } catch (err: any) {
    console.error('Check mobile error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/auth/forgot-password/request-email
router.post('/forgot-password/request-email', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address.' });
    }

    if (email.toLowerCase() === process.env.PRIMARY_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Password recovery is disabled for the administrator account.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // BUG-01 FIX: Purge any old OTP records for this email before creating a fresh one
    await prisma.oTPVerification.deleteMany({ where: { email: email.toLowerCase() } });

    // Store in DB
    await prisma.oTPVerification.create({
      data: {
        email: email.toLowerCase(),
        code,
        expiresAt
      }
    });

    // Send email using Resend API (or fallback to console log for local dev)
    console.log(`✉️ [EMAIL OTP] Sent to ${email}: ${code}`);

    const resendApiKey = process.env.RESEND_API_KEY;
    let sentViaResend = false;
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.SENDER_EMAIL || 'Pulse Security <security@resend.dev>', // Resend sandbox default or custom verified domain
            to: email,
            subject: 'Pulse Account Recovery Code',
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; rounded-corners: 16px;">
                <h2 style="color: #ef4444; margin-bottom: 8px;">Pulse Password Recovery</h2>
                <p style="color: #475569; font-size: 14px;">You requested a password reset for your Pulse account. Use the code below to complete the recovery process:</p>
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This verification code will expire in 10 minutes. If you did not initiate this request, you can safely ignore this email.</p>
              </div>
            `
          })
        });

        if (response.ok) {
          sentViaResend = true;
        } else {
          const errData = await response.json();
          console.error('Resend delivery failed:', errData);
        }
      } catch (emailErr) {
        console.error('Resend service delivery exception:', emailErr);
      }
    }

    if (!sentViaResend) {
      console.warn(`[WARNING] Resend API failed. Email was not delivered to ${email}`);
    }

    const isDev = process.env.NODE_ENV === 'development';
    return res.json({ 
      message: 'Verification OTP has been sent to your email.',
      devOtpFallback: isDev ? code : undefined
    });
  } catch (err: any) {
    console.error('Request email OTP error:', err);
    return res.status(500).json({ message: 'Internal server error requesting code.' });
  }
});

// POST /api/auth/forgot-password/verify-email
router.post('/forgot-password/verify-email', authLimiter, async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required.' });
  }

  try {
    const verification = await prisma.oTPVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Code verified, generate a temporary signed resetToken
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const resetToken = jwt.sign(
      { id: user.id, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Clean up used OTPs
    await prisma.oTPVerification.deleteMany({
      where: { email: email.toLowerCase() }
    });

    return res.json({ resetToken });
  } catch (err: any) {
    console.error('Verify email OTP error:', err);
    return res.status(500).json({ message: 'Internal verification validation error.' });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', authLimiter, async (req: Request, res: Response) => {
  const { newPassword, resetToken } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }
  // Apply same strong password policy as registration
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' });
  }

  try {
    let userId: string | null = null;

    if (resetToken) {
      // Flow A: Verified via Email OTP Token
      try {
        const decoded = jwt.verify(resetToken, JWT_SECRET) as { id: string; purpose: string };
        if (decoded.purpose !== 'reset-password') {
          return res.status(400).json({ message: 'Invalid recovery token usage.' });
        }
        userId = decoded.id;
      } catch {
        return res.status(400).json({ message: 'Password recovery session has expired. Please request a new code.' });
      }
    } else {
      return res.status(400).json({ message: 'Missing verification token.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashed,
        notifications: {
          create: {
            title: 'Password Security Alert',
            message: 'Your password was successfully updated via self-service verification.',
            type: 'WARNING'
          }
        }
      }
    });

    return res.json({ message: 'Password has been successfully updated.' });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(400).json({ message: err.message || 'Reset failed.' });
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
        mobileNumber: true,
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
  } catch (err: any) {
    console.error('Me endpoint error:', err);
    return res.status(500).json({ message: 'Error retrieving user data.' });
  }
});

export default router;

// POST /api/auth/refresh — Refresh access token using refresh token
router.post('/refresh', authLimiter, async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: 'Refresh token is invalid or expired.' });
  }
});
