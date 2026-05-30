import { IHospitalProvider, HospitalData } from './IHospitalProvider';

export class OverpassAdapter implements IHospitalProvider {
  async searchNearby(lat: number, lng: number, keyword: string, radius: number): Promise<HospitalData[]> {
    // STUB: This proves we can swap Google Places for OpenStreetMap's Overpass API later.
    // In the future, you would use fetch() to call https://overpass-api.de/api/interpreter
    // with an Overpass QL query like: node["amenity"="hospital"](around:radius,lat,lng);out;

    console.log('Overpass Adapter called. This is a stub for future integration.');
    return [];
  }
}
