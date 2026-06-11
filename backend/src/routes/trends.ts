import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/trends (Guarded - aggregate health parameters)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const records = await prisma.healthTrend.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 200, // Limit to most recent 200 data points — sufficient for trend charts
    });

    return res.json(records);
  } catch (err) {
    console.error('Error fetching trends timeline:', err);
    return res.status(500).json({ message: 'Error retrieving trend metrics.' });
  }
});

// GET /api/trends/insights (Guarded - aggregate health insights/habits)
router.get('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const records = await prisma.healthInsight.findMany({
      where: { userId, category: 'HABIT' },
      orderBy: { createdAt: 'desc' },
      take: 20, // Return latest 20 habits
    });

    return res.json(records);
  } catch (err) {
    console.error('Error fetching health insights:', err);
    return res.status(500).json({ message: 'Error retrieving health habits.' });
  }
});

export default router;
