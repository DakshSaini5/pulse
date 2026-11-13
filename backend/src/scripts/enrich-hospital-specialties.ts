import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CORE_SPECIALTIES = [
  { name: 'Cardiology', description: 'Expert heart valves, cardiac diagnostics and treatment.', category: 'HEART' },
  { name: 'Orthopedics', description: 'Bone, joint and musculoskeletal disorders.', category: 'BONE' },
  { name: 'Pediatrics', description: 'Infant and child healthcare, immunization and pediatric medicine.', category: 'CHILDREN' },
  { name: 'Gynecology', description: "Women's reproductive health, maternity and obstetrics.", category: 'WOMEN' },
  { name: 'General Medicine', description: 'Primary consultations, internal medicine and diagnostics.', category: 'GENERAL' },
  { name: 'Dental', description: 'Comprehensive oral hygiene, root canals and orthodontic care.', category: 'DENTAL' },
  { name: 'Eye Care', description: 'Vision correction, cataract surgeries and ophthalmic diagnostics.', category: 'EYE' },
  { name: 'Neurology', description: 'Neurological assessments and central nervous systems.', category: 'BRAIN' },
  { name: 'Dermatology', description: 'Skin health, dermatological therapy and skin diagnostics.', category: 'SKIN' },
  { name: 'ENT', description: 'Ear, nose and throat diagnostics and clinical care.', category: 'ENT' },
  { name: 'Gastroenterology', description: 'Digestive system, liver and gastrointestinal clinical care.', category: 'DIGESTIVE' },
  { name: 'Pulmonology', description: 'Lungs, respiratory system and pulmonary clinical care.', category: 'LUNG' },
  { name: 'Oncology', description: 'Cancer care, oncology consultations and tumor management.', category: 'CANCER' },
  { name: 'Nephrology', description: 'Kidney care, dialysis and renal diagnostics.', category: 'KIDNEY' },
  { name: 'Emergency Medicine', description: '24×7 urgent care, trauma management and emergency triage.', category: 'EMERGENCY' },
  { name: 'General Surgery', description: 'Comprehensive clinical surgeries and surgical consultations.', category: 'SURGERY' },
];

function inferSpecialtiesForHospital(name: string, isEmergency: boolean): string[] {
  const specs = new Set<string>();
  const lower = name.toLowerCase();

  // Always include primary care
  specs.add('General Medicine');
  if (isEmergency) specs.add('Emergency Medicine');

  // Major hospital brands, tertiary multi-specialty facilities & govt hospitals
  const isMajorBrand = 
    lower.includes('apollo') ||
    lower.includes('fortis') ||
    lower.includes('max') ||
    lower.includes('manipal') ||
    lower.includes('sparsh') ||
    lower.includes('prakriya') ||
    lower.includes('venkateshwar') ||
    lower.includes('medanta') ||
    lower.includes('narayana') ||
    lower.includes('aiims') ||
    lower.includes('columbia asia') ||
    lower.includes('aster') ||
    lower.includes('sakra') ||
    lower.includes('blk') ||
    lower.includes('ganga ram') ||
    lower.includes('safdarjung') ||
    lower.includes('ram manohar lohia') ||
    lower.includes('lok nayak') ||
    lower.includes('hindu rao') ||
    lower.includes('jayadeva') ||
    lower.includes('nimhans') ||
    lower.includes('kims') ||
    lower.includes('mallya');

  const isGeneralOrMultiFacility = 
    isMajorBrand ||
    lower.includes('multispeciality') ||
    lower.includes('multi speciality') ||
    lower.includes('multi-speciality') ||
    lower.includes('super speciality') ||
    lower.includes('superspeciality') ||
    lower.includes('super-speciality') ||
    lower.includes('general hospital') ||
    lower.includes('district hospital') ||
    lower.includes('civil hospital') ||
    lower.includes('government hospital') ||
    lower.includes('govt hospital') ||
    lower.includes('municipal hospital') ||
    lower.includes('medical college') ||
    lower.includes('institute of medical') ||
    lower.includes('hospital & research');

  if (isGeneralOrMultiFacility) {
    specs.add('Cardiology');
    specs.add('Orthopedics');
    specs.add('Pediatrics');
    specs.add('Gynecology');
    specs.add('General Surgery');
    specs.add('Emergency Medicine');
    specs.add('Dental');
    specs.add('Eye Care');
    specs.add('Neurology');
  }

  // Name keyword mapping for clinics and specialty centers
  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('cardio') || lower.includes('ecg')) {
    specs.add('Cardiology');
  }
  if (lower.includes('bone') || lower.includes('ortho') || lower.includes('joint') || lower.includes('spine') || lower.includes('fracture')) {
    specs.add('Orthopedics');
  }
  if (lower.includes('child') || lower.includes('pediatric') || lower.includes('paedia') || lower.includes('pedia') || lower.includes('baby') || lower.includes('infant') || lower.includes('neonatal')) {
    specs.add('Pediatrics');
  }
  if (lower.includes('women') || lower.includes('maternity') || lower.includes('gynae') || lower.includes('gyneco') || lower.includes('obstet') || lower.includes('mother') || lower.includes('fertility')) {
    specs.add('Gynecology');
  }
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('ophthal') || lower.includes('drishti') || lower.includes('netra') || lower.includes('optician') || lower.includes('cataract') || lower.includes('lasik')) {
    specs.add('Eye Care');
  }
  if (lower.includes('dental') || lower.includes('dentist') || lower.includes('tooth') || lower.includes('teeth') || lower.includes('smile') || lower.includes('oral') || lower.includes('orthodont')) {
    specs.add('Dental');
  }
  if (lower.includes('skin') || lower.includes('derma')) {
    specs.add('Dermatology');
  }
  if (lower.includes('ent') || lower.includes('ear') || lower.includes('nose') || lower.includes('throat')) {
    specs.add('ENT');
  }
  if (lower.includes('neuro') || lower.includes('brain')) {
    specs.add('Neurology');
  }
  if (lower.includes('cancer') || lower.includes('oncol') || lower.includes('tumor')) {
    specs.add('Oncology');
  }
  if (lower.includes('kidney') || lower.includes('nephro') || lower.includes('renal') || lower.includes('dialysis')) {
    specs.add('Nephrology');
  }
  if (lower.includes('gastro') || lower.includes('liver') || lower.includes('digestive')) {
    specs.add('Gastroenterology');
  }
  if (lower.includes('chest') || lower.includes('pulmo') || lower.includes('lung') || lower.includes('respir')) {
    specs.add('Pulmonology');
  }

  return Array.from(specs);
}

