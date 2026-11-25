import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_COOLDOWN_SECONDS = 60;

export type OTPPurpose = 'REGISTRATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';

/**
 * Returns the dedicated HMAC secret for OTP hashing at rest.
 * Never reuses JWT_SECRET.
 */
export function getOTPHmacSecret(): string {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: OTP_HMAC_SECRET environment variable is not set. Cannot run in production.');
    }
    return 'pulse-development-otp-hmac-secret-key-32-chars-minimum!';
  }
  return secret;
}

/**
 * Computes a cryptographically secure HMAC-SHA-256 digest of an OTP code,
 * bound strictly to the scoped identifier (email + purpose + optional userId).
 */
export function computeOTPDigest(code: string, scopedIdentifier: string): string {
  return crypto
    .createHmac('sha256', getOTPHmacSecret())
    .update(`${scopedIdentifier}:${code.trim()}`)
    .digest('hex');
}

/**
 * Computes a SHA-256 digest of high-entropy tokens (e.g. refresh tokens).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Atomically marks a password-reset token jti as consumed in PostgreSQL.
 * If already consumed (or racing concurrent request), returns false.
 */
export async function markResetTokenConsumed(
  jti: string,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || prisma;
  const key = `consumed_reset:${jti.trim()}`;
  const newId = crypto.randomUUID();

  const rows = await client.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
    VALUES (${newId}, ${key}, 0, NOW() + INTERVAL '1 hour', NOW(), NOW(), NOW())
    ON CONFLICT ("identifier") DO NOTHING
    RETURNING "id";
  `;

  return Boolean(rows && rows.length > 0);
}

/**
 * Increments the user session token version upon password change, reset, or session revocation.
 * Stored authoritatively in PostgreSQL so concurrent reads never observe a stale cache.
 */
export async function incrementUserTokenVersion(
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const client = tx || prisma;
  const newId = crypto.randomUUID();
  const versionKey = `auth_v:${userId.trim()}`;

  const rows = await client.$queryRaw<Array<{ failedAttempts: number }>>`
    INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
    VALUES (${newId}, ${versionKey}, 2, NULL, NOW(), NOW(), NOW())
    ON CONFLICT ("identifier") DO UPDATE SET
      "failedAttempts" = "AccountLockout"."failedAttempts" + 1,
      "updatedAt" = NOW()
    RETURNING "failedAttempts";
  `;

  return rows[0]?.failedAttempts ?? 2;
}

/**
 * Retrieves the authoritative user session token version directly from PostgreSQL
 * (defaults to 1 if unset). Never relies on a potentially stale Redis cache.
 */
export async function getUserTokenVersion(
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const client = tx || prisma;
  const versionKey = `auth_v:${userId.trim()}`;

  const record = await client.accountLockout.findUnique({
    where: { identifier: versionKey },
    select: { failedAttempts: true }
  });

  return record?.failedAttempts ?? 1;
}

export interface FailedLoginAuditRecord {
  failedAttempts: number;
  lastFailedAt: Date;
}

export interface OTPCooldownReservationResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export type OTPVerifyResult = 
  | { success: true; otpId: string }
  | { 
      success: false; 
      reason: 'EXPIRED_OR_NOT_FOUND' | 'MAX_ATTEMPTS_EXCEEDED' | 'INVALID_CODE' | 'ALREADY_CONSUMED'; 
      message: string; 
      remainingAttempts?: number 
    };

/**
 * Normalizes email address.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Generates purpose-scoped identifier for OTP challenges.
 * Enforces cryptographic and query isolation between registration, password reset, and email change.
 * For EMAIL_CHANGE, binds the challenge to BOTH the authenticated userId and destination email:
 * Format: EMAIL_CHANGE:<userId>:<normalizedEmail>
 */
export function encodeOTPScope(email: string, purpose: OTPPurpose, userId?: string): string {
  const normalized = normalizeEmail(email);
  if (purpose === 'EMAIL_CHANGE') {
    if (!userId || !userId.trim()) {
      throw new Error('userId is required for EMAIL_CHANGE OTP scope');
    }
    return `EMAIL_CHANGE:${userId.trim()}:${normalized}`;
  }
  return `${purpose}:${normalized}`;
}

/**
 * Atomically reserves an OTP cooldown using a single PostgreSQL statement.
 * Uses conditional ON CONFLICT DO UPDATE with a WHERE clause checking that
 * any existing cooldown is either missing or has expired.
 * 
 * If concurrent requests race, exactly ONE reservation succeeds.
 * Cooldown records reside in AccountLockout under "cooldown:<purpose>:<email>"
 * and remain completely independent of OTP challenge creation, verification, or deletion.
 */
export async function reserveOTPCooldown(
  email: string,
  purpose: OTPPurpose,
  cooldownSeconds: number = OTP_COOLDOWN_SECONDS
): Promise<OTPCooldownReservationResult> {
  const emailLower = normalizeEmail(email);
  const cooldownKey = `cooldown:${purpose}:${emailLower}`;
  const newId = crypto.randomUUID();

  // Single atomic PostgreSQL statement:
  // Updates existing row ONLY IF lockedUntil is NULL or <= NOW().
  // If the cooldown is currently active (lockedUntil > NOW()), the WHERE clause
  // evaluates to false, 0 rows are updated, and RETURNING yields an empty set.
  const rows = await prisma.$queryRaw<Array<{ lockedUntil: Date }>>`
    INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
    VALUES (${newId}, ${cooldownKey}, 0, NOW() + (${cooldownSeconds} * INTERVAL '1 second'), NOW(), NOW(), NOW())
    ON CONFLICT ("identifier") DO UPDATE SET
      "lockedUntil" = NOW() + (${cooldownSeconds} * INTERVAL '1 second'),
      "lastFailedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "AccountLockout"."lockedUntil" IS NULL OR "AccountLockout"."lockedUntil" <= NOW()
    RETURNING "lockedUntil";
  `;

  if (rows && rows.length > 0) {
    return { allowed: true };
  }

  // Reservation was rejected because an active cooldown exists.
  // Read remaining seconds for accurate Retry-After feedback without modifying state:
  const existing = await prisma.accountLockout.findUnique({
    where: { identifier: cooldownKey }
  });

  const now = new Date();
  let retryAfterSeconds = cooldownSeconds;
  if (existing && existing.lockedUntil && existing.lockedUntil > now) {
    retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.lockedUntil.getTime() - now.getTime()) / 1000)
    );
  }

  return {
    allowed: false,
    retryAfterSeconds
  };
}

/**
 * Stores a fresh OTP challenge, purging any existing challenges for the same scope.
 * Executed inside a transaction to prevent race conditions during challenge creation.
 * Does NOT touch the independent cooldown record in AccountLockout.
 * For EMAIL_CHANGE, userId binds the challenge to the authenticated requesting user.
 */
export async function createOTPChallenge(
  email: string,
  code: string,
  expiresAt: Date,
  purpose: OTPPurpose,
  userId?: string
): Promise<{ id: string }> {
  const scopedEmail = encodeOTPScope(email, purpose, userId);

  return await prisma.$transaction(async (tx) => {
    // 1. Purge any previous challenges for this specific scope
    await tx.oTPVerification.deleteMany({
      where: { email: scopedEmail }
    });

    // 2. Create the fresh challenge with HMAC-SHA-256 digest (Never store raw OTP at rest)
    const digest = computeOTPDigest(code, scopedEmail);
    const record = await tx.oTPVerification.create({
      data: {
        email: scopedEmail,
        code: digest,
        expiresAt,
        attempts: 0
      }
    });

    return { id: record.id };
  });
}

/**
 * Verifies an OTP code and atomically increments attempts or invalidates it.
 * Upon successful match, consumes the OTP record atomically.
 * Scoped strictly by OTP purpose (and userId for EMAIL_CHANGE) to prevent cross-flow token re-purposing.
 * 
 * Supports executing within an existing Prisma.TransactionClient (e.g. for atomic email updates).
 * Failed attempts are committed immediately on base prisma to prevent attempt-limit evasion.
 * Successful consumption uses the provided tx client so that any outer transaction failure
 * (e.g. email update error) automatically rolls back the OTP consumption.
 */
export async function verifyAndConsumeOTP(
  email: string,
  submittedCode: string,
  purpose: OTPPurpose,
  userId?: string,
  tx?: Prisma.TransactionClient
): Promise<OTPVerifyResult> {
  const scopedEmail = encodeOTPScope(email, purpose, userId);
  const codeTrimmed = submittedCode.trim();

  // Find active OTP for this specific scoped identifier
  const client = tx || prisma;
  const activeOTP = await client.oTPVerification.findFirst({
    where: {
      email: scopedEmail,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!activeOTP) {
    return {
      success: false,
      reason: 'EXPIRED_OR_NOT_FOUND',
      message: 'Invalid or expired verification code.'
    };
  }

  // Check if attempts already reached limit
  if (activeOTP.attempts >= MAX_OTP_ATTEMPTS) {
    // Invalidate challenge by deleting; cooldown in AccountLockout remains intact!
    await prisma.oTPVerification.deleteMany({ where: { id: activeOTP.id } });
    return {
      success: false,
      reason: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Verification code has been invalidated due to too many failed attempts. Please request a new code.'
    };
  }

  // Compare submitted code using constant-time comparison
  const submittedDigest = computeOTPDigest(codeTrimmed, scopedEmail);
  let isMatch = false;

  if (activeOTP.code && activeOTP.code.length === 64) {
    // Stored as HMAC-SHA-256 digest
    const bufA = Buffer.from(activeOTP.code, 'hex');
    const bufB = Buffer.from(submittedDigest, 'hex');
    isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } else if (activeOTP.code && activeOTP.code.length === 6) {
    // Backward compatibility for legacy 6-digit plaintext records during migration
    const bufA = Buffer.from(activeOTP.code);
    const bufB = Buffer.from(codeTrimmed);
    isMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  if (!isMatch) {
    // Atomically increment attempts in PostgreSQL to prevent lost-update races under concurrent load.
    // Row-level exclusive lock acquired by UPDATE serializes concurrent incorrect attempts.
    const rows = await prisma.$queryRaw<Array<{ attempts: number }>>`
      UPDATE "OTPVerification"
      SET "attempts" = "attempts" + 1
      WHERE "id" = ${activeOTP.id} AND "attempts" < ${MAX_OTP_ATTEMPTS}
      RETURNING "attempts";
    `;

    const updatedAttempts = rows[0]?.attempts;

    if (!rows.length || updatedAttempts >= MAX_OTP_ATTEMPTS) {
      // 5th attempt or concurrent attempt exceeding limit: invalidate challenge so it cannot be used or revived
      await prisma.oTPVerification.deleteMany({ where: { id: activeOTP.id } });
      return {
        success: false,
        reason: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Verification code has been invalidated due to too many failed attempts. Please request a new code.'
      };
    }

    const remainingAttempts = MAX_OTP_ATTEMPTS - updatedAttempts;
    return {
      success: false,
      reason: 'INVALID_CODE',
      remainingAttempts,
      // Generic message without leaking exact internal counter to unauthenticated callers
      message: 'Invalid verification code.'
    };
  }

  // Code matches!
  // Consume OTP using deleteClient (tx if provided, otherwise base prisma).
  // If tx is provided, deleting within tx ensures that if the enclosing transaction
  // aborts (e.g. user email update fails), the OTP deletion is rolled back!
  // Conditioning on attempts < MAX_OTP_ATTEMPTS prevents consuming an OTP that hit max failed attempts.
  const deleteClient = tx || prisma;
  const deleteResult = await deleteClient.oTPVerification.deleteMany({
    where: {
      id: activeOTP.id,
      attempts: { lt: MAX_OTP_ATTEMPTS }
    }
  });

  if (deleteResult.count === 0) {
    // Concurrent request already consumed it
    return {
      success: false,
      reason: 'ALREADY_CONSUMED',
      message: 'Verification code has already been used or expired.'
    };
  }

  return {
    success: true,
    otpId: activeOTP.id
  };
}

/**
 * Atomically tracks failed login attempts for a canonical account identifier.
 * Used for security auditing and risk monitoring within a rolling 15-minute window.
 * 
 * In accordance with NIST SP 800-63B and finding resolution (SEC-02 & SEC-03):
 * - Does NOT impose an unauthenticated hard lockout that denies legitimate users access.
 * - Does NOT return account-differentiating HTTP status codes (such as 429).
 * - Legitimate users with the correct password can always authenticate.
 */
export async function recordFailedLogin(canonicalId: string): Promise<FailedLoginAuditRecord> {
  const normalizedId = canonicalId.trim().toLowerCase();
  const newId = crypto.randomUUID();

  const rows = await prisma.$queryRaw<Array<{ failedAttempts: number; lastFailedAt: Date }>>`
    INSERT INTO "AccountLockout" ("id", "identifier", "failedAttempts", "lockedUntil", "lastFailedAt", "createdAt", "updatedAt")
    VALUES (${newId}, ${normalizedId}, 1, NULL, NOW(), NOW(), NOW())
    ON CONFLICT ("identifier") DO UPDATE SET
      "failedAttempts" = CASE
        WHEN "AccountLockout"."lastFailedAt" < NOW() - INTERVAL '15 minutes' THEN 1
        ELSE "AccountLockout"."failedAttempts" + 1
      END,
      "lockedUntil" = NULL,
      "lastFailedAt" = NOW(),
      "updatedAt" = NOW()
    RETURNING "failedAttempts", "lastFailedAt";
  `;

  return rows[0] || { failedAttempts: 1, lastFailedAt: new Date() };
}

/**
 * Resets account failed login tracking upon successful authentication or recovery.
 */
export async function resetAccountLockout(canonicalId: string): Promise<void> {
  const normalizedId = canonicalId.trim().toLowerCase();
  await prisma.accountLockout.deleteMany({
    where: { identifier: normalizedId }
  });
}
