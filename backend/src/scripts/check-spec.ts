import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const venk = await prisma.hospital.findMany({
    where: { name: { contains: 'Venkateshwar', mode: 'insensitive' } },
    include: {
      specialties: {
        include: { specialty: true }
      }
    }
  });

  const sparsh = await prisma.hospital.findMany({
    where: { name: { contains: 'Sparsh', mode: 'insensitive' }, address: { contains: 'Bangalore', mode: 'insensitive' } },
    include: {
      specialties: {
        include: { specialty: true }
      }
    }
  });

  console.log("Venkateshwar Count:", venk.length);
  venk.forEach(v => {
    console.log(`- ${v.name} (${v.id}) has ${v.specialties.length} specialties.`);
    if (v.specialties.length > 0) console.log(v.specialties.map(s => s.specialty.name).join(", "));
  });

  console.log("Sparsh Count (Bangalore):", sparsh.length);
  sparsh.forEach(v => {
    console.log(`- ${v.name} (${v.id}) has ${v.specialties.length} specialties.`);
    if (v.specialties.length > 0) console.log(v.specialties.map(s => s.specialty.name).join(", "));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
