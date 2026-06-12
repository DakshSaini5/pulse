import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { scoreHospital, calculateDistance } from '../../services/recommendation';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { searchLimiter } from '../../middleware/rateLimiter';
import { hospitalService } from '../../services/HospitalService';
import { findMappedSpecialty } from '../../utils/intentMapper';
import { z } from 'zod';
import https from 'https';

const router = Router();

function fetchCityName(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    
    // 3-second timeout to prevent indefinite hangs if BigDataCloud is down
    const timeoutId = setTimeout(() => {
      console.warn('[geocoding] BigDataCloud request timed out after 3s');
      resolve('');
    }, 3000);

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        clearTimeout(timeoutId);
        try {
          const json = JSON.parse(data);
          resolve(json.city || json.locality || json.principalSubdivision || '');
        } catch (e) {
          resolve('');
        }
      });
    }).on('error', () => {
      clearTimeout(timeoutId);
      resolve('');
    });
  });
}

// Zod schema for admin hospital creation
const hospitalCreateSchema = z.object({
  name: z.string().min(2, 'Hospital name must be at least 2 characters.').max(200),
  address: z.string().min(5, 'Address must be at least 5 characters.').max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format.').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL.').optional().or(z.literal('')),
  workingHours: z.string().optional(),
  emergencyAvailable: z.coerce.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

// GET /api/hospitals (Public - search hospitals with pagination)
router.get('/', searchLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { query, specialty, maxDistance, lat, lng, city, page: pageStr, limit: limitStr } = req.query;

  // BUG-04 FIX: Require lat/lng — do not silently default to Delhi for any user
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Location coordinates (lat, lng) are required to search hospitals.' });
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ message: 'Invalid location coordinates provided.' });
  }

  const radius = maxDistance ? parseFloat(maxDistance as string) : 15; // default 15km
  const page = Math.max(1, parseInt(pageStr as string) || 1);
  // Increased limit from 20/50 to 150/300 so more hospitals appear on the map when radius increases
  const limit = Math.min(300, Math.max(1, parseInt(limitStr as string) || 150));

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

    // Calculate bounding box for the search radius to prevent loading all 3,500+ records from DB
    const latDiff = radius / 111;
    const cosLat = Math.cos((userLat * Math.PI) / 180);
    const lngDiff = radius / (111 * (cosLat > 0.1 ? cosLat : 0.1));

    const andConditions: any[] = [
      {
        latitude: {
          gte: userLat - latDiff,
          lte: userLat + latDiff,
        }
      },
      {
        longitude: {
          gte: userLng - lngDiff,
          lte: userLng + lngDiff,
        }
      }
    ];

    const targetSpecialty = specialty ? (findMappedSpecialty(specialty as string) || specialty as string) : null;
    const querySpecialty = query ? findMappedSpecialty(query as string) : null;

    if (targetSpecialty) {
      andConditions.push({
        specialties: {
          some: {
            specialty: {
              name: { equals: targetSpecialty, mode: 'insensitive' }
            }
          }
        }
      });
    } else if (query) {
      if (querySpecialty) {
        andConditions.push({
          OR: [
            { name: { contains: query as string, mode: 'insensitive' } },
            {
              specialties: {
                some: {
                  specialty: {
                    name: { equals: querySpecialty, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        });
      } else {
        andConditions.push({
          name: { contains: query as string, mode: 'insensitive' }
        });
      }
    }

    const whereClause = { AND: andConditions };

    // Load hospitals with specialties — case-insensitive search
    let hospitalsList = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // Score and filter by distance radius
    const activeSpecialty = targetSpecialty || querySpecialty || 'General Medicine';
    const scored = hospitalsList
      .map((hosp: any) => {
        const { score, distance, explanation } = scoreHospital(
          hosp,
          activeSpecialty,
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
  const { lat, lng } = req.query;
  const userLat = lat ? parseFloat(lat as string) : 28.6139;
  const userLng = lng ? parseFloat(lng as string) : 77.2090;

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
      // Calculate scores dynamically relative to user coordinates
      const { score, explanation } = scoreHospital(
        s.hospital as any,
        'General Medicine',
        userLat,
        userLng
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
router.get('/compare', async (req: Request, res: Response) => {
  const { ids, lat, lng } = req.query;
  if (!ids) {
    return res.status(400).json({ message: 'Please provide comma-separated hospital ids.' });
  }

  const idsArray = (ids as string).split(',');
  const userLat = lat ? parseFloat(lat as string) : 28.6139;
  const userLng = lng ? parseFloat(lng as string) : 77.2090;

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
      const { score, explanation } = scoreHospital(hosp as any, 'General Medicine', userLat, userLng);
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

// GET /api/hospitals/autocomplete (Public - real-time matching dropdown results, city-scoped)
router.get('/autocomplete', async (req: Request, res: Response) => {
  const { q, lat, lng, city } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.json({ hospitals: [], specialties: [] });
  }

  const queryText = q.trim();

  try {
    // BUG-05 FIX: Build a city-scoped where clause for hospitals so autocomplete
    // only returns results from the user's actual city, not the entire DB.
    let hospitalWhereClause: any = {
      name: { contains: queryText, mode: 'insensitive' }
    };

    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        // Use a ~50km bounding box to scope results to the user's metro area
        const boundRadius = 50;
        const latDiff = boundRadius / 111;
        const cosLat = Math.cos((userLat * Math.PI) / 180);
        const lngDiff = boundRadius / (111 * (cosLat > 0.1 ? cosLat : 0.1));
        hospitalWhereClause = {
          AND: [
            { name: { contains: queryText, mode: 'insensitive' } },
            { latitude: { gte: userLat - latDiff, lte: userLat + latDiff } },
            { longitude: { gte: userLng - lngDiff, lte: userLng + lngDiff } },
          ]
        };
      }
    } else if (city && typeof city === 'string' && city.trim().length > 0) {
      // Fallback: filter by city name in address if no coordinates
      hospitalWhereClause = {
        AND: [
          { name: { contains: queryText, mode: 'insensitive' } },
          { address: { contains: city.trim(), mode: 'insensitive' } },
        ]
      };
    }

    // 1. Search matching hospitals in the user's city (top 5)
    const hospitals = await prisma.hospital.findMany({
      where: hospitalWhereClause,
      select: { id: true, name: true },
      take: 5
    });

    // 2. Search matching specialties (top 5 — global, not city-scoped)
    const dbSpecialties = await prisma.specialty.findMany({
      where: {
        name: { contains: queryText, mode: 'insensitive' }
      },
      select: { name: true },
      take: 5
    });

    const specialties = [...dbSpecialties];
    const mappedSpecialtyName = findMappedSpecialty(queryText);
    if (mappedSpecialtyName && !specialties.some(s => s.name.toLowerCase() === mappedSpecialtyName.toLowerCase())) {
      specialties.unshift({ name: mappedSpecialtyName });
    }

    return res.json({ hospitals, specialties: specialties.slice(0, 5) });
  } catch (err) {
    console.error('Error in autocomplete route:', err);
    return res.status(500).json({ message: 'Error performing autocomplete search.' });
  }
});

// GET /api/hospitals/:id (Public - single hospital metrics)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { lat, lng } = req.query;
  const userLat = lat ? parseFloat(lat as string) : 28.6139;
  const userLng = lng ? parseFloat(lng as string) : 77.2090;

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

    const { score, explanation } = scoreHospital(hospital as any, 'General Medicine', userLat, userLng);

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

  // Validate request body with Zod
  const parsed = hospitalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed. Please check your input.',
      errors: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  try {
    const { name, address, latitude, longitude, phone, email, website, workingHours, emergencyAvailable, rating } = parsed.data;

    const newHospital = await prisma.hospital.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        phone,
        email,
        website,
        workingHours: workingHours || '9:00 AM - 5:00 PM',
        emergencyAvailable: Boolean(emergencyAvailable),
        rating: rating ?? 0,
      }
    });

    return res.status(201).json(newHospital);
  } catch (err) {
    console.error('Failed to add hospital:', err);
    return res.status(500).json({ message: 'Error adding new hospital.' });
  }
});

export default router;
