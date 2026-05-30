import express, { Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate, reviewSchema } from '../middleware/validate';

const router = express.Router();

// Get reviews for a hospital
router.get('/:hospitalId/reviews', async (req, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [reviews, total] = await Promise.all([
      prisma.hospitalReview.findMany({
        where: { hospitalId },
        include: {
          user: {
            select: { name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.hospitalReview.count({ where: { hospitalId } })
    ]);
    
    res.json({
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Post a review
router.post('/:hospitalId/reviews', authenticateToken, validate(reviewSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hospitalId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user!.id;
    
    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    
    // Check if user already reviewed
    const existing = await prisma.hospitalReview.findFirst({
      where: { hospitalId, userId }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this hospital' });
    }
    
    // Use transaction to create review and update hospital rating
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.hospitalReview.create({
        data: {
          rating,
          reviewText,
          hospitalId,
          userId
        },
        include: {
          user: { select: { name: true, avatar: true } }
        }
      });
      
      // Calculate new average rating
      const allReviews = await tx.hospitalReview.aggregate({
        where: { hospitalId },
        _avg: { rating: true }
      });
      
      const newAvg = allReviews._avg.rating || rating;
      
      await tx.hospital.update({
        where: { id: hospitalId },
        data: { rating: newAvg }
      });
      
      return newReview;
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

export default router;
