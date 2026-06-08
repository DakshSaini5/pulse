import fs from 'fs';
import path from 'path';
// @ts-ignore
import parse from 'osm-pbf-parser';
import through from 'through2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const pbfPath = path.join(__dirname, '../../data/india-latest.osm.pbf');

// Pre-load verified hospitals for specialty mapping
let verifiedHospitals: any[] = [];
try {
  const vPath = path.join(__dirname, '../data/verified-hospitals.json');
  if (fs.existsSync(vPath)) {
    verifiedHospitals = JSON.parse(fs.readFileSync(vPath, 'utf8'));
  }
} catch (e) {
  console.log('No verified hospitals data found.');
}

function getSpecialties(name: string, isHospital: boolean): string[] {
  let specs: Set<string> = new Set();
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('heart') || lowerName.includes('cardiac')) specs.add('Cardiology');
  if (lowerName.includes('eye') || lowerName.includes('vision')) specs.add('Ophthalmology');
  if (lowerName.includes('ortho') || lowerName.includes('bone')) specs.add('Orthopedics');
  if (lowerName.includes('child') || lowerName.includes('pediatric')) specs.add('Pediatrics');
  if (lowerName.includes('dental') || lowerName.includes('tooth')) specs.add('Dental');
  if (lowerName.includes('women') || lowerName.includes('maternity')) specs.add('Gynecology');
  if (lowerName.includes('skin')) specs.add('Dermatology');
  if (lowerName.includes('cancer') || lowerName.includes('oncology')) specs.add('Oncology');
  if (lowerName.includes('ent')) specs.add('ENT');

  if (lowerName.includes('apollo') || lowerName.includes('manipal') || lowerName.includes('fortis') || lowerName.includes('max super')) {
    ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'General Medicine', 'Emergency Medicine'].forEach(s => specs.add(s));
  }

  const vMatch = verifiedHospitals.find(v => lowerName.includes(v.name.toLowerCase()));
  if (vMatch && vMatch.specialties) {
    vMatch.specialties.forEach((s: string) => specs.add(s));
  }

  if (specs.size === 0 && isHospital) {
    specs.add('General Medicine');
  }

  return Array.from(specs);
}

async function flushBatch(hospitals: any[]) {
  if (hospitals.length === 0) return;
  
  try {
    const hospitalData = hospitals.map(h => ({
      externalId: h.externalId,
      name: h.name,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      phone: h.phone,
      website: h.website,
      rating: 4.0,
      workingHours: 'Open 24 Hours',
      emergencyAvailable: h.isHospital,
      photoUrl: ''
    }));

    await prisma.hospital.createMany({
      data: hospitalData,
      skipDuplicates: true
    });

    const externalIds = hospitals.map(h => h.externalId);
    const savedHospitals = await prisma.hospital.findMany({
      where: { externalId: { in: externalIds } },
      select: { id: true, externalId: true }
    });
    const externalIdToDbId = new Map(savedHospitals.map(h => [h.externalId, h.id]));

    const uniqueSpecNames = new Set<string>();
    hospitals.forEach(h => h.specialties.forEach((s: string) => uniqueSpecNames.add(s)));

    const existingSpecs = await prisma.specialty.findMany({
      where: { name: { in: Array.from(uniqueSpecNames) } }
    });
    const specMap = new Map(existingSpecs.map(s => [s.name, s.id]));

    for (const specName of uniqueSpecNames) {
      if (!specMap.has(specName)) {
        const newSpec = await prisma.specialty.create({
          data: { name: specName, description: `Specialized ${specName}`, category: 'Clinical' }
        });
        specMap.set(specName, newSpec.id);
      }
    }

    const specialtyData: any[] = [];
    hospitals.forEach(h => {
      const dbId = externalIdToDbId.get(h.externalId);
      if (dbId) {
        h.specialties.forEach((sName: string) => {
          const specId = specMap.get(sName);
          if (specId) {
            specialtyData.push({
              hospitalId: dbId,
              specialtyId: specId,
              departments: sName,
              averageCost: 500,
              opdTimings: '09:00 AM - 05:00 PM'
            });
          }
        });
      }
    });

    if (specialtyData.length > 0) {
      await prisma.hospitalSpecialty.createMany({
        data: specialtyData,
        skipDuplicates: true
      });
    }

    process.stdout.write(`...inserted batch of ${hospitals.length} | `);
  } catch (err) {
    console.error('Batch error:', err);
  }
}

async function main() {
  if (!fs.existsSync(pbfPath)) {
    console.error('PBF file not found at:', pbfPath);
    process.exit(1);
  }

  console.log('Starting PBF stream parser...');
  
  let batch: any[] = [];
  let totalProcessed = 0;
  let totalFound = 0;

  const { Transform } = require('stream');

  const extractStream = new Transform({
    objectMode: true,
    async transform(items: any, enc: any, callback: any) {
      try {
        for (const item of items) {
          if (item.type === 'node') {
            totalProcessed++;
            if (item.tags && (item.tags.amenity === 'hospital' || item.tags.amenity === 'clinic') && item.tags.name) {
              totalFound++;
              batch.push({
                externalId: `osm-node-${item.id}`,
                name: item.tags.name,
                latitude: item.lat,
                longitude: item.lon,
                address: `${item.tags['addr:street'] || ''} ${item.tags['addr:city'] || ''}`.trim() || 'Location via OSM',
                phone: item.tags.phone || item.tags['contact:phone'] || '',
                website: item.tags.website || item.tags['contact:website'] || '',
                isHospital: item.tags.amenity === 'hospital',
                specialties: getSpecialties(item.tags.name, item.tags.amenity === 'hospital')
              });

              if (batch.length >= 1000) {
                const currentBatch = [...batch];
                batch = [];
                await flushBatch(currentBatch);
              }
            }
          }
        }
        callback();
      } catch (err) {
        callback(err);
      }
    }
  });

  const stream = fs.createReadStream(pbfPath)
    .pipe(parse())
    .pipe(extractStream);

  stream.on('finish', async () => {
    if (batch.length > 0) {
      await flushBatch(batch);
    }
    console.log(`\n\nDone! Processed ${totalProcessed} nodes, extracted ${totalFound} medical facilities!`);
    await prisma.$disconnect();
  });
}

main().catch(console.error);
