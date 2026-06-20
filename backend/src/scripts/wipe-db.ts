import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Wiping all hospitals from the database to start fresh...');
  const result = await prisma.hospital.deleteMany({});
  console.log(`✅ Successfully purged ${result.count} hospitals. The database is completely clean and ready for a pristine reseed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
