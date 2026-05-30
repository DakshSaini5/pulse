import { Router, Response } from 'express';
import { prisma } from '../db';
import { scoreHospital, calculateDistance } from '../services/recommendation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { searchLimiter } from '../middleware/rateLimiter';
import { hospitalService } from '../services/HospitalService';

const router = Router();

// GET /api/hospitals (Public - search hospitals with pagination)
router.get('/', searchLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { query, specialty, maxDistance, lat, lng, page: pageStr, limit: limitStr } = req.query;

  // Defaults user to Delhi region coordinates if geolocation is not shared
  const userLat = lat ? parseFloat(lat as string) : 28.6139;
  const userLng = lng ? parseFloat(lng as string) : 77.2090;
  const radius = maxDistance ? parseFloat(maxDistance as string) : 15; // default 15km
  const page = Math.max(1, parseInt(pageStr as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(limitStr as string) || 20));

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

    // Load hospitals with specialties — case-insensitive search
    let hospitalsList = await prisma.hospital.findMany({
      where: query
        ? { name: { contains: query as string, mode: 'insensitive' } }
        : {},
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Smart Cache Strategy: If we have very few results locally, ask our Provider (Google Places)
    // and cache them for the future.
    if (hospitalsList.length < 3) {
      const searchKeyword = (query as string) || (specialty as string) || 'Hospital';
      await hospitalService.ensureHospitalsCached(userLat, userLng, searchKeyword, radius);

      // Re-fetch from our DB now that the cache is populated
      hospitalsList = await prisma.hospital.findMany({
        where: query
          ? { name: { contains: query as string, mode: 'insensitive' } }
          : {},
        include: {
          specialties: {
            include: {
              specialty: true,
            },
          },
        },
      });
    }

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

    // Apply pagination after scoring and filtering
    const total = scored.length;
    const start = (page - 1) * limit;
    const paginated = scored.slice(start, start + limit);

    return res.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

// POST /api/hospitals (Admin Only - Add new hospital)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only admins can add hospitals.' });
  }

  try {
    const { 
      name, address, latitude, longitude, phone, email, website, 
      workingHours, emergencyAvailable, rating 
    } = req.body;

    const newHospital = await prisma.hospital.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        email,
        website,
        workingHours: workingHours || '9:00 AM - 5:00 PM',
        emergencyAvailable: Boolean(emergencyAvailable),
        rating: rating ? parseFloat(rating) : 0,
      }
    });

    return res.status(201).json(newHospital);
  } catch (err) {
    console.error('Failed to add hospital:', err);
    return res.status(500).json({ message: 'Error adding new hospital.' });
  }
});

export default router;
