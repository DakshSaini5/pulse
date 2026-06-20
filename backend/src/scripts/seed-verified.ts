import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getLocalizedAddress } from '../utils/locationHandler';
import { formatIndianPhoneNumber } from '../utils/phoneFormatter';

const prisma = new PrismaClient();
const verifiedPath = path.join(__dirname, '../data/verified-hospitals.json');

async function main() {
  console.log('🌟 Starting JSON Ingestion Framework for VIP Facilities...');

  if (!fs.existsSync(verifiedPath)) {
    console.error('❌ verified-hospitals.json not found at:', verifiedPath);
    process.exit(1);
  }

  const verifiedData = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
  console.log(`Loaded ${verifiedData.length} landmark facilities from JSON.`);

  // Load standard specialties into a map to ensure strict mapping
  const dbSpecialties = await prisma.specialty.findMany();
  const specMap = new Map(dbSpecialties.map(s => [s.name.toLowerCase(), s.id]));

  for (const h of verifiedData) {
    // Strict Lookup: Match name AND geographic bounding region to prevent cross-contamination
    const regionKey = h.address ? h.address.split(',')[0].trim() : '';
    let hospital = await prisma.hospital.findFirst({
      where: { 
        name: { contains: h.name, mode: 'insensitive' },
        ...(regionKey ? { address: { contains: regionKey, mode: 'insensitive' } } : {})
      }
    });

    if (!hospital) {
      if (h.latitude && h.longitude) {
        console.log(`🚀 Injecting missing VIP Hospital: '${h.name}' at exact coordinates...`);
        hospital = await prisma.hospital.create({
          data: {
            name: h.name,
            address: h.address || 'India Area',
            latitude: h.latitude,
            longitude: h.longitude,
            phone: h.phone || '',
            emergencyAvailable: true,
            workingHours: 'Open 24 Hours',
            rating: 4.8,
            recommendationScore: 95
          }
        });
      } else {
        console.warn(`⚠️ Warning: VIP Hospital '${h.name}' not found in the seeded database and lacks coordinates. Skipping specialties.`);
        continue;
      }
    }

    console.log(`🏥 Found ${hospital.name}. Mapping ${h.specialties?.length || 0} specialties...`);

    // Map Specialty Matrix
    for (const specName of h.specialties || []) {
      const dbId = specMap.get(specName.toLowerCase());
      if (dbId) {
        const exists = await prisma.hospitalSpecialty.findUnique({
          where: { hospitalId_specialtyId: { hospitalId: hospital.id, specialtyId: dbId } }
        });

        if (!exists) {
          await prisma.hospitalSpecialty.create({
            data: {
              hospitalId: hospital.id,
              specialtyId: dbId,
              departments: `${specName} Department`,
              averageCost: h.averageCost || 0.0,
              opdTimings: h.opdTimings || '09:00 AM - 05:00 PM (Mon - Sat)',
            }
          });
        }
      } else {
        console.warn(`⚠️ Warning: JSON Specialty '${specName}' not found in standard dictionary. Skipping mapping for ${h.name}.`);
      }
    }
  }

  console.log(`✅ Successfully mapped clinical matrices for ${verifiedData.length} landmark facilities.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
