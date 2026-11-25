
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { validate, registerSchema, loginSchema } from '../middleware/validate';
import {
  loginLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  otpSendLimiter,
  otpSendIpLimiter,
  otpVerifyLimiter,
  otpVerifyIpLimiter,
  otpVerifyAccountLimiter,
  refreshLimiter,
  authLimiter,
} from '../middleware/rateLimiter';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  reserveOTPCooldown,
  createOTPChallenge,
  verifyAndConsumeOTP,
  recordFailedLogin,
  resetAccountLockout,
  normalizeEmail,
  hashToken,
  markResetTokenConsumed,
  getUserTokenVersion,
  incrementUserTokenVersion,
} from '../utils/accountSecurity';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

const REFRESH_COOKIE_NAME = 'pulse_rf';

export function setRefreshCookie(res: Response, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
  });
}

export function shouldIncludeRefreshTokenInBody(req: Request): boolean {
  const clientPlatform = String(req.headers['x-client-platform'] || '').toLowerCase();
  if (clientPlatform === 'native') return true;
  if (clientPlatform === 'web') return false;
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/$/, '') : '';
  if (origin && origin !== 'capacitor://localhost' && origin !== 'ionic://localhost') {
    return false;
  }
  return true;
}

function getRefreshCookie(req: Request): string | null {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;
  for (const part of rawCookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const name = part.slice(0, idx).trim();
      if (name === REFRESH_COOKIE_NAME) {
        return decodeURIComponent(part.slice(idx + 1).trim());
      }
    }
  }
  return null;
}

// Pre-computed bcrypt hash for constant-time comparison on nonexistent accounts to prevent timing side channels
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
  : [];

