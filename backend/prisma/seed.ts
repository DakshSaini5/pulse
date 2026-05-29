import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding pipeline...');

  // 1. Wipe existing data to allow fresh seed replays
  await prisma.adminLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.healthTrend.deleteMany({});
  await prisma.specialistRecommendation.deleteMany({});
  await prisma.medicalReportSummary.deleteMany({});
  await prisma.medicalReportValue.deleteMany({});
  await prisma.medicalReport.deleteMany({});
  await prisma.prescriptionAnalysis.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.oCRResult.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.savedHospital.deleteMany({});
  await prisma.hospitalReview.deleteMany({});
  await prisma.hospitalSpecialty.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Database cleaned successfully.');

  // 2. Seed Default Demo Users
  const userPassword = await bcrypt.hash('userpassword123', 10);
  const adminPassword = await bcrypt.hash('adminpassword123', 10);

  const demoUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@pulse.com',
      passwordHash: userPassword,
      role: 'USER',
    },
  });

  const demoAdmin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@pulse.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('👤 Demo users registered.');

  // 3. Seed Clinical Specialties
  const cardio = await prisma.specialty.create({
    data: { name: 'Cardiology', description: 'Expert heart valves and cardiac diagnostics.', category: 'HEART' },
  });

  const endo = await prisma.specialty.create({
    data: { name: 'Endocrinology', description: 'Thyroid panel adjustments, hormones and diabetes.', category: 'METABOLIC' },
  });

  const hemato = await prisma.specialty.create({
    data: { name: 'Hematology', description: 'Blood indices, anemia, cell structures.', category: 'BLOOD' },
  });

  const neuro = await prisma.specialty.create({
    data: { name: 'Neurology', description: 'Neurological assessments and central nervous systems.', category: 'BRAIN' },
  });

  const peds = await prisma.specialty.create({
    data: { name: 'Pediatrics', description: 'Infant healthcare, immunization, and growth metrics.', category: 'CHILDREN' },
  });

  const genMed = await prisma.specialty.create({
    data: { name: 'General Medicine', description: 'Primary health consultations and checkups.', category: 'GENERAL' },
  });

  console.log('🔬 Specialties created.');

  // 4. Seed Delhi Tertiary Care Hospitals
  const hospitals = [
    {
      name: 'Indraprastha Apollo Hospital',
      address: 'Sarita Vihar, Mathura Road, New Delhi',
      latitude: 28.5369,
      longitude: 77.2882,
      rating: 4.7,
      phone: '+91-11-26925858',
      email: 'apollo.delhi@apollo.com',
      website: 'delhi.apollohospitals.com',
      workingHours: '24 Hours Open',
      emergencyAvailable: true,
      specialtyLinks: [
        { specialtyId: cardio.id, departments: 'Clinical Cardiology, Interventional Surgery', averageCost: 95 },
        { specialtyId: endo.id, departments: 'Diabetes Control, Metabolic Lab', averageCost: 80 },
        { specialtyId: hemato.id, departments: 'Hematology Diagnostics, Bone Marrow Care', averageCost: 90 },
        { specialtyId: genMed.id, departments: 'Family Medicine, Primary Screening', averageCost: 50 },
      ],
    },
    {
      name: 'Max Super Speciality Hospital',
      address: 'Press Enclave Road, Saket, New Delhi',
      latitude: 28.5284,
      longitude: 77.2114,
      rating: 4.6,
      phone: '+91-11-26515050',
      email: 'saket@maxhealthcare.com',
      website: 'maxhealthcare.in',
      workingHours: '24 Hours Open',
      emergencyAvailable: true,
      specialtyLinks: [
        { specialtyId: cardio.id, departments: 'Cardiac Rehabilitation, Valve Care', averageCost: 110 },
        { specialtyId: endo.id, departments: 'Endocrine Glands, Hormone Therapies', averageCost: 85 },
        { specialtyId: neuro.id, departments: 'Neurological Assessment, Nerve Lab', averageCost: 100 },
        { specialtyId: genMed.id, departments: 'Preventive Care, Internal Medicine', averageCost: 60 },
      ],
    },
    {
      name: 'Fortis Escorts Heart Institute',
      address: 'Okhla Road, New Delhi',
      latitude: 28.5601,
      longitude: 77.2737,
      rating: 4.8,
      phone: '+91-11-47135000',
      email: 'contact.escorts@fortishealthcare.com',
      website: 'fortisescorts.in',
      workingHours: '08:00 AM - 10:00 PM',
      emergencyAvailable: true,
      specialtyLinks: [
        { specialtyId: cardio.id, departments: 'Advanced Heart Surgery, Electrophysiology', averageCost: 120 },
        { specialtyId: hemato.id, departments: 'Pediatric Blood Care', averageCost: 85 },
        { specialtyId: genMed.id, departments: 'Outpatient Consults', averageCost: 55 },
      ],
    },
    {
      name: 'Metro Hospitals & Heart Institute',
      address: 'Lajpat Nagar, New Delhi',
      latitude: 28.5694,
      longitude: 77.2402,
      rating: 4.3,
      phone: '+91-11-42777777',
      email: 'info@metrohospitals.com',
      website: 'metrohospitals.com',
      workingHours: '09:00 AM - 08:00 PM',
      emergencyAvailable: false,
      specialtyLinks: [
        { specialtyId: cardio.id, departments: 'General Cardiology', averageCost: 75 },
        { specialtyId: peds.id, departments: 'General Pediatrics, Child Clinic', averageCost: 65 },
        { specialtyId: genMed.id, departments: 'Family Medicine', averageCost: 40 },
      ],
    },
    {
      name: 'Delhi Clinic & Metabolic Center',
      address: 'Connaught Place, New Delhi',
      latitude: 28.6304,
      longitude: 77.2177,
      rating: 4.4,
      phone: '+91-11-23344444',
      email: 'consult@delhiclinic.com',
      website: 'delhiclinic.com',
      workingHours: '09:00 AM - 07:00 PM',
      emergencyAvailable: false,
      specialtyLinks: [
        { specialtyId: endo.id, departments: 'Thyroid Specialty, Diet Consultation', averageCost: 70 },
        { specialtyId: peds.id, departments: 'Vaccination, Growth charts', averageCost: 50 },
        { specialtyId: genMed.id, departments: 'Primary Care Doctor', averageCost: 35 },
      ],
    },
  ];

  for (const h of hospitals) {
    const created = await prisma.hospital.create({
      data: {
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        rating: h.rating,
        phone: h.phone,
        email: h.email,
        website: h.website,
        workingHours: h.workingHours,
        emergencyAvailable: h.emergencyAvailable,
      },
    });

    for (const link of h.specialtyLinks) {
      await prisma.hospitalSpecialty.create({
        data: {
          hospitalId: created.id,
          specialtyId: link.specialtyId,
          departments: link.departments,
          averageCost: link.averageCost,
        },
      });
    }
  }

  console.log('🏥 Hospitals, departments and reviews seeded.');
  console.log('🎉 Seeding process completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