async function main() {
  console.log('🚀 Starting Hospital Specialty Database Enrichment...');

  // 1. Ensure all core specialties exist
  const specMap = new Map<string, string>();
  for (const s of CORE_SPECIALTIES) {
    const record = await prisma.specialty.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    specMap.set(record.name.toLowerCase(), record.id);
  }
  console.log(`✅ Verified ${CORE_SPECIALTIES.length} core clinical specialties.`);

  // 2. Fetch all hospitals with their existing specialties
  const hospitals = await prisma.hospital.findMany({
    select: {
      id: true,
      name: true,
      emergencyAvailable: true,
      workingHours: true,
      specialties: {
        select: {
          specialty: {
            select: { name: true }
          }
        }
      }
    }
  });

  console.log(`🏥 Found ${hospitals.length} hospitals in database. Analyzing departments...`);

  const batchToInsert: any[] = [];
  let totalNewMappings = 0;

  for (const hosp of hospitals) {
    const existingSpecs = new Set(
      hosp.specialties.map(s => s.specialty.name.toLowerCase())
    );

    const inferred = inferSpecialtiesForHospital(hosp.name, hosp.emergencyAvailable);

    for (const specName of inferred) {
      const lower = specName.toLowerCase();
      if (!existingSpecs.has(lower)) {
        const specId = specMap.get(lower);
        if (specId) {
          batchToInsert.push({
            hospitalId: hosp.id,
            specialtyId: specId,
            departments: `${specName} Department`,
            averageCost: 0.0,
            opdTimings: hosp.workingHours || 'Contact facility to confirm',
          });
          totalNewMappings++;
        }
      }
    }
  }

  console.log(`📦 Prepared ${totalNewMappings} new specialty links across facilities.`);

  // 3. Insert in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < batchToInsert.length; i += BATCH_SIZE) {
    const chunk = batchToInsert.slice(i, i + BATCH_SIZE);
    await prisma.hospitalSpecialty.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`  Saved ${Math.min(i + BATCH_SIZE, batchToInsert.length)}/${batchToInsert.length}...`);
  }

  console.log(`🎉 Successfully enriched database! Linked ${totalNewMappings} specialty departments.`);
}

main()
  .catch((e) => {
    console.error('❌ Enrichment failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
