import { Router, Response } from 'express';
import { prisma } from '../db';
import { scoreHospital, calculateDistance } from '../services/recommendation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/hospitals (Public - search hospitals)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { query, specialty, maxDistance, lat, lng } = req.query;

  // Defaults user to Delhi region coordinates if geolocation is not shared
  const userLat = lat ? parseFloat(lat as string) : 28.6139;
  const userLng = lng ? parseFloat(lng as string) : 77.2090;
  const radius = maxDistance ? parseFloat(maxDistance as string) : 15; // default 15km

  try {
    // Search history logging if logged in
    if (req.user && (query || specialty)) {
      await prisma.searchHistory.create({
        data: {
          userId: req.user.id,
          query: (query as string) || (specialty as string) || 'Map Filter',
          category: specialty ? 'SPECIALTY' : 'GENERAL'
        }
      });
    }

    // Load hospitals with specialties and specialties metadata
    const hospitalsList = await prisma.hospital.findMany({
      where: query
        ? { name: { contains: query as string } }
        : {},
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Score and filter by distance radius
    const scored = hospitalsList
      .map((hosp: any) => {
        const { score, distance, explanation } = scoreHospital(
          hosp,
          (specialty as string) || 'General Medicine',
          userLat,
          userLng
        );
        return {
          ...hosp,
          distance,
          recommendationScore: score,
          explanation,
        };
      })
      .filter((h: any) => h.distance <= radius);

    // Sort by recommendation score descending
    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return res.json(scored);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error retrieving hospital records.' });
  }
});

// GET /api/hospitals/saved (Guarded - retrieve bookmarked hospitals)
router.get('/saved', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const saved = await prisma.savedHospital.findMany({
      where: { userId },
      include: {
        hospital: {
          include: {
            specialties: {
              include: {
                specialty: true
              }
            }
          }
        }
      }
    });

    const result = saved.map(s => {
      // Calculate scores dynamically relative to Delhi coordinates for consistency
      const { score, explanation } = scoreHospital(
        s.hospital as any,
        'General Medicine',
        28.6139,
        77.2090
      );
      return {
        ...s.hospital,
        recommendationScore: score,
        explanation
      };
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading saved care lists.' });
  }
});

// GET /api/hospitals/compare (Public - side-by-side matrices)
router.get('/compare', async (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ message: 'Please provide comma-separated hospital ids.' });
  }

  const idsArray = (ids as string).split(',');

  try {
    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: idsArray } },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Append dynamic default match scores
    const scored = hospitals.map(hosp => {
      const { score, explanation } = scoreHospital(hosp as any, 'General Medicine', 28.6139, 77.2090);
      return {
        ...hosp,
        recommendationScore: score,
        explanation
      };
    });

    return res.json(scored);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading comparison datasets.' });
  }
});

// GET /api/hospitals/:id (Public - single hospital metrics)
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital clinic not found.' });
    }

    const { score, explanation } = scoreHospital(hospital as any, 'General Medicine', 28.6139, 77.2090);

    return res.json({
      ...hospital,
      recommendationScore: score,
      explanation
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading facility data.' });
  }
});

// POST /api/hospitals/:id/save (Guarded - bookmark hospital)
router.post('/:id/save', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const hospitalId = req.params.id;

  try {
    const exist = await prisma.savedHospital.findUnique({
      where: { userId_hospitalId: { userId, hospitalId } }
    });

    if (exist) {
      return res.status(400).json({ message: 'Clinic already saved to bookmarks.' });
    }

    await prisma.savedHospital.create({
      data: { userId, hospitalId }
    });

    return res.status(201).json({ message: 'Hospital saved to bookmarks.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error saving hospital.' });
  }
});

// DELETE /api/hospitals/:id/save (Guarded - remove bookmark)
router.delete('/:id/save', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const hospitalId = req.params.id;

  try {
    await prisma.savedHospital.delete({
      where: { userId_hospitalId: { userId, hospitalId } }
    });
    return res.json({ message: 'Clinic removed from saved bookmarks.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error removing saved bookmark.' });
  }
});

export default router;
