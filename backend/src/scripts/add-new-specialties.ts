import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting DB update for Dental and Eye Care specialties...');

  // 1. Create or get Dental specialty
  console.log('🦷 Creating Dental specialty...');
  const dentalSpec = await prisma.specialty.upsert({
    where: { name: 'Dental' },
    update: {},
    create: {
      name: 'Dental',
      description: 'Comprehensive oral hygiene, root canals, and orthodontic care.',
      category: 'DENTAL',
    },
  });
  console.log(`Dental specialty ID: ${dentalSpec.id}`);

  // 2. Create or get Eye Care specialty
  console.log('👁️ Creating Eye Care specialty...');
  const eyeSpec = await prisma.specialty.upsert({
    where: { name: 'Eye Care' },
    update: {},
    create: {
      name: 'Eye Care',
      description: 'Vision correction, cataract surgeries, and ophthalmic diagnostics.',
      category: 'EYE',
    },
  });
  console.log(`Eye Care specialty ID: ${eyeSpec.id}`);

  // 3. Retrieve all hospitals to link them to new specialties in-place
  console.log('🏥 Fetching all hospitals to associate specialties...');
  const hospitals = await prisma.hospital.findMany({
    include: {
      specialties: {
        include: {
          specialty: true
        }
      }
    }
  });
  console.log(`Found ${hospitals.length} hospitals in database.`);

  let dentalCount = 0;
  let eyeCount = 0;
  const specialtiesToCreateData: any[] = [];

  for (const hosp of hospitals) {
    const lowerName = hosp.name.toLowerCase();
    
    // Check if it already has Dental or Eye Care linked
    const hasDental = hosp.specialties.some(s => s.specialty.name === 'Dental');
    const hasEye = hosp.specialties.some(s => s.specialty.name === 'Eye Care');

    // Categorize
    const isDentalClinic = lowerName.includes('dental') || 
                           lowerName.includes('dentist') || 
                           lowerName.includes('tooth') || 
                           lowerName.includes('teeth');
                           
    const isEyeClinic = lowerName.includes('eye') || 
                        lowerName.includes('vision') || 
                        lowerName.includes('optician') || 
                        lowerName.includes('ophthalmology') ||
                        lowerName.includes('optometry') ||
                        lowerName.includes('cataract') ||
                        lowerName.includes('lasik');

    const hasGeneralMedicine = hosp.specialties.some(s => s.specialty.name === 'General Medicine');
    
    const isGeneralFacility = hasGeneralMedicine ||
                              lowerName.includes('hospital') || 
                              lowerName.includes('clinic') ||
                              lowerName.includes('medical') ||
                              lowerName.includes('govt') ||
                              lowerName.includes('government') ||
                              lowerName.includes('municipal') ||
                              lowerName.includes('civil') ||
                              lowerName.includes('general');

    // Link Dental
    if (!hasDental && (isDentalClinic || isGeneralFacility)) {
      specialtiesToCreateData.push({
        hospitalId: hosp.id,
        specialtyId: dentalSpec.id,
        departments: 'Dental Department',
        averageCost: 0.0, // Private clinic or hospital contact prompt
        opdTimings: hosp.workingHours || '09:00 AM - 05:00 PM (Mon - Sat)',
      });
      dentalCount++;
    }

    // Link Eye Care
    if (!hasEye && (isEyeClinic || isGeneralFacility)) {
      specialtiesToCreateData.push({
        hospitalId: hosp.id,
        specialtyId: eyeSpec.id,
        departments: 'Eye Care / Ophthalmology Department',
        averageCost: 0.0, // Private clinic or hospital contact prompt
        opdTimings: hosp.workingHours || '09:00 AM - 05:00 PM (Mon - Sat)',
      });
      eyeCount++;
    }
  }

  if (specialtiesToCreateData.length > 0) {
    console.log(`🚀 Inserting ${specialtiesToCreateData.length} mappings in bulk...`);
    await prisma.hospitalSpecialty.createMany({
      data: specialtiesToCreateData,
      skipDuplicates: true
    });
  }

  console.log(`✅ Database updated! Linked Dental specialty to ${dentalCount} hospitals, and Eye Care to ${eyeCount} hospitals.`);
}

main()
  .catch((e) => {
    console.error('❌ Error updating database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
