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
      orderBy: { recordedAt: 'desc' }
    });

    return res.json(records);
  } catch (err) {
    console.error('Error fetching trends timeline:', err);
    return res.status(500).json({ message: 'Error retrieving trend metrics.' });
  }
});

export default router;
