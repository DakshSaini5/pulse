/**
 * ENHANCED SEED - Fetches from Overpass API with NO cap (all cities)
 * Removes the 3500 hospital limit and covers all of India's major metros
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

// All major Indian metros bounding boxes [south, west, north, east]
const CITY_BBOXES = [
  { name: 'Delhi NCR',     bbox: '28.40,76.84,28.88,77.34' },
  { name: 'Mumbai',        bbox: '18.89,72.77,19.27,72.98' },
  { name: 'Bangalore',     bbox: '12.83,77.46,13.14,77.78' },
  { name: 'Chennai',       bbox: '12.93,80.07,13.23,80.32' },
  { name: 'Hyderabad',     bbox: '17.27,78.27,17.56,78.60' },
  { name: 'Kolkata',       bbox: '22.45,88.26,22.66,88.47' },
  { name: 'Pune',          bbox: '18.44,73.78,18.62,73.97' },
  { name: 'Ahmedabad',     bbox: '22.99,72.52,23.11,72.69' },
  { name: 'Jaipur',        bbox: '26.82,75.74,26.96,75.89' },
  { name: 'Lucknow',       bbox: '26.78,80.87,26.92,81.02' },
  { name: 'Noida/Gurgaon', bbox: '28.40,77.00,28.65,77.40' },
];

async function fetchWithFallback(query: string): Promise<any[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`  Trying ${endpoint.split('/')[2]}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'User-Agent': 'PulseHealthcareApp/2.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(120000), // 2 min timeout
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      return data.elements || [];
    } catch (err: any) {
      console.warn(`  Failed: ${err.message}. Trying next...`);
    }
  }
  return [];
}

async function ensureSpecialties(): Promise<Map<string, string>> {
  const specialtyData = [
    { name: 'Cardiology', description: 'Heart and cardiovascular diseases', category: 'HEART' },
    { name: 'Neurology', description: 'Brain and nervous system disorders', category: 'BRAIN' },
    { name: 'Orthopedics', description: 'Bone, joint and muscle disorders', category: 'BONE' },
    { name: 'Pediatrics', description: 'Child healthcare and development', category: 'CHILDREN' },
    { name: 'Gynecology', description: "Women's reproductive health", category: 'WOMEN' },
    { name: 'Oncology', description: 'Cancer diagnosis and treatment', category: 'CANCER' },
    { name: 'Endocrinology', description: 'Hormonal and metabolic disorders', category: 'METABOLIC' },
    { name: 'Gastroenterology', description: 'Digestive system disorders', category: 'DIGESTIVE' },
    { name: 'Pulmonology', description: 'Lung and respiratory disorders', category: 'LUNG' },
    { name: 'Urology', description: 'Urinary tract and kidney disorders', category: 'URINARY' },
    { name: 'Ophthalmology', description: 'Eye and vision disorders', category: 'EYE' },
    { name: 'ENT', description: 'Ear, nose and throat disorders', category: 'ENT' },
    { name: 'Dermatology', description: 'Skin, hair and nail disorders', category: 'SKIN' },
    { name: 'Psychiatry', description: 'Mental health disorders', category: 'MENTAL' },
    { name: 'Hematology', description: 'Blood disorders and diseases', category: 'BLOOD' },
    { name: 'Rheumatology', description: 'Autoimmune and joint diseases', category: 'JOINT' },
    { name: 'Nephrology', description: 'Kidney diseases and dialysis', category: 'KIDNEY' },
    { name: 'General Surgery', description: 'Surgical procedures and operations', category: 'SURGERY' },
    { name: 'General Medicine', description: 'Primary care and general health', category: 'GENERAL' },
    { name: 'Emergency Medicine', description: '24/7 emergency critical care', category: 'EMERGENCY' },
    { name: 'Dental', description: 'Oral health and dental care', category: 'DENTAL' },
    { name: 'Radiology', description: 'Medical imaging and diagnostics', category: 'IMAGING' },
    { name: 'Physiotherapy', description: 'Physical rehabilitation and therapy', category: 'REHAB' },
    { name: 'Eye Care', description: 'Vision and eye health', category: 'EYE' },
  ];

  const map = new Map<string, string>();
  for (const s of specialtyData) {
    const existing = await prisma.specialty.findFirst({ where: { name: s.name } });
    if (existing) {
      map.set(s.name, existing.id);
    } else {
      const created = await prisma.specialty.create({ data: s });
      map.set(s.name, created.id);
    }
  }
  return map;
}

function inferSpecialties(name: string, isHospital: boolean, osmSpec?: string): string[] {
  const specs = new Set<string>();
  const lower = name.toLowerCase();

  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('cardio')) specs.add('Cardiology');
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('opthal')) specs.add('Ophthalmology');
  if (lower.includes('ortho') || lower.includes('bone') || lower.includes('spine')) specs.add('Orthopedics');
  if (lower.includes('child') || lower.includes('pediatric') || lower.includes('pedia') || lower.includes('paedia')) specs.add('Pediatrics');
  if (lower.includes('dental') || lower.includes('tooth') || lower.includes('teeth') || lower.includes('dentist')) specs.add('Dental');
  if (lower.includes('women') || lower.includes('maternity') || lower.includes('gynae') || lower.includes('gyneco') || lower.includes('obstet')) specs.add('Gynecology');
  if (lower.includes('skin') || lower.includes('dermato')) specs.add('Dermatology');
  if (lower.includes('cancer') || lower.includes('oncology') || lower.includes('tumor') || lower.includes('tumour')) specs.add('Oncology');
  if (lower.includes('ent') || lower.includes('ear') || lower.includes('nose') || lower.includes('throat')) specs.add('ENT');
  if (lower.includes('neuro') || lower.includes('brain')) specs.add('Neurology');
  if (lower.includes('kidney') || lower.includes('nephr') || lower.includes('renal') || lower.includes('dialysis')) specs.add('Nephrology');
  if (lower.includes('gastro') || lower.includes('liver') || lower.includes('digestive')) specs.add('Gastroenterology');
  if (lower.includes('lung') || lower.includes('pulmo') || lower.includes('chest') || lower.includes('respir')) specs.add('Pulmonology');
  if (lower.includes('urology') || lower.includes('urol') || lower.includes('urinary')) specs.add('Urology');
  if (lower.includes('mental') || lower.includes('psychiat') || lower.includes('psychol')) specs.add('Psychiatry');
  if (lower.includes('blood') || lower.includes('hemato')) specs.add('Hematology');
  if (lower.includes('physio') || lower.includes('rehabilit') || lower.includes('rehab')) specs.add('Physiotherapy');
  if (lower.includes('radio') || lower.includes('imaging') || lower.includes('scan') || lower.includes('mri')) specs.add('Radiology');
  if (lower.includes('surgery') || lower.includes('surgical')) specs.add('General Surgery');

  // Big brand hospitals - add all specialties
  if (lower.includes('apollo') || lower.includes('fortis') || lower.includes('max super') || lower.includes('medanta') || 
      lower.includes('manipal') || lower.includes('narayana') || lower.includes('aiims') || lower.includes('blk') ||
      lower.includes('nimhans') || lower.includes('tata memorial') || lower.includes('pgimer')) {
    ['Cardiology','Neurology','Orthopedics','Oncology','Gastroenterology','Nephrology','Pulmonology','Urology','Pediatrics','Gynecology','General Medicine','Emergency Medicine','General Surgery'].forEach(s => specs.add(s));
  }

  if (osmSpec) {
    if (osmSpec.includes('cardiology')) specs.add('Cardiology');
    if (osmSpec.includes('neurology')) specs.add('Neurology');
    if (osmSpec.includes('paediatrics') || osmSpec.includes('pediatrics')) specs.add('Pediatrics');
    if (osmSpec.includes('dental') || osmSpec.includes('dentist')) specs.add('Dental');
    if (osmSpec.includes('ophthalmology') || osmSpec.includes('eye')) specs.add('Ophthalmology');
    if (osmSpec.includes('gynaecology') || osmSpec.includes('gynecology') || osmSpec.includes('obstet')) specs.add('Gynecology');
    if (osmSpec.includes('orthopaedics') || osmSpec.includes('orthopedics')) specs.add('Orthopedics');
  }

  if (specs.size === 0) specs.add('General Medicine');
  if (isHospital) specs.add('Emergency Medicine');

  return Array.from(specs);
}

async function seedCityFromOSM(cityName: string, bbox: string, specialtiesMap: Map<string, string>): Promise<number> {
  console.log(`\n🏙️  Fetching hospitals for ${cityName}...`);
  
  const query = `[out:json][timeout:60];(nwr["amenity"="hospital"](${bbox});nwr["amenity"="clinic"](${bbox}););out center;`;
  const elements = await fetchWithFallback(query);
  
  console.log(`  📦 Got ${elements.length} elements from OSM`);
  
  let inserted = 0;
  const BATCH = 100;
  
  for (let i = 0; i < elements.length; i += BATCH) {
    const chunk = elements.slice(i, i + BATCH);
    
    const toInsert = chunk
      .filter((node: any) => node.tags?.name && node.tags.name.length >= 3)
      .map((node: any) => {
        const lat = node.lat ?? node.center?.lat;
        const lon = node.lon ?? node.center?.lon;
        if (!lat || !lon) return null;
        
        const isHospital = node.tags.amenity === 'hospital';
        const isGovt = /government|govt|municipal|aiims|civil hospital|esic|railway hospital|district hospital|charitable/i.test(node.tags.name);
        
        let address = '';
        if (node.tags['addr:street']) address += node.tags['addr:street'] + ', ';
        if (node.tags['addr:city']) address += node.tags['addr:city'];
        if (!address) address = `${cityName} Area`;
        
        return {
          externalId: `osm-${node.type || 'node'}-${node.id}`,
          name: node.tags.name,
          address,
          latitude: lat,
          longitude: lon,
          rating: parseFloat((Math.random() * (4.8 - 3.5) + 3.5).toFixed(1)),
          phone: node.tags['contact:phone'] || node.tags.phone || null,
          website: node.tags['contact:website'] || node.tags.website || null,
          workingHours: isHospital ? 'Open 24 Hours' : (node.tags.opening_hours || '09:00 AM - 09:00 PM'),
          emergencyAvailable: isHospital || node.tags.emergency === 'yes',
          recommendationScore: isGovt ? 75 : Math.floor(Math.random() * (95 - 70 + 1) + 70),
          specialties: inferSpecialties(node.tags.name, isHospital, node.tags['healthcare:speciality']),
        };
      })
      .filter(Boolean) as any[];
    
    if (toInsert.length === 0) continue;
    
    try {
      // Batch insert hospitals
      await prisma.hospital.createMany({
        data: toInsert.map(h => ({
          externalId: h.externalId,
          name: h.name,
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          rating: h.rating,
          phone: h.phone,
          website: h.website,
          workingHours: h.workingHours,
          emergencyAvailable: h.emergencyAvailable,
          recommendationScore: h.recommendationScore,
        })),
        skipDuplicates: true,
      });
      
      // Fetch the IDs of what we just inserted
      const saved = await prisma.hospital.findMany({
        where: { externalId: { in: toInsert.map(h => h.externalId) } },
        select: { id: true, externalId: true },
      });
      const idMap = new Map(saved.map(h => [h.externalId, h.id]));
      
      // Link specialties
      const specLinks: any[] = [];
      for (const h of toInsert) {
        const dbId = idMap.get(h.externalId);
        if (!dbId) continue;
        for (const sName of h.specialties) {
          const specId = specialtiesMap.get(sName);
          if (specId) {
            specLinks.push({
              hospitalId: dbId,
              specialtyId: specId,
              departments: `${sName} Department`,
              averageCost: 0,
              opdTimings: h.workingHours,
            });
          }
        }
      }
      
      if (specLinks.length > 0) {
        await prisma.hospitalSpecialty.createMany({
          data: specLinks,
          skipDuplicates: true,
        });
      }
      
      inserted += toInsert.length;
      process.stdout.write(`  ✅ ${inserted}/${elements.length} inserted\r`);
    } catch (err: any) {
      // Skip batch errors silently
    }
    
    // Small pause to avoid DB overload
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log(`\n  ✅ ${cityName}: ${inserted} hospitals inserted`);
  return inserted;
}

async function main() {
  console.log('🚀 PULSE FULL INDIA OSM SEED - ALL METROS');
  console.log('==========================================');
  
  // Check current count
  const existingCount = await prisma.hospital.count();
  console.log(`\nCurrent hospital count: ${existingCount}`);
  
  if (existingCount > 0) {
    console.log('🧹 Wiping existing hospitals for clean re-seed...');
    await prisma.recommendation.deleteMany({});
    await prisma.savedHospital.deleteMany({});
    await prisma.hospitalReview.deleteMany({});
    await prisma.hospitalSpecialty.deleteMany({});
    await prisma.hospital.deleteMany({});
    await prisma.specialty.deleteMany({});
    console.log('✅ Wiped.');
  }
  
  console.log('\n🔬 Ensuring specialties exist...');
  const specialtiesMap = await ensureSpecialties();
  console.log(`✅ ${specialtiesMap.size} specialties ready.`);
  
  let totalInserted = 0;
  for (const city of CITY_BBOXES) {
    const count = await seedCityFromOSM(city.name, city.bbox, specialtiesMap);
    totalInserted += count;
    // Brief pause between cities
    await new Promise(r => setTimeout(r, 500));
  }
  
  const finalCount = await prisma.hospital.count();
  console.log(`\n\n🎉 SEED COMPLETE!`);
  console.log(`📊 Total hospitals in database: ${finalCount}`);
  console.log(`📊 Total inserted this run: ${totalInserted}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
