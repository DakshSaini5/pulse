/**
 * Pulse Cloudinary Medical File Migration Script
 * 
 * Safely inspects, backfills, and migrates existing patient medical documents
 * from public Cloudinary delivery to secure authenticated delivery.
 * 
 * SAFETY RULES:
 * 1. DRY-RUN BY DEFAULT: No changes made to DB or Cloudinary unless explicit execution flags are passed.
 * 2. NO DESTRUCTIVE OVERWRITES: Preserves existing database relationships and fileUrls.
 * 3. COPY-AND-VERIFY: Verified upload before any old public version is eligible for deletion.
 * 4. PII SANITIZED: Never logs patient names, health diagnoses, or credentials.
 * 
 * USAGE:
 *   # 1. Audit / Inventory (Dry-run by default):
 *   npx ts-node src/scripts/migrate-cloudinary-access.ts
 * 
 *   # 2. Backfill database public IDs only (Safe - does not touch Cloudinary assets):
 *   npx ts-node src/scripts/migrate-cloudinary-access.ts --backfill-db --confirm
 * 
 *   # 3. Copy assets to authenticated storage & update DB:
 *   npx ts-node src/scripts/migrate-cloudinary-access.ts --migrate-assets --confirm
 * 
 *   # 4. Invalidate & delete old public assets (Final step after full verification):
 *   npx ts-node src/scripts/migrate-cloudinary-access.ts --delete-old-public --confirm
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/db';
import cloudinary from '../src/config/cloudinary';
import { extractPublicId } from '../src/utils/fileSecurity';

interface MigrationStats {
  totalReports: number;
  totalPrescriptions: number;
  reportsWithPublicId: number;
  prescriptionsWithPublicId: number;
  reportsExtracted: number;
  prescriptionsExtracted: number;
  extractionFailed: number;
  cloudinaryVerifiedPublic: number;
  cloudinaryVerifiedAuth: number;
  cloudinaryMissing: number;
  backfilledDb: number;
  migratedToAuth: number;
  deletedOldPublic: number;
  errors: Array<{ model: string; id: string; error: string }>;
}

const stats: MigrationStats = {
  totalReports: 0,
  totalPrescriptions: 0,
  reportsWithPublicId: 0,
  prescriptionsWithPublicId: 0,
  reportsExtracted: 0,
  prescriptionsExtracted: 0,
  extractionFailed: 0,
  cloudinaryVerifiedPublic: 0,
  cloudinaryVerifiedAuth: 0,
  cloudinaryMissing: 0,
  backfilledDb: 0,
  migratedToAuth: 0,
  deletedOldPublic: 0,
  errors: [],
};

async function main() {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');
  const doBackfillDb = args.includes('--backfill-db');
  const doMigrateAssets = args.includes('--migrate-assets');
  const doDeleteOldPublic = args.includes('--delete-old-public');
  const isDryRun = !isConfirm || (!doBackfillDb && !doMigrateAssets && !doDeleteOldPublic);

  console.log('================================================================');
  console.log('  🔒 PULSE CLOUDINARY MEDICAL FILE MIGRATION & AUDIT TOOL');
  console.log('================================================================');
  console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (Audit & Inventory Only - NO CHANGES MADE)' : '⚡ LIVE EXECUTION'}`);
  if (isDryRun && !isConfirm) {
    console.log('Notice: Pass --confirm along with desired action flag to execute mutations.');
  }
  console.log('----------------------------------------------------------------\n');

  // 1. Fetch records
  const [reports, prescriptions] = await Promise.all([
    prisma.medicalReport.findMany({
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true, createdAt: true },
    }),
    prisma.prescription.findMany({
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true, createdAt: true },
    }),
  ]);

  stats.totalReports = reports.length;
  stats.totalPrescriptions = prescriptions.length;

  console.log(`[Inventory] Found ${reports.length} MedicalReport records and ${prescriptions.length} Prescription records in database.`);

  // 2. Analyze Medical Reports
  console.log('\n--- Analyzing Medical Reports ---');
  for (const report of reports) {
    if (report.publicId) {
      stats.reportsWithPublicId++;
    }
    const publicId = report.publicId || extractPublicId(report.fileUrl);
    if (publicId) {
      stats.reportsExtracted++;
      // Verify asset in Cloudinary
      await inspectCloudinaryAsset('MedicalReport', report.id, publicId, report.deliveryType || 'upload');
    } else {
      stats.extractionFailed++;
      stats.errors.push({ model: 'MedicalReport', id: report.id, error: 'Could not extract public ID from fileUrl' });
      console.warn(`[Report ${report.id}] ⚠️ Failed to extract publicId from fileUrl: ${report.fileUrl}`);
    }
  }

  // 3. Analyze Prescriptions
  console.log('\n--- Analyzing Prescriptions ---');
  for (const pres of prescriptions) {
    if (pres.publicId) {
      stats.prescriptionsWithPublicId++;
    }
    const publicId = pres.publicId || extractPublicId(pres.fileUrl);
    if (publicId) {
      stats.prescriptionsExtracted++;
      await inspectCloudinaryAsset('Prescription', pres.id, publicId, pres.deliveryType || 'upload');
    } else {
      stats.extractionFailed++;
      stats.errors.push({ model: 'Prescription', id: pres.id, error: 'Could not extract public ID from fileUrl' });
      console.warn(`[Prescription ${pres.id}] ⚠️ Failed to extract publicId from fileUrl: ${pres.fileUrl}`);
    }
  }

  // 4. Action: Backfill DB publicIds
  if (doBackfillDb && isConfirm) {
    console.log('\n--- Executing Database PublicId Backfill ---');
    for (const report of reports) {
      if (!report.publicId) {
        const pid = extractPublicId(report.fileUrl);
        if (pid) {
          await prisma.medicalReport.update({
            where: { id: report.id },
            data: { publicId: pid, deliveryType: 'upload', resourceType: 'image' },
          });
          stats.backfilledDb++;
        }
      }
    }
    for (const pres of prescriptions) {
      if (!pres.publicId) {
        const pid = extractPublicId(pres.fileUrl);
        if (pid) {
          await prisma.prescription.update({
            where: { id: pres.id },
            data: { publicId: pid, deliveryType: 'upload', resourceType: 'image' },
          });
          stats.backfilledDb++;
        }
      }
    }
    console.log(`[Backfill] Successfully backfilled ${stats.backfilledDb} database records with public IDs.`);
  }

  // 5. Action: Migrate Assets (Copy to Authenticated Storage)
  if (doMigrateAssets && isConfirm) {
    console.log('\n--- Executing Asset Migration (Copy to Authenticated) ---');
    for (const report of reports) {
      const pid = report.publicId || extractPublicId(report.fileUrl);
      if (pid && (report.deliveryType === 'upload' || !report.deliveryType)) {
        await copyAssetToAuthenticated('MedicalReport', report.id, pid, report.fileUrl);
      }
    }
    for (const pres of prescriptions) {
      const pid = pres.publicId || extractPublicId(pres.fileUrl);
      if (pid && (pres.deliveryType === 'upload' || !pres.deliveryType)) {
        await copyAssetToAuthenticated('Prescription', pres.id, pid, pres.fileUrl);
      }
    }
  }

  // 6. Action: Delete Old Public Assets
  if (doDeleteOldPublic && isConfirm) {
    console.log('\n--- Executing Deletion of Old Public Assets ---');
    console.log('Notice: Only assets already verified as authenticated in DB will be deleted from public storage.');
    for (const report of reports) {
      const dbRecord = await prisma.medicalReport.findUnique({ where: { id: report.id } });
      if (dbRecord?.deliveryType === 'authenticated' && dbRecord.publicId) {
        // Attempt destroy of public version
        await safelyDeleteOldPublicAsset('MedicalReport', report.id, dbRecord.publicId, dbRecord.resourceType || 'image');
      }
    }
    for (const pres of prescriptions) {
      const dbRecord = await prisma.prescription.findUnique({ where: { id: pres.id } });
      if (dbRecord?.deliveryType === 'authenticated' && dbRecord.publicId) {
        await safelyDeleteOldPublicAsset('Prescription', pres.id, dbRecord.publicId, dbRecord.resourceType || 'image');
      }
    }
  }

  // 7. Summary Report
  console.log('\n================================================================');
  console.log('  📊 MIGRATION & AUDIT SUMMARY REPORT');
  console.log('================================================================');
  console.log(`Total Medical Reports in DB:             ${stats.totalReports}`);
  console.log(`Total Prescriptions in DB:               ${stats.totalPrescriptions}`);
  console.log(`Reports already containing publicId:     ${stats.reportsWithPublicId}`);
  console.log(`Prescriptions already with publicId:     ${stats.prescriptionsWithPublicId}`);
  console.log(`Public IDs extracted successfully:       ${stats.reportsExtracted + stats.prescriptionsExtracted}`);
  console.log(`Public ID extraction failures:          ${stats.extractionFailed}`);
  console.log(`Cloudinary verified Public assets:       ${stats.cloudinaryVerifiedPublic}`);
  console.log(`Cloudinary verified Authenticated:       ${stats.cloudinaryVerifiedAuth}`);
  console.log(`Cloudinary missing / unverified:         ${stats.cloudinaryMissing}`);
  if (!isDryRun) {
    console.log(`DB records backfilled:                   ${stats.backfilledDb}`);
    console.log(`Assets migrated to Authenticated:        ${stats.migratedToAuth}`);
    console.log(`Old public assets purged:                ${stats.deletedOldPublic}`);
  }
  console.log(`Total Errors / Warnings encountered:    ${stats.errors.length}`);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

async function inspectCloudinaryAsset(model: string, id: string, publicId: string, deliveryType: string) {
  try {
    // Check if authenticated asset exists
    try {
      const authRes = await cloudinary.api.resource(publicId, { type: 'authenticated' });
      if (authRes) {
        stats.cloudinaryVerifiedAuth++;
        return;
      }
    } catch {
      // Not authenticated, check public upload
    }

    try {
      const pubRes = await cloudinary.api.resource(publicId, { type: 'upload' });
      if (pubRes) {
        stats.cloudinaryVerifiedPublic++;
        return;
      }
    } catch {
      stats.cloudinaryMissing++;
      stats.errors.push({ model, id, error: `Cloudinary asset not found: ${publicId}` });
    }
  } catch (err: any) {
    stats.cloudinaryMissing++;
    stats.errors.push({ model, id, error: err?.message || 'inspection_error' });
  }
}

async function copyAssetToAuthenticated(model: string, id: string, publicId: string, fileUrl: string) {
  try {
    // 1. Inspect source asset to determine original resource_type and format
    let sourceAsset: any = null;
    let resourceType: 'image' | 'raw' = 'image';

    try {
      sourceAsset = await cloudinary.api.resource(publicId, { type: 'upload', resource_type: 'image' });
      resourceType = 'image';
    } catch {
      try {
        sourceAsset = await cloudinary.api.resource(publicId, { type: 'upload', resource_type: 'raw' });
        resourceType = 'raw';
      } catch (inspectErr) {
        throw new Error(`Cloudinary public source asset not found for ${publicId}: ${inspectErr}`);
      }
    }

    const detectedFormat = sourceAsset?.format || undefined;

    // 2. Check if authenticated asset already exists
    let existsAsAuth = false;
    try {
      await cloudinary.api.resource(publicId, { type: 'authenticated', resource_type: resourceType });
      existsAsAuth = true;
    } catch {}

    if (!existsAsAuth) {
      // Re-upload as authenticated preserving exact original resource type and format (NEVER forcing jpg)
      const uploadOptions: any = {
        public_id: publicId,
        type: 'authenticated',
        resource_type: resourceType,
      };
      if (detectedFormat) {
        uploadOptions.format = detectedFormat;
      }

      await cloudinary.uploader.upload(fileUrl, uploadOptions);
      console.log(`[Migrate] Copied asset ${publicId} (type: ${resourceType}, format: ${detectedFormat || 'native'}) to authenticated storage`);
    }

    // 3. Strict verification of copied asset BEFORE touching database
    const verifiedAuth = await cloudinary.api.resource(publicId, {
      type: 'authenticated',
      resource_type: resourceType,
    });

    if (!verifiedAuth || verifiedAuth.bytes === 0) {
      throw new Error(`Verification of copied authenticated asset failed for ${publicId}: zero bytes or unreadable`);
    }

    // 4. Update database record only after verification succeeds
    if (model === 'MedicalReport') {
      await prisma.medicalReport.update({
        where: { id },
        data: { publicId, deliveryType: 'authenticated', resourceType },
      });
    } else {
      await prisma.prescription.update({
        where: { id },
        data: { publicId, deliveryType: 'authenticated', resourceType },
      });
    }
    stats.migratedToAuth++;
  } catch (err: any) {
    console.error(`[Migrate Error] Failed migrating ${model} ${id} (${publicId}):`, err?.message || err);
    stats.errors.push({ model, id, error: err?.message || 'migration_failed' });
  }
}

async function safelyDeleteOldPublicAsset(model: string, id: string, publicId: string, resourceType: string = 'image') {
  try {
    // 1. Verify authenticated version exists first
    const verifiedAuth = await cloudinary.api.resource(publicId, {
      type: 'authenticated',
      resource_type: resourceType as any,
    });

    if (!verifiedAuth) {
      console.warn(`[Purge Skipped] Authenticated version not verified for ${publicId}. Public version preserved.`);
      return;
    }

    // 2. Destroy the public version with CDN edge invalidation
    const delRes = await cloudinary.uploader.destroy(publicId, {
      type: 'upload',
      resource_type: resourceType as any,
      invalidate: true,
    });

    if (delRes.result === 'ok') {
      stats.deletedOldPublic++;
      console.log(`[Purge] Successfully purged public asset ${publicId}`);
    } else {
      console.warn(`[Purge Note] Cloudinary destruction reported: ${delRes.result} for ${publicId}`);
    }
  } catch (err: any) {
    console.warn(`[Purge Note] Public purge skipped for ${publicId}:`, err?.message || err);
  }
}

main().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
