export interface HospitalData {
  externalId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  photoUrl?: string;
  types?: string[]; // BUG-06 FIX: Pass Google Places types to determine emergencyAvailable accurately
  specialties?: string[]; // Hybrid Verified Strategy
}

export interface IHospitalProvider {
  searchNearby(lat: number, lng: number, keyword: string, radius: number): Promise<HospitalData[]>;
}
