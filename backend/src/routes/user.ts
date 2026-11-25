import express, { Response } from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate, updateProfileSchema, changePasswordSchema } from '../middleware/validate';
import { passwordChangeLimiter } from '../middleware/rateLimiter';
import * as bcrypt from 'bcryptjs';
import { extractPublicId, destroyCloudinaryAsset } from '../utils/fileSecurity';
import {
  reserveOTPCooldown,
  createOTPChallenge,
  verifyAndConsumeOTP,
  normalizeEmail,
  incrementUserTokenVersion,
} from '../utils/accountSecurity';

const router = express.Router();

// Get profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        role: true,
        authProvider: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            prescriptions: true,
            medicalReports: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update profile (name only — email requires separate OTP verification per BUG-10)
router.patch('/profile', authenticateToken, validate(updateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        role: true,
        authProvider: true,
        avatar: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Step 1 — Request email change — sends an OTP to the NEW email address (SEC-04 fix)
router.post('/request-email-change', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newEmail } = req.body;
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ message: 'A valid new email address is required.' });
  }

  const normalizedEmail = normalizeEmail(newEmail);

  try {
    // Check this email isn't already used by someone else
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(400).json({ message: 'This email address is already registered to another account.' });
    }

    // Atomically reserve cooldown for EMAIL_CHANGE
    const cooldown = await reserveOTPCooldown(normalizedEmail, 'EMAIL_CHANGE');
    if (!cooldown.allowed) {
      return res.status(429).json({
        message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting a new verification code.`
      });
    }

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const userId = req.user!.id;

    // Create challenge scoped to EMAIL_CHANGE bound to THIS authenticated user (SEC-06 fix)
    const otpRecord = await createOTPChallenge(normalizedEmail, code, expiresAt, 'EMAIL_CHANGE', userId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [EMAIL CHANGE OTP] ${req.user!.id} → new email ${normalizedEmail}: ${code}`);
    } else {
      console.log(`📧 [EMAIL CHANGE OTP] Generated for user ${req.user!.id}`);
    }

    // Send via Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    let sentViaResend = false;
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.SENDER_EMAIL || 'Pulse Security <security@resend.dev>',
            to: normalizedEmail,
            subject: 'Verify your new Pulse email address',
            html: `<div style="font-family:sans-serif;padding:24px;max-width:480px;margin:0 auto;">
              <h2 style="color:#ef4444;">Email Change Verification</h2>
              <p>Your verification code to confirm the new email address on your Pulse account is:</p>
              <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1e293b;text-align:center;padding:16px 0;">${code}</div>
              <p style="color:#64748b;font-size:12px;">This code expires in 15 minutes. If you did not request this change, please ignore this email.</p>
            </div>`
          })
        });
        if (response.ok) {
          sentViaResend = true;
        } else {
          console.error('Resend email change delivery failed');
        }
      } catch (emailErr) {
        console.error('Failed to send email change OTP via Resend:', emailErr);
      }
    }

    if (!sentViaResend && process.env.NODE_ENV === 'production') {
      await prisma.oTPVerification.deleteMany({ where: { id: otpRecord.id } });
      return res.status(502).json({
        message: 'Failed to deliver verification email. Please try again later.'
      });
    }

    return res.json({ message: `Verification code sent to ${normalizedEmail}. Please check your inbox.` });
  } catch (err) {
    console.error('Error in request-email-change:', err);
    return res.status(500).json({ message: 'Failed to send verification code.' });
  }
});

