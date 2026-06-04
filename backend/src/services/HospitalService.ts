import { IHospitalProvider } from './providers/IHospitalProvider';
import { GooglePlacesAdapter } from './providers/GooglePlacesAdapter';
import { prisma } from '../db';

export class HospitalService {
  private provider: IHospitalProvider;

  constructor() {
    // Adapter Pattern: Here we inject the Google Places Adapter.
    // If we want to switch to Overpass (OpenStreetMap) in the future,
    // we simply change this one line to: this.provider = new OverpassAdapter();
    this.provider = new GooglePlacesAdapter();
  }

  /**
   * Smart Cache Search:
   * 1. If we don't have enough local results, fetch from provider.
   * 2. Save fetched results to DB (cache them).
   * 3. Return the results.
   */
  async ensureHospitalsCached(lat: number, lng: number, keyword: string, radius: number): Promise<void> {
    try {
      // Fetch from the active provider (Google Places)
      const fetchedHospitals = await this.provider.searchNearby(lat, lng, keyword, radius);

      if (fetchedHospitals.length === 0) return;

      // Bulk insert into PostgreSQL, skipping duplicates (based on externalId)
      for (const h of fetchedHospitals) {
        // BUG-06 FIX: Only mark as emergency-capable if Google types confirm it's a hospital
        // Clinics, dentists, and general health providers should NOT be marked as emergency
        const isHospital = Array.isArray(h.types) && (
          h.types.includes('hospital') ||
          h.types.includes('emergency_room')
        );

        await prisma.hospital.upsert({
          where: { externalId: h.externalId },
          update: {
            rating: h.rating,
            phone: h.phone,
            website: h.website,
            photoUrl: h.photoUrl
          },
          create: {
            externalId: h.externalId,
            name: h.name,
            address: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            phone: h.phone,
            website: h.website,
            rating: h.rating || 0,
            workingHours: 'Open 24 Hours',
            emergencyAvailable: isHospital,
            photoUrl: h.photoUrl
          }
        });
      }

      console.log(`Smart Cache: Successfully saved ${fetchedHospitals.length} new hospitals to the database.`);
    } catch (err) {
      console.error('Error in HospitalService caching layer:', err);
    }
  }
}

export const hospitalService = new HospitalService();
