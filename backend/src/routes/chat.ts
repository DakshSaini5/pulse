import express, { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/chat/history
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prisma.aIChatMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
      take: 50, // Retrieve last 50 messages
    });
    return res.json(history);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ message: 'Failed to retrieve chat history.' });
  }
});

// DELETE /api/chat/history
router.delete('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.aIChatMessage.deleteMany({
      where: { userId: req.user!.id },
    });
    return res.json({ message: 'Chat history cleared successfully.' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    return res.status(500).json({ message: 'Failed to clear chat history.' });
  }
});

export default router;
