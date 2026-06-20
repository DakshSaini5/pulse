import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const verifiedData = [
    {
      name: "Sparsh Hospital",
      address: "Bangalore Area, Karnataka",
      specialties: [
        "Orthopedics", "Cardiology", "Neurology", "Pediatrics", "Gynecology",
        "General Medicine", "Emergency Medicine", "General Surgery"
      ]
    },
    {
      name: "Venkateshwar Hospital",
      address: "Delhi Area",
      specialties: [
        "Cardiology", "Oncology", "Neurology", "Orthopedics", "Gastroenterology",
        "Pulmonology", "Urology", "General Medicine", "Emergency Medicine"
      ]
    }
  ];

  const dbSpecialties = await prisma.specialty.findMany();
  const specMap = new Map(dbSpecialties.map(s => [s.name.toLowerCase(), s.id]));

  for (const h of verifiedData) {
    // Find the specifically injected hospital by exact name AND area to avoid the smaller clinics
    const hospital = await prisma.hospital.findFirst({
      where: { 
        name: h.name, 
        address: h.address
      }
    });

    if (hospital) {
      console.log(`Found exact ${hospital.name} in ${hospital.address}. Mapping specialties...`);
      let count = 0;
      for (const specName of h.specialties) {
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
                averageCost: 0.0,
                opdTimings: '09:00 AM - 05:00 PM (Mon - Sat)',
              }
            });
            count++;
          }
        }
      }
      console.log(`✅ Successfully attached ${count} specialties to ${hospital.name}.`);
    } else {
      console.log(`❌ Could not find ${h.name} in ${h.address}. Need to inject.`);
      // Inject if missing
      const newHosp = await prisma.hospital.create({
        data: {
          name: h.name,
          address: h.address,
          latitude: h.name === 'Sparsh Hospital' ? 12.8256 : 28.5866,
          longitude: h.name === 'Sparsh Hospital' ? 77.6698 : 77.0345,
          phone: h.name === 'Sparsh Hospital' ? '080-68154500' : '011-48555555',
          emergencyAvailable: true,
          workingHours: 'Open 24 Hours',
          rating: 4.8,
          recommendationScore: 98
        }
      });
      console.log(`Created ${newHosp.name}. Now mapping specialties...`);
      for (const specName of h.specialties) {
        const dbId = specMap.get(specName.toLowerCase());
        if (dbId) {
          await prisma.hospitalSpecialty.create({
            data: {
              hospitalId: newHosp.id,
              specialtyId: dbId,
              departments: `${specName} Department`,
              averageCost: 0.0,
              opdTimings: '09:00 AM - 05:00 PM (Mon - Sat)',
            }
          });
        }
      }
      console.log(`✅ Successfully mapped specialties for newly injected ${newHosp.name}.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
