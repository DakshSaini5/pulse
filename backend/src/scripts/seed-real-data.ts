import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bounding boxes for Delhi, Mumbai, Bangalore [south, west, north, east]
const BBOXES = [
  '28.40,76.84,28.88,77.34', // Delhi
  '18.89,72.77,19.27,72.98', // Mumbai
  '12.83,77.46,13.14,77.78'  // Bangalore
];

async function main() {
  console.log('🌱 Starting Real Hospital Data Seeding Pipeline...');

  // 1. Wipe existing hospital data (preserve users and reports)
  console.log('🧹 Wiping old hospital data...');
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
  ];

  for (const spec of specialtiesToCreate) {
    const created = await prisma.specialty.create({ data: spec });
    specialtiesMap.set(created.name, created.id);
  }

  // 3. Seed Verified Top-Tier Hospitals
  console.log('🏥 Seeding Verified Top-Tier Hospitals...');
  const verifiedPath = path.join(__dirname, '../data/verified-hospitals.json');
  const verifiedData = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));

  for (const h of verifiedData) {
    const created = await prisma.hospital.create({
      data: {
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        rating: h.rating,
        phone: h.phone,
        website: h.website,
        workingHours: h.workingHours,
        emergencyAvailable: h.emergencyAvailable,
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
            averageCost: Math.floor(Math.random() * (150 - 50 + 1) + 50),
          },
        });
      }
    }
  }

  console.log(`✅ Inserted ${verifiedData.length} verified hospitals.`);

  // 4. Fetch Bulk OSM Data (General Care Only)
  console.log('🌍 Fetching OpenStreetMap bulk data (Nodes, Ways, Relations) for General Care facilities...');
  
  let query = '[out:json];(';
  for (const bbox of BBOXES) {
    query += `nwr["amenity"="hospital"](${bbox});`;
    query += `nwr["amenity"="clinic"](${bbox});`;
  }
  query += ');out center;';

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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();
    const elements = data.elements || [];
    console.log(`📦 Received ${elements.length} raw nodes from OSM.`);

    let insertedCount = 0;

    for (const node of elements) {
      if (!node.tags || !node.tags.name) continue; // Skip unnamed
      
      // Filter out weirdly named ones to keep it somewhat clean
      if (node.tags.name.length < 3) continue;

      const lat = node.lat || (node.center ? node.center.lat : null);
      const lon = node.lon || (node.center ? node.center.lon : null);
      if (!lat || !lon) continue;

      // Extract details
      const emergencyStr = node.tags.emergency || '';
      const isEmergency = emergencyStr.toLowerCase() === 'yes';
      
      const phone = node.tags['contact:phone'] || node.tags.phone || null;
      const website = node.tags['contact:website'] || node.tags.website || null;
      
      let address = '';
      if (node.tags['addr:street']) address += node.tags['addr:street'] + ', ';
      if (node.tags['addr:city']) address += node.tags['addr:city'];
      
      if (!address) {
        // Approximate city based on latitude
        if (lat > 28) address = 'Delhi Area';
        else if (lat > 18) address = 'Mumbai Area';
        else address = 'Bangalore Area';
      }

      // We strictly assign General Medicine UNLESS OSM explicitly has a healthcare:speciality tag
      let specs = ['General Medicine'];
      if (node.tags['healthcare:speciality']) {
        const osmSpec = node.tags['healthcare:speciality'].toLowerCase();
        if (osmSpec.includes('cardiology')) specs.push('Cardiology');
        if (osmSpec.includes('neurology')) specs.push('Neurology');
        if (osmSpec.includes('endocrinology')) specs.push('Endocrinology');
        if (osmSpec.includes('paediatrics') || osmSpec.includes('pediatrics')) specs.push('Pediatrics');
        if (osmSpec.includes('haematology') || osmSpec.includes('hematology')) specs.push('Hematology');
      }

      // De-duplicate specialties
      specs = [...new Set(specs)];

      try {
        const hosp = await prisma.hospital.create({
          data: {
            name: node.tags.name,
            address: address,
            latitude: lat,
            longitude: lon,
            rating: parseFloat((Math.random() * (4.8 - 3.5) + 3.5).toFixed(1)), // Fake rating for OSM
            phone: phone,
            website: website,
            workingHours: node.tags.opening_hours || '09:00 AM - 08:00 PM',
            emergencyAvailable: isEmergency,
            recommendationScore: Math.floor(Math.random() * (85 - 60 + 1) + 60),
          }
        });

        // Link specialties
        for (const sName of specs) {
          if (specialtiesMap.has(sName)) {
            await prisma.hospitalSpecialty.create({
              data: {
                hospitalId: hosp.id,
                specialtyId: specialtiesMap.get(sName),
                departments: `${sName} Outpatient`,
                averageCost: Math.floor(Math.random() * (80 - 30 + 1) + 30),
              }
            });
          }
        }
        
        insertedCount++;

        // Let's cap at 2500 to enrich maps in Delhi and Bangalore
        if (insertedCount >= 2500) {
          console.log('✋ Capping at 2500 OSM hospitals to protect database limits.');
          break;
        }

      } catch (err) {
        // Skip on duplicate externalId or other weird errors
      }
    }

    console.log(`✅ Successfully seeded ${insertedCount} bulk OSM hospitals.`);
  } catch (err: any) {
    console.error('❌ Failed to fetch from Overpass API:', err.message);
  }

  console.log('🎉 Seeding Pipeline Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
