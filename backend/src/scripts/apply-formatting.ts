import { PrismaClient } from '@prisma/client';
import { getLocalizedAddress } from '../utils/locationHandler';
import { formatIndianPhoneNumber } from '../utils/phoneFormatter';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting global formatting update for the database...');
  
  const batchSize = 5000;
  let skip = 0;
  let hasMore = true;
  let totalUpdated = 0;

  while (hasMore) {
    const hospitals = await prisma.hospital.findMany({
      skip,
      take: batchSize,
      select: { id: true, latitude: true, longitude: true, address: true, phone: true }
    });

    if (hospitals.length === 0) {
      hasMore = false;
      break;
    }

    let updates = [];

    for (const h of hospitals) {
      const localizedAddress = getLocalizedAddress(h.latitude, h.longitude, h.address);
      const formattedPhone = formatIndianPhoneNumber(h.phone || '', localizedAddress);

      if (localizedAddress !== h.address || formattedPhone !== h.phone) {
        updates.push(
          prisma.hospital.update({
            where: { id: h.id },
            data: { address: localizedAddress, phone: formattedPhone }
          })
        );
      }
    }

    if (updates.length > 0) {
      for (let i = 0; i < updates.length; i += 200) {
        await prisma.$transaction(updates.slice(i, i + 200));
      }
      totalUpdated += updates.length;
    }

    console.log(`Processed batch: ${skip} to ${skip + batchSize}. Updated: ${totalUpdated}`);
    skip += batchSize;
  }

  console.log(`✅ Successfully reformatted ${totalUpdated} hospitals across the nation.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
