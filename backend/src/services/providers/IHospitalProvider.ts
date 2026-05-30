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
}

export interface IHospitalProvider {
  searchNearby(lat: number, lng: number, keyword: string, radius: number): Promise<HospitalData[]>;
}
