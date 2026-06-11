import express, { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate, updateProfileSchema, changePasswordSchema } from '../middleware/validate';
import * as bcrypt from 'bcryptjs';

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

// BUG-10 FIX: Step 1 — Request email change — sends an OTP to the NEW email address
router.post('/request-email-change', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newEmail } = req.body;
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ message: 'A valid new email address is required.' });
  }

  const normalizedEmail = newEmail.toLowerCase().trim();

  try {
    // Check this email isn't already used by someone else
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(400).json({ message: 'This email address is already registered to another account.' });
    }

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Purge old OTPs for this email, then store fresh one
    await prisma.oTPVerification.deleteMany({ where: { email: normalizedEmail } });
    await prisma.oTPVerification.create({ data: { email: normalizedEmail, code, expiresAt } });

    console.log(`📧 [EMAIL CHANGE OTP] ${req.user!.id} → new email ${normalizedEmail}: ${code}`);

    // Send via Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
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
      } catch (emailErr) {
        console.error('Failed to send email change OTP via Resend:', emailErr);
      }
    }

    return res.json({ message: `Verification code sent to ${normalizedEmail}. Please check your inbox.` });
  } catch (err) {
    console.error('Error in request-email-change:', err);
    return res.status(500).json({ message: 'Failed to send verification code.' });
  }
});

// BUG-10 FIX: Step 2 — Confirm email change — verify OTP and commit the new email
router.post('/confirm-email-change', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newEmail, code } = req.body;
  if (!newEmail || !code) {
    return res.status(400).json({ message: 'New email and verification code are required.' });
  }

  const normalizedEmail = newEmail.toLowerCase().trim();

  try {
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { email: normalizedEmail, code },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Check for race condition — another user took this email
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== req.user!.id) {
      return res.status(400).json({ message: 'This email is already in use by another account.' });
    }

    // Commit the email change
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { email: normalizedEmail },
      select: { id: true, name: true, email: true, mobileNumber: true, role: true, authProvider: true, avatar: true }
    });

    // Clean up OTP record
    await prisma.oTPVerification.deleteMany({ where: { email: normalizedEmail } });

    return res.json({ message: 'Email address updated successfully.', user: updatedUser });
  } catch (err) {
    console.error('Error in confirm-email-change:', err);
    return res.status(500).json({ message: 'Failed to confirm email change.' });
  }
});


// Change password
router.post('/change-password', authenticateToken, validate(changePasswordSchema), async (req: AuthenticatedRequest, res: Response) => {
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
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Clean up all Cloudinary files before deleting the user from DB
    const [prescriptions, reports] = await Promise.all([
      prisma.prescription.findMany({ where: { userId }, select: { fileUrl: true } }),
      prisma.medicalReport.findMany({ where: { userId }, select: { fileUrl: true } }),
    ]);

    const allFileUrls = [
      ...prescriptions.map(p => p.fileUrl),
      ...reports.map(r => r.fileUrl),
    ].filter(Boolean);

    if (allFileUrls.length > 0) {
      try {
        const cloudinary = (await import('../config/cloudinary')).default;
        // Extract Cloudinary public IDs from URLs (format: .../folder/public_id.ext)
        const publicIds = allFileUrls.map(url => {
          const parts = url.split('/');
          const fileWithExt = parts.slice(-2).join('/'); // folder/filename
          return fileWithExt.replace(/\.[^.]+$/, ''); // remove extension
        });
        await cloudinary.api.delete_resources(publicIds);
        console.log(`[Account Delete] Cleaned up ${publicIds.length} Cloudinary files for user ${userId}`);
      } catch (cloudinaryErr) {
        // Non-fatal: log but continue with account deletion
        console.error('[Account Delete] Cloudinary cleanup failed (continuing with delete):', cloudinaryErr);
      }
    }

    // Prisma will cascade delete all related DB records
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account. Please contact support.' });
  }
});

export default router;
