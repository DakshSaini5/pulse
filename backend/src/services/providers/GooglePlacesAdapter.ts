import { IHospitalProvider, HospitalData } from './IHospitalProvider';

export class GooglePlacesAdapter implements IHospitalProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  async searchNearby(lat: number, lng: number, keyword: string, radius: number): Promise<HospitalData[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key is missing. GooglePlacesAdapter returning empty list.');
      return [];
    }

    try {
      const radiusMeters = radius * 1000;
      // Using standard Google Places API Nearby Search
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=hospital&keyword=${encodeURIComponent(keyword)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API Error:', data.status, data.error_message);
        return [];
      }

      const results = data.results.slice(0, 5); // Limit to top 5 to save Place Details costs
      const hospitals: HospitalData[] = [];

      for (const place of results) {
        // Fetch detailed info to get phone number and website
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${this.apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json() as any;
        
        let phone, website;
        if (detailsData.status === 'OK') {
          phone = detailsData.result.formatted_phone_number;
          website = detailsData.result.website;
        }

        // Construct photo URL if available
        let photoUrl = undefined;
        if (place.photos && place.photos.length > 0) {
          const photoRef = place.photos[0].photo_reference;
          // This endpoint redirects to the actual image, we can just save this URL
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${this.apiKey}`;
        }

        hospitals.push({
          externalId: place.place_id,
          name: place.name,
          address: place.vicinity,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          phone: phone,
          website: website,
          photoUrl: photoUrl,
          types: place.types || [] // BUG-06 FIX: Pass types array for emergency detection
        });
      }

      return hospitals;
    } catch (err) {
      console.error('Failed to fetch from Google Places Adapter', err);
      return [];
    }
  }
}
