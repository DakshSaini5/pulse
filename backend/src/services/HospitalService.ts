import { IHospitalProvider } from './providers/IHospitalProvider';
import { prisma } from '../db';
import fs from 'fs';
import path from 'path';

export class HospitalService {
  public verifiedHospitals: any[] = [];

  constructor() {
    try {
      const verifiedPath = path.join(__dirname, '../data/verified-hospitals.json');
      if (fs.existsSync(verifiedPath)) {
        this.verifiedHospitals = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load verified-hospitals.json', e);
    }
  }

  public isVerifiedHospital(query: string): boolean {
    if (!query) return false;
    const q = query.toLowerCase();
    // Check if the query matches our hand-curated list
    return this.verifiedHospitals.some(v => 
      v.name.toLowerCase().includes(q) || q.includes(v.name.toLowerCase())
    );
  }
}

export const hospitalService = new HospitalService();
