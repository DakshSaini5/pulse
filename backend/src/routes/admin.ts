import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, adminOnly, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats (Guarded - admin control summary diagnostics)
router.get('/stats', authenticateToken, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersCount = await prisma.user.count();
    const hospitalsCount = await prisma.hospital.count();
    const ocrCount = await prisma.oCRResult.count();
    
    // Retrieve model transactions
    const usages = await prisma.aIUsage.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { processedAt: 'desc' },
      take: 20
    });

    const totalTokens = usages.reduce((acc, curr) => acc + curr.tokensUsed, 0);
    // Gemini 2.5 Flash pricing is extremely light ($0.075 per 1M input tokens)
    const totalCost = totalTokens * 0.0000003; 

    return res.json({
      usersCount,
      hospitalsCount,
      ocrCount,
      aiTokens: totalTokens,
      aiCost: totalCost,
      errorCount: 0,
      usages
    });
  } catch (err) {
    console.error('Admin stats collection failed:', err);
    return res.status(500).json({ message: 'Internal server audit collection error.' });
  }
});

export default router;
