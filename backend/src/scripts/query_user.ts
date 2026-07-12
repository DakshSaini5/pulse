import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'chetan24162@iiitd.ac.in' },
    include: {
      medicalReports: { include: { summary: true, values: true } },
      prescriptions: { include: { prescriptionAnalysis: true } }
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', user.id);
  console.log('Number of medical reports:', user.medicalReports.length);
  user.medicalReports.forEach((r, idx) => {
    console.log(`\nReport ${idx + 1}:`, r.reportType, r.reportDate);
    console.log('Summary:', r.summary?.healthSummary);
    console.log('Values:', r.values.map(v => `${v.key}: ${v.value} ${v.unit} (isAbnormal: ${v.isAbnormal})`));
  });

  console.log('\nNumber of prescriptions:', user.prescriptions.length);
  user.prescriptions.forEach((p, idx) => {
    console.log(`\nPrescription ${idx + 1}:`);
    console.log('Analysis:', p.prescriptionAnalysis.map(med => `${med.medicineName}: ${med.dosage}`));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