// Helper to generate 6-digit numeric code
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register/send-otp
router.post('/register/send-otp', otpSendIpLimiter, otpSendLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const emailLower = normalizeEmail(email);
    
    // 1. Check if email already in use before reserving cooldown
    const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // 2. Atomically reserve cooldown for REGISTRATION (SEC-01 TOCTOU fix)
    const cooldown = await reserveOTPCooldown(emailLower, 'REGISTRATION');
    if (!cooldown.allowed) {
      return res.status(429).json({
        message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting a new verification code.`
      });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create challenge scoped to REGISTRATION & set independent cooldown
    const otpRecord = await createOTPChallenge(emailLower, code, expiresAt, 'REGISTRATION');

    if (process.env.NODE_ENV === 'development') {
      console.log(`✉️ [REGISTRATION OTP] Sent to ${emailLower}: ${code}`);
    } else {
      console.log(`✉️ [REGISTRATION OTP] Generated for ${emailLower}`);
    }

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
      await prisma.oTPVerification.deleteMany({ where: { id: otpRecord.id } });
      return res.status(502).json({
        message: 'Failed to deliver verification email. Please try again later.'
      });
    }

    return res.json({ 
      message: 'Verification OTP has been sent to your email.'
    });
  } catch (err: any) {
    console.error('Request registration email OTP error:', err);
    return res.status(500).json({ message: 'Internal server error requesting verification code.' });
  }
});

// POST /api/auth/register
router.post('/register', otpVerifyIpLimiter, otpVerifyAccountLimiter, otpVerifyLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, mobileNumber, password, code } = req.body;

  try {
    const emailLower = normalizeEmail(email);

    // Atomic transaction: verify OTP and create account inside ONE atomic transaction (SEC-06 & Finding 06)
    // If account creation fails (e.g. unique constraint collision), OTP consumption rolls back!
    const registrationResult = await prisma.$transaction(async (tx) => {
      // 1. Verify OTP code within transaction
      const otpResult = await verifyAndConsumeOTP(emailLower, code, 'REGISTRATION', undefined, tx);
      if (!otpResult.success) {
        const err: any = new Error(otpResult.message);
        err.isOtpError = true;
        throw err;
      }

      // 2. Check collision inside transaction
      const existingEmail = await tx.user.findUnique({ where: { email: emailLower } });
      if (existingEmail) {
        const err: any = new Error('An account with this email already exists.');
        err.isConflict = true;
        throw err;
      }

      if (mobileNumber) {
        const existingMobile = await tx.user.findUnique({ where: { mobileNumber } });
        if (existingMobile) {
          const err: any = new Error('An account with this mobile number already exists.');
          err.isConflict = true;
          throw err;
        }
      }

      const hashed = await bcrypt.hash(password, 10);
      const userRole = ADMIN_EMAILS.includes(emailLower) ? 'ADMIN' : 'USER';

      // 3. Create user
      const user = await tx.user.create({
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

      // 4. Issue access token with explicit purpose and session token version
      const tokenVersion = await getUserTokenVersion(user.id, tx);
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, v: tokenVersion, purpose: 'access' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // 5. Issue refresh token with jti, family, and purpose; store only SHA-256 digest at rest
      const refreshJti = crypto.randomUUID();
      const familyId = crypto.randomUUID();
      const refreshToken = jwt.sign(
        { id: user.id, jti: refreshJti, family: familyId, purpose: 'refresh' },
        JWT_SECRET,
        { expiresIn: '90d' }
      );

      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(refreshToken) }
      });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
        },
      };
    });

    setRefreshCookie(res, registrationResult.refreshToken);
    const { refreshToken: _regRf, ...regBody } = registrationResult;
    return res.status(201).json(
      shouldIncludeRefreshTokenInBody(req) ? registrationResult : regBody
    );
  } catch (err: any) {
    if (err.isOtpError) {
      return res.status(400).json({ message: err.message });
    }
    if (err.isConflict) {
      return res.status(400).json({ message: err.message });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server registration error.' });
  }
});

// POST /api/auth/login
router.post('/login', loginIpLimiter, loginAccountLimiter, loginLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    const rawIdentifier = identifier.trim();
    const normalizedEmail = rawIdentifier.toLowerCase();

    // Look up user first to resolve canonical identity (C-01 fix)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { mobileNumber: rawIdentifier }
        ]
      }
    });

    // Unknown identifier: prevent DB growth (M-03) and timing leakage (H-02)
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: 'Invalid identifier or password.' });
    }

    // Google OAuth users don't have a password
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'This account uses Google Sign-In. Please log in with Google.' 
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash!);
    if (!matches) {
      // Record failed login for canonical identity for security auditing
      await recordFailedLogin(`user:${user.id}`);
      // Return identical 401 response without leaking account existence or status discrepancies (SEC-02 & SEC-03)
      return res.status(401).json({
        message: 'Invalid identifier or password.'
      });
    }

    // Reset account failed login tracking for canonical identity upon successful password match
    await resetAccountLockout(`user:${user.id}`);

    let userRole = user.role;
    if (ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      userRole = 'ADMIN';
    }

    const tokenVersion = await getUserTokenVersion(user.id);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole, v: tokenVersion, purpose: 'access' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const refreshJti = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { id: user.id, jti: refreshJti, family: familyId, purpose: 'refresh' },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(refreshToken) }
    });

    setRefreshCookie(res, refreshToken);
    return res.json({
      token,
      ...(shouldIncludeRefreshTokenInBody(req) ? { refreshToken } : {}),
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

  // Prevent mobile number harvesting / enumeration (L-02 fix)
  return res.json({
    available: true,
    message: 'Mobile number availability validation is confirmed during registration submission.'
  });
});

// POST /api/auth/forgot-password/request-email
router.post('/forgot-password/request-email', otpSendIpLimiter, otpSendLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const emailLower = normalizeEmail(email);

    // Atomically reserve cooldown for PASSWORD_RESET (SEC-01 TOCTOU fix)
    const cooldown = await reserveOTPCooldown(emailLower, 'PASSWORD_RESET');
    if (!cooldown.allowed) {
      return res.status(429).json({
        message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting a new verification code.`
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    // Account enumeration protection: return generic message if user does not exist
    if (!user) {
      await bcrypt.compare('dummy', DUMMY_HASH);
      return res.json({
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }

    if (emailLower === process.env.PRIMARY_ADMIN_EMAIL?.toLowerCase()) {
      return res.status(403).json({ message: 'Password recovery is disabled for the administrator account.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create challenge scoped to PASSWORD_RESET & set independent cooldown
    const otpRecord = await createOTPChallenge(emailLower, code, expiresAt, 'PASSWORD_RESET');

    // Send email using Resend API (or fallback to console log for local dev)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✉️ [EMAIL OTP] Sent to ${emailLower}: ${code}`);
    } else {
      console.log(`✉️ [EMAIL OTP] Generated for ${emailLower}`);
    }

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
            to: emailLower,
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
      console.warn(`[WARNING] Resend API failed. Email was not delivered to ${emailLower}`);
      await prisma.oTPVerification.deleteMany({ where: { id: otpRecord.id } });
      return res.status(502).json({
        message: 'Failed to deliver verification email. Please try again later.'
      });
    }

    return res.json({
      message: 'If an account exists with this email, a verification code has been sent.'
    });
  } catch (err: any) {
    console.error('Request email OTP error:', err);
    return res.status(500).json({ message: 'Internal server error requesting code.' });
  }
});

// POST /api/auth/forgot-password/verify-email
router.post('/forgot-password/verify-email', otpVerifyIpLimiter, otpVerifyAccountLimiter, otpVerifyLimiter, async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required.' });
  }

  try {
    const emailLower = normalizeEmail(email);

    // Verify OTP code first (scoped to PASSWORD_RESET)
    const otpResult = await verifyAndConsumeOTP(emailLower, code, 'PASSWORD_RESET');
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Code verified, generate a temporary signed resetToken with unique cryptographic jti
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const resetJti = crypto.randomUUID();
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, jti: resetJti, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({ resetToken });
  } catch (err: any) {
    console.error('Verify email OTP error:', err);
    return res.status(500).json({ message: 'Internal verification validation error.' });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', otpVerifyIpLimiter, otpVerifyAccountLimiter, otpVerifyLimiter, async (req: Request, res: Response) => {
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
    let resetJti: string | null = null;

    if (resetToken) {
      // Flow A: Verified via Email OTP Token
      try {
        const decoded = jwt.verify(resetToken, JWT_SECRET) as { id: string; jti?: string; purpose: string };
        if (decoded.purpose !== 'reset-password' || !decoded.id || !decoded.jti) {
          return res.status(400).json({ message: 'Invalid recovery token usage.' });
        }
        userId = decoded.id;
        resetJti = decoded.jti;
      } catch {
        return res.status(400).json({ message: 'Password recovery session has expired. Please request a new code.' });
      }
    } else {
      return res.status(400).json({ message: 'Missing verification token.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Atomic transaction: single-use token consumption, password update, and session invalidation
    await prisma.$transaction(async (tx) => {
      // 1. Atomically consume the single-use reset token
      const consumed = await markResetTokenConsumed(resetJti!, tx);
      if (!consumed) {
        const err: any = new Error('Password recovery token has already been used.');
        err.isAlreadyUsed = true;
        throw err;
      }

      // 2. Update password and invalidate all active refresh tokens
      const updatedUser = await tx.user.update({
        where: { id: userId! },
        data: {
          passwordHash: hashed,
          refreshToken: null,
          notifications: {
            create: {
              title: 'Password Security Alert',
              message: 'Your password was successfully updated via self-service verification.',
              type: 'WARNING'
            }
          }
        }
      });

      // 3. Invalidate all active access JWT sessions by incrementing tokenVersion
      await incrementUserTokenVersion(updatedUser.id, tx);
    });

    // Reset account lockout for the recovered user's canonical identity so they can log in immediately
    await resetAccountLockout(`user:${userId}`);

    return res.json({ message: 'Password has been successfully updated.' });
  } catch (err: any) {
    if (err.isAlreadyUsed) {
      return res.status(400).json({ message: err.message });
    }
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

// POST /api/auth/refresh — Refresh access token using secure Refresh Token Rotation (RTR)
router.post('/refresh', refreshLimiter, async (req: Request, res: Response) => {
  const bodyToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
  const cookieToken = !bodyToken ? getRefreshCookie(req) : null;

  // CSRF defense for cookie-based refresh requests
  if (cookieToken && req.headers['x-requested-with'] !== 'PulseClient') {
    return res.status(403).json({ message: 'CSRF validation failed.' });
  }

  const refreshToken = bodyToken || cookieToken;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken.trim(), JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Refresh token is invalid or expired.' });
    }

    // Explicit purpose validation: never accept an access token or other purpose as refresh token
    if (!decoded || decoded.purpose !== 'refresh' || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token purpose or format.' });
    }

    const userId = decoded.id;
    const submittedDigest = hashToken(refreshToken);
    const familyId = decoded.family || crypto.randomUUID();

    const rotationResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, mobileNumber: true, role: true, avatar: true, refreshToken: true }
      });

      if (!user) {
        const notFoundErr: any = new Error('User account not found.');
        notFoundErr.status = 401;
        throw notFoundErr;
      }

      // Check for legacy unhashed refresh tokens during migration
      const matchesDirect = user.refreshToken === submittedDigest;
      const matchesLegacy = user.refreshToken === refreshToken.trim();

      if (matchesDirect || matchesLegacy) {
        // Legitimate rotation!
        const newJti = crypto.randomUUID();
        const newRefreshToken = jwt.sign(
          { id: user.id, jti: newJti, family: familyId, purpose: 'refresh' },
          JWT_SECRET,
          { expiresIn: '90d' }
        );
        const newDigest = hashToken(newRefreshToken);

        // Record consumed jti for reuse detection (stored for 90 days)
        if (decoded.jti) {
          const consumedKey = `consumed_rf:${decoded.jti}`;
          const newId = crypto.randomUUID();
          await tx.$queryRaw`
            INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
            VALUES (${newId}, ${consumedKey}, 0, NOW() + INTERVAL '90 days', NOW(), NOW(), NOW())
            ON CONFLICT ("identifier") DO NOTHING;
          `;
        }

        // Update stored digest atomically with conditional update
        const currentStoredValue = user.refreshToken;
        const updateRes = await tx.$queryRaw<Array<{ id: string }>>`
          UPDATE "User"
          SET "refreshToken" = ${newDigest}
          WHERE "id" = ${user.id} AND "refreshToken" = ${currentStoredValue}
          RETURNING "id";
        `;

        if (!updateRes || updateRes.length === 0) {
          const raceErr: any = new Error('Concurrent token rotation detected.');
          raceErr.status = 401;
          throw raceErr;
        }

        const tokenVersion = await getUserTokenVersion(user.id, tx);
        const newAccessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role, v: tokenVersion, purpose: 'access' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        return {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            avatar: user.avatar,
          }
        };
      }

      // Submitted digest does not match active refreshToken!
      // Check if this jti was already consumed (Token Reuse Detection!).
      // Return a sentinel so the reuse revocation can happen OUTSIDE this transaction
      // (throwing inside would roll back the revocation writes).
      if (decoded.jti) {
        const consumedRecord = await tx.accountLockout.findUnique({
          where: { identifier: `consumed_rf:${decoded.jti}` }
        });

        if (consumedRecord) {
          // Signal reuse to the outer handler; actual revocation runs outside tx
          const reuseErr: any = new Error('__REUSE_DETECTED__');
          reuseErr.isReuseSignal = true;
          reuseErr.reuseUserId = user.id;
          reuseErr.reuseFamilyId = familyId;
          throw reuseErr;
        }
      }

      // Otherwise invalid/expired
      const invalidErr: any = new Error('Refresh token is invalid or expired.');
      invalidErr.status = 401;
      throw invalidErr;
    });

    setRefreshCookie(res, rotationResult.refreshToken);
    if (!bodyToken || !shouldIncludeRefreshTokenInBody(req)) {
      const { refreshToken: _rotRf, ...cookieBody } = rotationResult;
      return res.json(cookieBody);
    }
    return res.json(rotationResult);
  } catch (err: any) {
    // Handle reuse signal: revocation must run in its own committed transaction
    // (throwing inside the detection tx would have rolled back the revocation writes)
    if (err.isReuseSignal) {
      try {
        await prisma.$transaction(async (revokeTx) => {
          await revokeTx.user.update({
            where: { id: err.reuseUserId },
            data: { refreshToken: null }
          });
          await incrementUserTokenVersion(err.reuseUserId, revokeTx);
        });
        console.warn(`🚨 [Security Alert] Refresh token reuse detected for user ${err.reuseUserId}, family ${err.reuseFamilyId}. All sessions revoked.`);
      } catch (revokeErr) {
        console.error('Failed to complete reuse revocation:', revokeErr);
      }
      return res.status(401).json({ message: 'Refresh token reuse detected. All sessions have been revoked.' });
    }
    if (err.status === 401) {
      return res.status(401).json({ message: err.message });
    }
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: 'Refresh token is invalid or expired.' });
  }
});

