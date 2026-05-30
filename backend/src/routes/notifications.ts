import express, { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { 
        userId: req.user!.id,
        isRead: false
      },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const notification = await prisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId: req.user!.id 
      },
      data: { isRead: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user!.id,
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

export default router;
