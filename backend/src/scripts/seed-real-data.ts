import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Generate a grid of India to fetch sequentially and avoid 504 Timeouts
function generateIndiaGrid() {
  const bboxes = [];
  // India roughly spans Lat 8 to 36, Lon 68 to 97. We use 4x4 degree chunks.
  for (let lat = 8; lat <= 36; lat += 4) {
    for (let lon = 68; lon <= 96; lon += 4) {
      bboxes.push(`${lat},${lon},${lat + 4},${lon + 4}`);
    }
  }
  return bboxes;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🌱 Starting Real Hospital Data Seeding Pipeline...');

  // 1. Wipe existing hospital data (preserve users, reports, prescriptions)
  console.log('🧹 Wiping old hospital data safely...');
  await prisma.recommendation.deleteMany({});
  await prisma.savedHospital.deleteMany({});
  await prisma.hospitalReview.deleteMany({});
  await prisma.hospitalSpecialty.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.specialty.deleteMany({});

  // 2. Create Core Specialties
  console.log('🔬 Creating Verified Specialties...');
  const specialtiesMap = new Map();
  const specialtiesToCreate = [
    { name: 'Cardiology', description: 'Expert heart valves and cardiac diagnostics.', category: 'HEART' },
    { name: 'Endocrinology', description: 'Thyroid panel adjustments, hormones and diabetes.', category: 'METABOLIC' },
    { name: 'Hematology', description: 'Blood indices, anemia, cell structures.', category: 'BLOOD' },
    { name: 'Neurology', description: 'Neurological assessments and central nervous systems.', category: 'BRAIN' },
    { name: 'Pediatrics', description: 'Infant healthcare, immunization, and growth metrics.', category: 'CHILDREN' },
    { name: 'General Medicine', description: 'Primary health consultations and checkups.', category: 'GENERAL' },
    { name: 'Dental', description: 'Comprehensive oral hygiene, root canals, and orthodontic care.', category: 'DENTAL' },
    { name: 'Eye Care', description: 'Vision correction, cataract surgeries, and ophthalmic diagnostics.', category: 'EYE' },
  ];

  for (const spec of specialtiesToCreate) {
    const created = await prisma.specialty.create({ data: spec });
    specialtiesMap.set(created.name, created.id);
  }

  // 3. Seed Verified Top-Tier Hospitals
  console.log('🏥 Seeding Verified Top-Tier Hospitals...');
  const verifiedPath = path.join(__dirname, '../data/verified-hospitals.json');
  if (fs.existsSync(verifiedPath)) {
    const verifiedData = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));

    for (const h of verifiedData) {
      const created = await prisma.hospital.create({
        data: {
          name: h.name || 'Unknown Hospital',
          address: h.address || 'Delhi Area',
          latitude: h.latitude || 28.6139,
          longitude: h.longitude || 77.2090,
          rating: h.rating || 4.0,
          phone: h.phone || null,
          website: h.website || null,
          workingHours: h.workingHours || 'Open 24 Hours',
          emergencyAvailable: h.emergencyAvailable !== undefined ? h.emergencyAvailable : true,
          recommendationScore: Math.floor(Math.random() * (99 - 85 + 1) + 85),
        },
      });

      for (const specName of h.specialties) {
        if (specialtiesMap.has(specName)) {
          await prisma.hospitalSpecialty.create({
            data: {
              hospitalId: created.id,
              specialtyId: specialtiesMap.get(specName),
              departments: `${specName} Department`,
              averageCost: h.averageCost || 0.0,
              opdTimings: h.opdTimings || '09:00 AM - 05:00 PM (Mon - Sat)',
            },
          });
        }
      }
    }
    console.log(`✅ Inserted ${verifiedData.length} verified hospitals.`);
  }

  // 4. Fetch Bulk OSM Data 
  console.log('🌍 Fetching OpenStreetMap bulk data (Nodes, Ways, Relations) for General Care facilities...');
  const bboxes = generateIndiaGrid();
  console.log(`🗺️  Generated ${bboxes.length} bounding box chunks to prevent API timeouts.`);

  let totalInsertedCount = 0;
  const BATCH_SIZE = 500;
  
  let hospitalBatch: any[] = [];
  let specialtyBatch: any[] = [];

  for (let i = 0; i < bboxes.length; i++) {
    const bbox = bboxes[i];
    console.log(`\n⏳ Fetching chunk ${i + 1}/${bboxes.length} [${bbox}]...`);
    
    let query = `[out:json];(nwr["amenity"="hospital"](${bbox});nwr["amenity"="clinic"](${bbox}););out center;`;
    
    try {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'User-Agent': 'PulseHealthcareApp/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        console.warn(`⚠️  HTTP error on chunk ${i + 1}: ${response.status}. Skipping and moving to next chunk...`);
        await sleep(3000);
        continue;
      }

      const data: any = await response.json();
      const elements = data.elements || [];
      console.log(`📦 Received ${elements.length} raw nodes from OSM for chunk ${i + 1}.`);

      for (const node of elements) {
        if (!node.tags || !node.tags.name) continue; 
        if (node.tags.name.length < 3) continue;

        const lat = node.lat || (node.center ? node.center.lat : null);
        const lon = node.lon || (node.center ? node.center.lon : null);
        if (!lat || !lon) continue;

        let city = 'Indian Region';
        if (lat > 28) city = 'North India';
        else if (lat > 18) city = 'Central India';
        else city = 'South India';

        const amenity = node.tags.amenity || 'hospital';
        const isHospital = amenity.toLowerCase() === 'hospital';

        const isEmergency = isHospital ? true : (node.tags.emergency?.toLowerCase() === 'yes');
        const workingHours = isHospital ? 'Open 24 Hours' : (node.tags.opening_hours || 'Contact Facility to Confirm');

        const phone = node.tags['contact:phone'] || node.tags.phone || null;
        const website = node.tags['contact:website'] || node.tags.website || null;

        let address = '';
        if (node.tags['addr:street']) address += node.tags['addr:street'] + ', ';
        if (node.tags['addr:city']) address += node.tags['addr:city'];

        if (!address) {
          address = `${city} Area`;
        }

        const lowerName = node.tags.name.toLowerCase();
        const isGovt = lowerName.includes('government') ||
          lowerName.includes('govt') ||
          lowerName.includes('municipal') ||
          lowerName.includes('aiims') ||
          lowerName.includes('charitable') ||
          lowerName.includes('general hospital') ||
          lowerName.includes('esic') ||
          lowerName.includes('civil hospital') ||
          lowerName.includes('railway hospital') ||
          lowerName.includes('district hospital');

        let specs = ['General Medicine'];

        if (isHospital || isGovt || lowerName.includes('general hospital') || lowerName.includes('multispeciality') || lowerName.includes('multi specialty')) {
          specs.push('Dental');
          specs.push('Eye Care');
        }

        if (lowerName.includes('dental') || lowerName.includes('dentist') || lowerName.includes('tooth') || lowerName.includes('teeth')) {
          specs.push('Dental');
        }
        if (lowerName.includes('eye') || lowerName.includes('vision') || lowerName.includes('optician') || lowerName.includes('ophthalmology')) {
          specs.push('Eye Care');
        }

        if (node.tags['healthcare:speciality']) {
          const osmSpec = node.tags['healthcare:speciality'].toLowerCase();
          if (osmSpec.includes('cardiology')) specs.push('Cardiology');
          if (osmSpec.includes('neurology')) specs.push('Neurology');
          if (osmSpec.includes('endocrinology')) specs.push('Endocrinology');
          if (osmSpec.includes('paediatrics') || osmSpec.includes('pediatrics')) specs.push('Pediatrics');
          if (osmSpec.includes('haematology') || osmSpec.includes('hematology')) specs.push('Hematology');
          if (osmSpec.includes('dentist') || osmSpec.includes('dental') || osmSpec.includes('dentistry')) specs.push('Dental');
          if (osmSpec.includes('ophthalmology') || osmSpec.includes('eye') || osmSpec.includes('optician')) specs.push('Eye Care');
        }

        specs = Array.from(new Set(specs));

        // Generate ID manually so we can map specialties correctly without needing return values from createMany
        const hospId = crypto.randomUUID();

        hospitalBatch.push({
          id: hospId,
          name: node.tags.name,
          address: address,
          latitude: lat,
          longitude: lon,
          // Retaining exact randomized rating logic as requested
          rating: parseFloat((Math.random() * (4.8 - 3.5) + 3.5).toFixed(1)),
          phone: phone,
          website: website,
          workingHours: workingHours,
          emergencyAvailable: isEmergency,
          recommendationScore: Math.floor(Math.random() * (85 - 60 + 1) + 60),
        });

        // Link specialties with ethical timing and consult fee rules
        for (const sName of specs) {
          if (specialtiesMap.has(sName)) {
            let opdTimings = 'Contact Facility to Confirm';
            let averageCost = 0.0;

            if (isGovt) {
              opdTimings = '09:00 AM - 01:00 PM (Mon - Sat)';
              averageCost = 10.0;
            } else if (isHospital) {
              opdTimings = '09:00 AM - 05:00 PM (Mon - Sat)';
              averageCost = 0.0;
            } else {
              opdTimings = node.tags.opening_hours || 'Contact Facility to Confirm';
              averageCost = 0.0;
            }

            specialtyBatch.push({
              hospitalId: hospId,
              specialtyId: specialtiesMap.get(sName),
              departments: `${sName} Department`,
              averageCost: averageCost,
              opdTimings: opdTimings,
            });
          }
        }

        // Batch Insert Logic
        if (hospitalBatch.length >= BATCH_SIZE) {
          await prisma.hospital.createMany({ data: hospitalBatch, skipDuplicates: true });
          await prisma.hospitalSpecialty.createMany({ data: specialtyBatch, skipDuplicates: true });
          
          totalInsertedCount += hospitalBatch.length;
          console.log(`✅ Batch inserted. Total OSM hospitals so far: ${totalInsertedCount}`);
          
          hospitalBatch = [];
          specialtyBatch = [];
        }
      }

      // Respect OSM API Limits by waiting between chunk requests
      await sleep(2000);

    } catch (err: any) {
      console.error(`❌ Failed to fetch from chunk ${i + 1}:`, err.message);
    }
  }

  // Insert any remaining hospitals in the final partial batch
  if (hospitalBatch.length > 0) {
    await prisma.hospital.createMany({ data: hospitalBatch, skipDuplicates: true });
    await prisma.hospitalSpecialty.createMany({ data: specialtyBatch, skipDuplicates: true });
    totalInsertedCount += hospitalBatch.length;
    console.log(`✅ Final batch inserted. Total OSM hospitals so far: ${totalInsertedCount}`);
  }

  console.log(`🎉 Seeding Pipeline Completed Successfully! Total OSM Hospitals Seeded: ${totalInsertedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