// Step 2 — Confirm email change — verify OTP atomically and commit the new email in ONE transaction (SEC-06 fix)
router.post('/confirm-email-change', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newEmail, code } = req.body;
  if (!newEmail || !code) {
    return res.status(400).json({ message: 'New email and verification code are required.' });
  }

  const normalizedEmail = normalizeEmail(newEmail);
  const userId = req.user!.id;

  try {
    // Execute OTP verification, uniqueness check, and user update in a single atomic transaction
    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Verify and consume OTP bound to THIS authenticated user within tx
      const otpResult = await verifyAndConsumeOTP(normalizedEmail, code, 'EMAIL_CHANGE', userId, tx);
      if (!otpResult.success) {
        const error: any = new Error(otpResult.message);
        error.isOtpError = true;
        error.otpReason = otpResult.reason;
        throw error;
      }

      // 2. Check for race condition / uniqueness collision within transaction
      const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && existing.id !== userId) {
        const conflictErr: any = new Error('This email address is already registered to another account.');
        conflictErr.isConflict = true;
        throw conflictErr;
      }

      // 3. Commit the email change within the exact same transaction
      return await tx.user.update({
        where: { id: userId },
        data: { email: normalizedEmail },
        select: { id: true, name: true, email: true, mobileNumber: true, role: true, authProvider: true, avatar: true }
      });
    });

    return res.json({ message: 'Email address updated successfully.', user: updatedUser });
  } catch (err: any) {
    if (err.isOtpError) {
      return res.status(400).json({ message: err.message });
    }
    if (err.isConflict) {
      return res.status(409).json({ message: err.message });
    }
    // Handle Prisma P2002 Unique Constraint violation safely
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ message: 'This email address is already registered to another account.' });
    }

    console.error('Error in confirm-email-change:', err);
    return res.status(500).json({ message: 'Failed to confirm email change.' });
  }
});


// Change password
router.post('/change-password', authenticateToken, passwordChangeLimiter, validate(changePasswordSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.authProvider === 'GOOGLE' && !user.passwordHash) {
      return res.status(400).json({ message: 'Google users cannot change password' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!isValid) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          refreshToken: null
        }
      });
      // Invalidate all existing access sessions
      await incrementUserTokenVersion(user.id, tx);
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

const CLEANUP_PREFIX = 'cleanup_asset:';
const CLEANUP_DEADLETTER_PREFIX = 'cleanup_deadletter:';
export const MAX_CLEANUP_RETRIES = 10;
export const MAX_CLEANUP_BACKOFF_MS = 60 * 60 * 1000; // 1 hour max delay
const BASE_CLEANUP_BACKOFF_MS = 60 * 1000; // 1 minute base delay

let cleanupWorkerTimer: NodeJS.Timeout | null = null;
let cleanupWorkerRunning = false;
let activeCleanupPromise: Promise<{ processed: number; failed: number; deadLettered: number }> | null = null;

/**
 * Computes bounded exponential backoff in milliseconds for a given retry count.
 */
export function computeCleanupBackoffMs(failedAttempts: number): number {
  const exp = Math.max(0, failedAttempts - 1);
  return Math.min(BASE_CLEANUP_BACKOFF_MS * Math.pow(2, exp), MAX_CLEANUP_BACKOFF_MS);
}

/**
 * Processes pending durable Cloudinary cleanup outbox entries stored in AccountLockout.
 * Uses atomic PostgreSQL UPDATE ... WHERE claiming so concurrent workers/instances
 * cannot process the same asset simultaneously.
 * Safe and idempotent: already-deleted assets return 'not found' (success=true) and are cleared.
 * Failed items use exponential backoff up to MAX_CLEANUP_BACKOFF_MS and move to dead-letter after MAX_CLEANUP_RETRIES.
 */
