import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sparsh = await prisma.hospital.findMany({
    where: { name: { contains: 'Sparsh', mode: 'insensitive' } }
  });
  console.log(`Found ${sparsh.length} hospitals matching 'Sparsh':`);
  sparsh.forEach(h => console.log(`- ${h.name} (${h.address})`));

  const prakriya = await prisma.hospital.findMany({
    where: { name: { contains: 'Prakriya', mode: 'insensitive' } }
  });
  console.log(`Found ${prakriya.length} hospitals matching 'Prakriya':`);
  prakriya.forEach(h => console.log(`- ${h.name} (${h.address})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
