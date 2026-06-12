const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.hospital.count();
  console.log('Hospital count in Supabase:', count);
  
  if (count > 0) {
    const samples = await prisma.hospital.findMany({ take: 3, select: { name: true, address: true, latitude: true, longitude: true } });
    console.log('Sample hospitals:', JSON.stringify(samples, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
