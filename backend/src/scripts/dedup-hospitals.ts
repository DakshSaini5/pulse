import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DRY_RUN = false; // Set to false ONLY after verifying logs

// Haversine distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GENERIC_TERMS = ['clinic', 'hospital', 'health', 'center', 'centre', 'care', 'medical', 'dental', 'rc', 'nursing', 'home', 'primary', 'community'];

function isGeneric(name: string): boolean {
  const lowerName = name.toLowerCase().trim();
  const words = lowerName.split(/[\s,]+/);
  // If ALL words are generic, it's a generic name
  const allGeneric = words.every(w => GENERIC_TERMS.includes(w) || w.length <= 2);
  return allGeneric;
}

function getCoreTokens(name: string): string[] {
  const lowerName = name.toLowerCase().trim();
  return lowerName.split(/[\s,]+/).filter(w => !GENERIC_TERMS.includes(w) && w.length > 2);
}

function matchesCoreTokens(name1: string, name2: string): boolean {
  const t1 = getCoreTokens(name1);
  const t2 = getCoreTokens(name2);
  if (t1.length === 0 || t2.length === 0) return false;
  // If there's at least one significant overlapping core token, consider it a match
  return t1.some(t => t2.includes(t));
}

async function main() {
  console.log(`Starting Hospital Deduplication Engine [DRY_RUN: ${DRY_RUN}]`);
  const logPath = path.join(__dirname, '../../merged-audit.log');
  let logContent = `Deduplication Run: ${new Date().toISOString()}\n`;

  let hospitals: any[] = [];
  let skip = 0;
  const take = 10000;
  let hasMore = true;
  while(hasMore) {
    const batch = await prisma.hospital.findMany({
      select: { id: true, name: true, latitude: true, longitude: true, address: true },
      skip,
      take
    });
    if (batch.length === 0) {
      hasMore = false;
    } else {
      hospitals.push(...batch);
      skip += take;
    }
  }
  console.log(`Loaded ${hospitals.length} hospitals for processing.`);

  const toMerge = new Map<string, string>(); // sourceId -> targetId
  const processed = new Set<string>();

  for (let i = 0; i < hospitals.length; i++) {
    const primary = hospitals[i];
    if (processed.has(primary.id)) continue;

    for (let j = i + 1; j < hospitals.length; j++) {
      const candidate = hospitals[j];
      if (processed.has(candidate.id)) continue;

      const dist = getDistanceInMeters(primary.latitude, primary.longitude, candidate.latitude, candidate.longitude);
      
      // Early exit on distance to save compute
      if (dist > 300) continue;

      let shouldMerge = false;

      const isGen = isGeneric(primary.name) || isGeneric(candidate.name);

      if (isGen) {
        // Generic strict 50m threshold (require name string exact/substring match)
        if (dist <= 50 && (primary.name.toLowerCase() === candidate.name.toLowerCase() || primary.name.toLowerCase().includes(candidate.name.toLowerCase()) || candidate.name.toLowerCase().includes(primary.name.toLowerCase()))) {
          shouldMerge = true;
        }
      } else {
        // Unique names 300m threshold with core token match
        if (dist <= 300 && matchesCoreTokens(primary.name, candidate.name)) {
          shouldMerge = true;
        }
      }

      if (shouldMerge) {
        toMerge.set(candidate.id, primary.id);
        processed.add(candidate.id);
        
        // Count relations for logging
        const specialtiesCount = await prisma.hospitalSpecialty.count({ where: { hospitalId: candidate.id } });
        const savedCount = await prisma.savedHospital.count({ where: { hospitalId: candidate.id } });
        const reviewCount = await prisma.hospitalReview.count({ where: { hospitalId: candidate.id } });
        const recCount = await prisma.recommendation.count({ where: { hospitalId: candidate.id } });

        const logLine = `[DRY RUN: ${DRY_RUN}] Would merge "${candidate.name}" into "${primary.name}" (Distance: ${Math.round(dist)}m). Relinking ${specialtiesCount} specialties, ${savedCount} bookmarks, ${reviewCount} reviews.`;
        console.log(logLine);
        logContent += logLine + '\n';
      }
    }
    processed.add(primary.id);
  }

  if (!DRY_RUN) {
    console.log(`Executing ${toMerge.size} merges...`);
    for (const [sourceId, targetId] of toMerge.entries()) {
      
      // 1. Reassign HospitalSpecialty
      const specs = await prisma.hospitalSpecialty.findMany({ where: { hospitalId: sourceId } });
      for (const sp of specs) {
        try {
          await prisma.hospitalSpecialty.update({
            where: { hospitalId_specialtyId: { hospitalId: sourceId, specialtyId: sp.specialtyId } },
            data: { hospitalId: targetId }
          });
        } catch(e) {
          await prisma.hospitalSpecialty.delete({ where: { hospitalId_specialtyId: { hospitalId: sourceId, specialtyId: sp.specialtyId } } });
        }
      }

      // 2. Reassign SavedHospital (catch duplicates safely)
      const saved = await prisma.savedHospital.findMany({ where: { hospitalId: sourceId } });
      for (const s of saved) {
        try {
          await prisma.savedHospital.update({
            where: { userId_hospitalId: { userId: s.userId, hospitalId: sourceId } },
            data: { hospitalId: targetId }
          });
        } catch (e) {
          await prisma.savedHospital.delete({
            where: { userId_hospitalId: { userId: s.userId, hospitalId: sourceId } }
          });
        }
      }

      // 3. Reassign HospitalReview
      await prisma.hospitalReview.updateMany({
        where: { hospitalId: sourceId },
        data: { hospitalId: targetId }
      });

      // 4. Reassign Recommendation
      await prisma.recommendation.updateMany({
        where: { hospitalId: sourceId },
        data: { hospitalId: targetId }
      });

      // 5. Delete the duplicate hospital
      await prisma.hospital.delete({ where: { id: sourceId } });
    }
    console.log(`Successfully completed ${toMerge.size} merges.`);
  } else {
    console.log(`Dry run complete. Found ${toMerge.size} duplicate nodes to merge.`);
  }

  fs.writeFileSync(logPath, logContent, 'utf8');
  console.log(`Audit log written to: ${logPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
