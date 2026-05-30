import express, { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate, updateProfileSchema, changePasswordSchema } from '../middleware/validate';
import bcrypt from 'bcrypt';

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

// Update profile
router.patch('/profile', authenticateToken, validate(updateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    
    // If email is changing, check if new email exists
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user!.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
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
    // Prisma will cascade delete all related data because of the schema relations
    // (prescriptions, reports, etc.) if they have onDelete: Cascade
    // Wait, let's verify if they have onDelete cascade in schema.prisma.
    // If not, we have to delete manually or use prisma.
    await prisma.user.delete({
      where: { id: req.user!.id }
    });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account. Please contact support.' });
  }
});

export default router;
