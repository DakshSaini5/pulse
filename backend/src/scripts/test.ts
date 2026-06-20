import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospitals = await prisma.hospital.findMany({
    where: { name: { contains: 'Venkateshwar', mode: 'insensitive' } }
  });
  console.log(`Found ${hospitals.length} hospitals matching 'Venkateshwar'.`);
  hospitals.forEach(h => {
    console.log(`- ${h.name} (${h.address}) at ${h.latitude}, ${h.longitude}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