export async function processPendingCloudinaryCleanups(onlyIdentifiers?: string[]): Promise<{ processed: number; failed: number; deadLettered: number }> {
  const candidates = await prisma.accountLockout.findMany({
    where: onlyIdentifiers
      ? { identifier: { in: onlyIdentifiers } }
      : {
        identifier: { startsWith: CLEANUP_PREFIX },
        failedAttempts: { lt: MAX_CLEANUP_RETRIES },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }],
      },
    select: { identifier: true },
    orderBy: { identifier: 'asc' },
    take: 50,
  });

  let processed = 0;
  let failed = 0;
  let deadLettered = 0;

  for (const row of candidates) {
    // Atomically claim the job with a 2-minute lease so no other worker/instance processes it concurrently
    const claimed = await prisma.$queryRaw<Array<{ identifier: string; failedAttempts: number; lockedUntil: Date }>>`
      UPDATE "AccountLockout"
      SET "lockedUntil" = NOW() + INTERVAL '2 minutes', "updatedAt" = NOW()
      WHERE "identifier" = ${row.identifier}
        AND "failedAttempts" < ${MAX_CLEANUP_RETRIES}
        AND ("lockedUntil" IS NULL OR "lockedUntil" <= NOW())
      RETURNING "identifier", "failedAttempts", "lockedUntil";
    `;

    if (!claimed || claimed.length === 0) {
      continue;
    }

    const leaseUntil = claimed[0].lockedUntil;
    const rest = row.identifier.slice(CLEANUP_PREFIX.length);
    const firstColon = rest.indexOf(':');
    const secondColon = firstColon >= 0 ? rest.indexOf(':', firstColon + 1) : -1;
    if (firstColon < 0 || secondColon < 0) {
      await prisma.accountLockout.deleteMany({
        where: { identifier: row.identifier, lockedUntil: leaseUntil },
      }).catch(() => { });
      continue;
    }

    const deliveryType = rest.slice(0, firstColon);
    const resourceType = rest.slice(firstColon + 1, secondColon);
    const publicId = rest.slice(secondColon + 1);

    const cleanup = await destroyCloudinaryAsset(publicId, deliveryType, resourceType);
    if (cleanup.success) {
      const deleted = await prisma.accountLockout.deleteMany({
        where: { identifier: row.identifier, lockedUntil: leaseUntil },
      }).catch(() => ({ count: 0 }));
      if (deleted.count > 0) {
        processed += 1;
      }
    } else {
      const nextAttempts = (claimed[0].failedAttempts || 0) + 1;
      if (nextAttempts >= MAX_CLEANUP_RETRIES) {
        const deadLetterKey = `${CLEANUP_DEADLETTER_PREFIX}${rest}`;
        const updatedDead = await prisma.$executeRaw`
          UPDATE "AccountLockout"
          SET "identifier" = ${deadLetterKey},
              "failedAttempts" = ${nextAttempts},
              "lastFailedAt" = NOW(),
              "lockedUntil" = NULL,
              "updatedAt" = NOW()
          WHERE "identifier" = ${row.identifier}
            AND "lockedUntil" = ${leaseUntil};
        `.catch(() => 0);
        if (updatedDead > 0) {
          deadLettered += 1;
          console.error('[Cleanup Outbox] Asset moved to dead-letter after max retries.');
        }
      } else {
        const backoffMs = computeCleanupBackoffMs(nextAttempts);
        const nextRetryAt = new Date(Date.now() + backoffMs);
        const updatedRetry = await prisma.accountLockout.updateMany({
          where: { identifier: row.identifier, lockedUntil: leaseUntil },
          data: {
            failedAttempts: nextAttempts,
            lastFailedAt: new Date(),
            lockedUntil: nextRetryAt,
          },
        }).catch(() => ({ count: 0 }));
        if (updatedRetry.count > 0) {
          failed += 1;
        }
      }
    }
  }

  return { processed, failed, deadLettered };
}

export function startCloudinaryCleanupWorker(intervalMs: number = 5 * 60 * 1000): void {
  if (cleanupWorkerTimer) return;
  cleanupWorkerTimer = setInterval(async () => {
    if (cleanupWorkerRunning) return;
    cleanupWorkerRunning = true;
    const run = processPendingCloudinaryCleanups();
    activeCleanupPromise = run;
    try {
      await run;
    } catch {
      console.error('[Cleanup Outbox] Periodic worker iteration failed.');
    } finally {
      if (activeCleanupPromise === run) {
        activeCleanupPromise = null;
      }
      cleanupWorkerRunning = false;
    }
  }, intervalMs);
  cleanupWorkerTimer.unref?.();
}

export async function stopCloudinaryCleanupWorker(): Promise<void> {
  if (cleanupWorkerTimer) {
    clearInterval(cleanupWorkerTimer);
    cleanupWorkerTimer = null;
  }
  if (activeCleanupPromise) {
    try {
      await activeCleanupPromise;
    } catch {
      // Ignore errors from in-flight iteration during shutdown
    }
  }
}

