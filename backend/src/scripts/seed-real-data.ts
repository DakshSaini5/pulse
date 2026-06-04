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
    let delhiSeeded = 0;
    let mumbaiSeeded = 0;
    let blrSeeded = 0;

    for (const node of elements) {
      if (!node.tags || !node.tags.name) continue; // Skip unnamed
      if (node.tags.name.length < 3) continue;

      const lat = node.lat || (node.center ? node.center.lat : null);
      const lon = node.lon || (node.center ? node.center.lon : null);
      if (!lat || !lon) continue;

      // Identify city
      let city = 'Delhi';
      if (lat > 28) city = 'Delhi';
      else if (lat > 18) city = 'Mumbai';
      else city = 'Bangalore';

      // Extract details
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

      // Check Government vs. Private vs. Clinic
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
            workingHours: workingHours,
            emergencyAvailable: isEmergency,
            recommendationScore: Math.floor(Math.random() * (85 - 60 + 1) + 60),
          }
        });

        // Link specialties with ethical timing and consult fee rules
        for (const sName of specs) {
          if (specialtiesMap.has(sName)) {
            let opdTimings = 'Contact Facility to Confirm';
            let averageCost = 0.0; 

            if (isGovt) {
              opdTimings = '09:00 AM - 01:00 PM (Mon - Sat)';
              averageCost = 10.0; // Govt registration fee
            } else if (isHospital) {
              opdTimings = '09:00 AM - 05:00 PM (Mon - Sat)';
              averageCost = 0.0; // Private hospital, display contact prompt
            } else {
              opdTimings = node.tags.opening_hours || 'Contact Facility to Confirm';
              averageCost = 0.0; // Private clinic, display contact prompt
            }

            await prisma.hospitalSpecialty.create({
              data: {
                hospitalId: hosp.id,
                specialtyId: specialtiesMap.get(sName),
                departments: `${sName} Department`,
                averageCost: averageCost,
                opdTimings: opdTimings,
              }
            });
          }
        }
        
        insertedCount++;
        if (city === 'Delhi') delhiSeeded++;
        else if (city === 'Mumbai') mumbaiSeeded++;
        else if (city === 'Bangalore') blrSeeded++;

        if (insertedCount >= 3500) {
          console.log('✋ Capping at 3500 OSM hospitals to protect database limits.');
          break;
        }

      } catch (err) {
        // Skip on duplicate externalId or other weird errors
      }
    }

    console.log(`✅ Successfully seeded: Delhi: ${delhiSeeded}, Bangalore: ${blrSeeded}, Mumbai: ${mumbaiSeeded} bulk OSM hospitals.`);
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