// POST /api/auth/logout — Invalidate current refresh token
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const bodyRefresh = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
  const cookieRefresh = !bodyRefresh ? getRefreshCookie(req) : null;

  if (cookieRefresh && req.headers['x-requested-with'] !== 'PulseClient') {
    return res.status(403).json({ message: 'CSRF validation failed.' });
  }

  const refreshToken = bodyRefresh || cookieRefresh;

  let accessUserId: string | null = null;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id && decoded.purpose === 'access') {
        accessUserId = decoded.id;
      }
    } catch {
      // Expired or invalid access token — fall back to refreshToken below
    }
  }

  if (accessUserId) {
    await prisma.user.update({
      where: { id: accessUserId },
      data: { refreshToken: null }
    }).catch(() => {});
  } else if (refreshToken && typeof refreshToken === 'string' && refreshToken.trim().length > 0) {
    try {
      const trimmedRefresh = refreshToken.trim();
      const decoded: any = jwt.verify(trimmedRefresh, JWT_SECRET);
      if (decoded && decoded.id && decoded.purpose === 'refresh') {
        const submittedDigest = hashToken(trimmedRefresh);
        await prisma.user.updateMany({
          where: {
            id: decoded.id,
            OR: [
              { refreshToken: submittedDigest },
              { refreshToken: trimmedRefresh }
            ]
          },
          data: { refreshToken: null }
        });
      }
    } catch {
      // Malformed or expired refresh token — ignore safely
    }
  }

  clearRefreshCookie(res);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/logout-all — Invalidate all sessions and tokens across all devices
router.post('/logout-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
    await incrementUserTokenVersion(userId, tx);
  });

  clearRefreshCookie(res);
  return res.json({ success: true, message: 'All sessions have been revoked.' });
});

export default router;
