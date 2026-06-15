import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Play Store Reviewer account...');
  
  const email = 'playstore-reviewer@pulse.com';
  const rawPassword = 'Reviewer123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Clean up if exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { email } });
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Play Store Reviewer',
      passwordHash,
      mobileNumber: '+15551234567',
      authProvider: 'EMAIL',
      role: 'USER',
      medicalReports: {
        create: [
          {
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            reportType: 'HBA1C',
            status: 'ANALYZED',
            summary: {
              create: {
                healthSummary: 'The patient shows elevated HbA1c levels indicating poor blood sugar control. The levels are in the diabetic range.',
                normalFindingsCount: 1,
                abnormalFindingsCount: 1,
                overallStatus: 'ATTENTION'
              }
            },
            values: {
              create: [
                {
                  key: 'HbA1c',
                  value: 7.2,
                  unit: '%',
                  referenceRange: '4.0 - 5.6',
                  isAbnormal: true,
                  description: 'Glycosylated Hemoglobin',
                  category: 'Diabetes'
                },
                {
                  key: 'Fasting Blood Glucose',
                  value: 95,
                  unit: 'mg/dL',
                  referenceRange: '70 - 100',
                  isAbnormal: false,
                  description: 'Fasting Blood Sugar',
                  category: 'Diabetes'
                }
              ]
            }
          }
        ]
      },
      prescriptions: {
        create: [
          {
            fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
            status: 'ANALYZED',
            prescriptionAnalysis: {
              create: [
                {
                  medicineName: 'Amoxicillin',
                  chemicalCompound: 'Amoxicillin trihydrate',
                  drugClass: 'Antibiotic',
                  dosage: '500mg, 3 times a day for 7 days',
                  instructions: 'Take after meals. Complete the full course.',
                  simplifiedExplanation: 'This is an antibiotic used to treat bacterial infections. Make sure to finish the entire prescription even if you feel better.',
                  sideEffects: 'Nausea, vomiting, diarrhea, rash.',
                  drugInteractions: 'May interact with birth control pills and blood thinners.'
                },
                {
                  medicineName: 'Metformin',
                  chemicalCompound: 'Metformin hydrochloride',
                  drugClass: 'Anti-diabetic',
                  dosage: '500mg, twice daily',
                  instructions: 'Take with meals to reduce stomach upset.',
                  simplifiedExplanation: 'This medicine helps control blood sugar levels in type 2 diabetes.',
                  sideEffects: 'Nausea, stomach upset, diarrhea.',
                  drugInteractions: 'Use with caution if you have kidney problems.'
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('Successfully seeded reviewer account:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${rawPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
