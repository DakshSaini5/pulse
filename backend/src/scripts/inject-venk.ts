import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.create({
    data: {
      name: "Venkateshwar Hospital",
      address: "Delhi Area",
      latitude: 28.5866,
      longitude: 77.0345,
      phone: "011-48555555",
      emergencyAvailable: true,
      workingHours: "Open 24 Hours",
      rating: 4.8,
      recommendationScore: 98
    }
  });
  
  console.log("Successfully injected Venkateshwar Hospital into Delhi Area.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
