import { IHospitalProvider, HospitalData } from './IHospitalProvider';
import axios from 'axios';

export class OverpassAdapter implements IHospitalProvider {
  async searchNearby(lat: number, lng: number, keyword: string, radius: number): Promise<HospitalData[]> {
    try {
      const radiusMeters = radius * 1000;
      // We look for amenity=hospital and amenity=clinic around the lat,lng.
      let nameFilter = '';
      if (keyword && keyword !== 'Hospital' && keyword.trim().length > 0) {
        // Safe regex escape and inject case-insensitive name filter
        const safeKeyword = keyword.replace(/[\"\\]/g, '');
        nameFilter = `["name"~"${safeKeyword}",i]`;
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"]${nameFilter}(around:${radiusMeters},${lat},${lng});
          way["amenity"="hospital"]${nameFilter}(around:${radiusMeters},${lat},${lng});
          relation["amenity"="hospital"]${nameFilter}(around:${radiusMeters},${lat},${lng});
          node["amenity"="clinic"]${nameFilter}(around:${radiusMeters},${lat},${lng});
          way["amenity"="clinic"]${nameFilter}(around:${radiusMeters},${lat},${lng});
          relation["amenity"="clinic"]${nameFilter}(around:${radiusMeters},${lat},${lng});
        );
        out center;
      `;

      console.log('OVERPASS QUERY:', query);

      const response = await axios.post('https://lz4.overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PulseHealthcare/1.0 (Testing from dev env)'
        },
        timeout: 15000 // 15 second timeout so it doesn't hang forever
      });

      const elements = response.data.elements || [];
      const results: HospitalData[] = [];

      for (const el of elements) {
        if (!el.tags || !el.tags.name) continue;

        const isHospital = el.tags.amenity === 'hospital';
        const phone = el.tags.phone || el.tags['contact:phone'] || '';
        const website = el.tags.website || el.tags['contact:website'] || '';
        const name = el.tags.name;

        // Extract center lat/lng for ways/relations
        const elLat = el.lat || (el.center && el.center.lat);
        const elLng = el.lon || (el.center && el.center.lon);

        if (!elLat || !elLng) continue;

        // Keyword matching for specialties
        const specialties: Set<string> = new Set();
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('heart') || lowerName.includes('cardiac')) specialties.add('Cardiology');
        if (lowerName.includes('eye') || lowerName.includes('vision')) specialties.add('Ophthalmology');
        if (lowerName.includes('ortho') || lowerName.includes('bone')) specialties.add('Orthopedics');
        if (lowerName.includes('child') || lowerName.includes('pediatric')) specialties.add('Pediatrics');
        if (lowerName.includes('dental') || lowerName.includes('tooth')) specialties.add('Dental');
        if (lowerName.includes('women') || lowerName.includes('maternity')) specialties.add('Gynecology');
        if (lowerName.includes('skin')) specialties.add('Dermatology');
        if (lowerName.includes('cancer') || lowerName.includes('oncology')) specialties.add('Oncology');
        if (lowerName.includes('ent')) specialties.add('ENT');

        // Mega-chain bundle
        if (lowerName.includes('apollo') || lowerName.includes('manipal') || lowerName.includes('fortis') || lowerName.includes('max super')) {
          ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'General Medicine', 'Emergency Medicine'].forEach(s => specialties.add(s));
        }

        results.push({
          externalId: `osm-${el.type}-${el.id}`,
          name: name,
          address: `${el.tags['addr:street'] || ''} ${el.tags['addr:city'] || ''}`.trim() || 'Location via OSM',
          latitude: elLat,
          longitude: elLng,
          phone,
          website,
          rating: 4.0, // Default rating for OSM items
          types: isHospital ? ['hospital'] : ['clinic'],
          specialties: Array.from(specialties)
        });
      }

      return results;
    } catch (err) {
      console.error('OverpassAdapter Error:', err);
      return [];
    }
  }
}