// Delete account (requires fresh re-authentication; never accepts target userId from body)
router.delete('/account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const lockKey = `deleting_user:${userId}`;
  let lockAcquired = false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, authProvider: true, googleId: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // 1. Enforce genuine step-up re-authentication
    if (user.passwordHash) {
      const password = req.body?.password;
      if (typeof password !== 'string' || password.length === 0) {
        return res.status(401).json({
          message: 'Password verification is required to delete your account.',
          requiresReauth: true,
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    } else {
      // Google / passwordless account: strictly require a fresh verified Google ID token.
      // Never accept a refreshed access JWT alone as proof of recent authentication.
      const googleCredential = typeof req.body?.googleCredential === 'string' ? req.body.googleCredential.trim() : '';
      if (!googleCredential) {
        return res.status(401).json({
          message: 'Fresh Google Sign-In verification is required to delete your account.',
          requiresReauth: true,
        });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(503).json({ message: 'Google re-authentication is unavailable.' });
      }

      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: googleCredential, audience: clientId });
        const payload = ticket.getPayload();
        const validIssuer = payload?.iss === 'https://accounts.google.com' || payload?.iss === 'accounts.google.com';
        if (!payload || !validIssuer || !payload.sub) {
          return res.status(401).json({ message: 'Google re-authentication failed.' });
        }

        // Prefer exact Google subject (sub) matching when googleId is stored
        if (user.googleId) {
          if (payload.sub !== user.googleId) {
            return res.status(401).json({ message: 'Google account does not match this account.' });
          }
        } else if (!payload.email_verified || payload.email?.toLowerCase() !== user.email.toLowerCase()) {
          return res.status(401).json({ message: 'Google account verification failed.' });
        }
      } catch {
        return res.status(401).json({ message: 'Google re-authentication failed or expired.' });
      }
    }

    // 2. Acquire atomic in-flight deletion lock to prevent duplicate/concurrent deletion races
    const lockId = crypto.randomUUID();
    const lockRows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
      VALUES (${lockId}, ${lockKey}, 1, NOW() + INTERVAL '5 minutes', NOW(), NOW(), NOW())
      ON CONFLICT ("identifier") DO UPDATE SET
        "lockedUntil" = NOW() + INTERVAL '5 minutes',
        "lastFailedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "AccountLockout"."lockedUntil" IS NULL OR "AccountLockout"."lockedUntil" <= NOW()
      RETURNING "id";
    `;
    if (!lockRows || lockRows.length === 0) {
      return res.status(409).json({ message: 'Account deletion is already in progress.' });
    }
    lockAcquired = true;

    // 3. Atomically revoke sessions, enqueue durable Cloudinary cleanup outbox entries, and delete user in PostgreSQL.
    // If this transaction fails, neither the user nor any Cloudinary assets are deleted.
    // Preserve auth_v:<userId> so any previously issued JWTs continue returning 401.
    const cleanupIdentifiers: string[] = [];

    await prisma.$transaction(async (tx) => {
      const [prescriptions, reports] = await Promise.all([
        tx.prescription.findMany({
          where: { userId },
          select: { fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
        }),
        tx.medicalReport.findMany({
          where: { userId },
          select: { fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
        }),
      ]);

      const allAssets = [
        ...prescriptions.map(p => ({
          publicId: p.publicId || extractPublicId(p.fileUrl),
          deliveryType: p.deliveryType || 'authenticated',
          resourceType: p.resourceType || 'image',
        })),
        ...reports.map(r => ({
          publicId: r.publicId || extractPublicId(r.fileUrl),
          deliveryType: r.deliveryType || 'authenticated',
          resourceType: r.resourceType || 'image',
        })),
      ].filter((a): a is { publicId: string; deliveryType: string; resourceType: string } => Boolean(a.publicId));

      await incrementUserTokenVersion(userId, tx);

      for (const asset of allAssets) {
        const outboxKey = `${CLEANUP_PREFIX}${asset.deliveryType}:${asset.resourceType}:${asset.publicId}`;
        cleanupIdentifiers.push(outboxKey);
        await tx.$queryRaw`
          INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
          VALUES (${crypto.randomUUID()}, ${outboxKey}, 0, NULL, NOW(), NOW(), NOW())
          ON CONFLICT ("identifier") DO NOTHING;
        `;
      }

      await tx.accountLockout.deleteMany({
        where: {
          identifier: {
            in: [`user:${userId}`, lockKey, `sos_dedup:${userId}`],
          },
        },
      });

      await tx.user.delete({ where: { id: userId } });
    });
    lockAcquired = false;

    // 4. Execute durable Cloudinary cleanup outside transaction; failed items stay in outbox for retry/startup recovery
    if (cleanupIdentifiers.length > 0) {
      const { failed } = await processPendingCloudinaryCleanups(cleanupIdentifiers);
      if (failed > 0) {
        console.warn(`[Account Delete] ${failed} Cloudinary cleanup item(s) queued in durable outbox for retry.`);
      }
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    if (lockAcquired) {
      await prisma.accountLockout.deleteMany({ where: { identifier: lockKey } }).catch(() => { });
    }
    console.error(`Account delete error for user ${userId}`);
    return res.status(500).json({ message: 'Failed to delete account. Please contact support.' });
  }
});

export default router;
