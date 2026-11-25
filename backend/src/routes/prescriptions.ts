import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { performOCR } from '../services/ocr';
import { parsePrescriptionWithGemini, enrichMedicinesWithGemini, checkDrugInteractionsWithGemini } from '../services/ai';
import { documentAiLimiter, generalLimiter } from '../middleware/rateLimiter';
import cloudinary from '../config/cloudinary';
import {
  buildSecureFileUrl,
  extractPublicId,
  destroyCloudinaryAsset,
  streamCloudinaryAsset,
  verifyFileAccessToken,
} from '../utils/fileSecurity';

const router = Router();

// Store files in memory to parallelize OCR and Cloudinary uploads
const storage = multer.memoryStorage();


const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or Image formats are supported.'));
    }
  },
});

// GET /api/prescriptions (Guarded - list user scans with pagination)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  try {
    const [list, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { userId },
        include: {
          ocrResult: true,
          prescriptionAnalysis: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prescription.count({ where: { userId } }),
    ]);

    const sanitizedList = list.map((p) => ({
      ...p,
      fileUrl: buildSecureFileUrl('prescriptions', p.id, userId),
    }));

    return res.json({
      data: sanitizedList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error retrieving prescriptions.' });
  }
});

// GET /api/prescriptions/interactions (Guarded - check cross-prescription interactions)
router.get('/interactions', authenticateToken, documentAiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const analysisRecords = await prisma.prescriptionAnalysis.findMany({
      where: { prescription: { userId } },
      select: { medicineName: true, dosage: true }
    });

    if (analysisRecords.length === 0) {
      return res.json({ interactions: "No active prescriptions found to analyze.", severity: "NONE" });
    }

    const medicinesList = analysisRecords.map(a => `${a.medicineName} (${a.dosage})`);
    
    // Deduplicate just in case
    const uniqueMedicines = Array.from(new Set(medicinesList));

    const result = await checkDrugInteractionsWithGemini(uniqueMedicines);

    // Optional: Log AI usage here
    await prisma.aIUsage.create({
      data: {
        userId,
        feature: 'DRUG_INTERACTION_CHECKER',
        tokensUsed: result.tokensUsed || 500,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json({
      interactions: result.interactions,
      severity: result.severity,
      medicinesChecked: uniqueMedicines.length
    });
  } catch (err) {
    console.error('Interaction check failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error analyzing drug interactions.' });
  }
});

// GET /api/prescriptions/:id (Guarded - retrieve single prescription)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const item = await prisma.prescription.findFirst({
      where: { id, userId },
      include: {
        ocrResult: true,
        prescriptionAnalysis: true,
      },
    });

    if (!item) {
      return res.status(404).json({ message: 'Prescription file not found.' });
    }

    return res.json({
      ...item,
      fileUrl: buildSecureFileUrl('prescriptions', item.id, userId),
    });
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error loading prescription data.' });
  }
});

// GET /api/prescriptions/:id/file (Guarded - secure streaming access)
// Supports either Authorization Bearer header OR ?token=<fileAccessToken>
router.get('/:id/file', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tokenQuery = req.query.token as string | undefined;
  let userId: string | null = null;

  if (tokenQuery) {
    const verified = verifyFileAccessToken(tokenQuery, id);
    if (!verified) {
      return res.status(403).json({ message: 'Invalid or expired file access token.' });
    }
    userId = verified.userId;
  } else {
    const authHeader = req.headers['authorization'];
    const bearer = authHeader && authHeader.split(' ')[1];
    if (!bearer) {
      return res.status(401).json({ message: 'Authentication required. Missing token.' });
    }
    try {
      const decoded: any = jwt.verify(bearer, process.env.JWT_SECRET!);
      userId = decoded.id;
    } catch {
      return res.status(403).json({ message: 'Access denied. Expired or invalid token.' });
    }
  }

  try {
    const item = await prisma.prescription.findFirst({
      where: { id, userId: userId! },
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
    });

    if (!item) {
      return res.status(404).json({ message: 'Prescription document not found.' });
    }

    const publicId = item.publicId || extractPublicId(item.fileUrl);
    if (!publicId) {
      return res.status(404).json({ message: 'Storage asset not associated with this prescription.' });
    }

    streamCloudinaryAsset(
      publicId,
      item.deliveryType || (item.publicId ? 'authenticated' : 'upload'),
      item.resourceType || 'image',
      res,
      `prescription-${id}.jpg`
    );
  } catch (err) {
    console.error('Error fetching prescription file:', err);
    return res.status(500).json({ message: 'Failed to retrieve prescription file.' });
  }
});

// POST /api/prescriptions/upload (Guarded - upload file & run OCR)
router.post('/upload', authenticateToken, documentAiLimiter, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a prescription image/PDF file.' });
  }

  try {
    const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    let ocr: any;
    let uploadResult: any;

    try {
      // Run OCR and Cloudinary upload in parallel with authenticated access
      const ocrPromise = performOCR(tempFilePath);
      const cloudinaryPromise = new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'pulse_prescriptions',
            type: 'authenticated', // Secure, authenticated storage
            resource_type: 'image',
            format: 'jpg',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      [ocr, uploadResult] = await Promise.all([ocrPromise, cloudinaryPromise]);

      try {
        // Save record to database
        const prescription = await prisma.prescription.create({
          data: {
            userId,
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type || 'image',
            deliveryType: 'authenticated',
            status: 'OCR_COMPLETED',
            ocrResult: {
              create: {
                rawText: ocr.text,
                confidence: ocr.confidence,
              },
            },
          },
          include: {
            ocrResult: true,
            prescriptionAnalysis: true,
          },
        });

        // Logging AI usage diagnostics
        await prisma.aIUsage.create({
          data: {
            userId,
            feature: 'PRESCRIPTION_OCR',
            tokensUsed: ocr.tokensUsed || 150,
            modelName: ocr.modelName || 'Tesseract.js OCR'
          }
        });

        return res.status(201).json({
          ...prescription,
          fileUrl: buildSecureFileUrl('prescriptions', prescription.id, userId),
        });
      } catch (dbErr) {
        // Cleanup Cloudinary asset if DB operation fails to avoid orphaned files
        console.error('DB insert failed after Cloudinary upload; cleaning up asset:', dbErr);
        if (uploadResult?.public_id) {
          try {
            await destroyCloudinaryAsset(uploadResult.public_id, 'authenticated', uploadResult.resource_type || 'image');
          } catch (cleanupErr) {
            console.error('Failed to cleanup orphaned prescription asset:', cleanupErr);
          }
        }
        throw dbErr;
      }
    } finally {
      // Always clean up temp file, even if OCR or Cloudinary upload fails
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Upload & OCR failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error processing Tesseract OCR extraction.' });
  }
});

// POST /api/prescriptions/:id/verify (Guarded - submit verification details to Gemini AI)
router.post('/:id/verify', authenticateToken, documentAiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { verifiedData } = req.body; // Can contain corrected manual fields or updated raw text

  try {
    const pres = await prisma.prescription.findFirst({
      where: { id, userId },
      include: { ocrResult: true }
    });

    if (!pres) {
      return res.status(404).json({ message: 'Prescription record not found.' });
    }

    const textToAnalyze = String(verifiedData?.rawText || pres.ocrResult?.rawText || '').substring(0, 15000);

    let medicinesData: any[] = [];
    let totalTokensUsed = 0;

    // Check if the user manually added/verified medicines in verifiedData
    if (verifiedData?.medicines && Array.isArray(verifiedData.medicines) && verifiedData.medicines.length > 0 && verifiedData.medicines.some((m: any) => m.name && m.name.trim() !== '')) {
      console.log(`Enriching user-verified medicine fields for prescription ${id}`);
      const validMedicines = verifiedData.medicines.filter((m: any) => m.name && m.name.trim() !== '');
      const enrichResult = await enrichMedicinesWithGemini(validMedicines);
      totalTokensUsed = enrichResult.tokensUsed;
      
      medicinesData = enrichResult.medicines.map((m: any) => ({
        prescriptionId: id,
        medicineName: m.name,
        chemicalCompound: m.chemicalCompound || null,
        drugClass: m.drugClass || null,
        dosage: m.dosage || '',
        instructions: m.instructions || '',
        simplifiedExplanation: m.simplifiedExplanation || `${m.name} is a medication used as instructed.`,
        sideEffects: m.sideEffects || 'Mild stomach upset, nausea, or dizziness.',
        drugInteractions: m.drugInteractions || 'Check compatibility with other active medications.',
      }));
    } else {
      console.log(`Running standard raw text parser for prescription ${id}`);
      const parseResult = await parsePrescriptionWithGemini(textToAnalyze);
      const analysis = parseResult.result;
      totalTokensUsed = parseResult.tokensUsed;
      
      const medicinesList = (analysis && Array.isArray(analysis.medicines)) ? analysis.medicines : [];
      medicinesData = medicinesList.map((m: any) => ({
        prescriptionId: id,
        medicineName: m.name,
        chemicalCompound: m.chemicalCompound || null,
        drugClass: m.drugClass || null,
        dosage: m.dosage || '',
        instructions: m.instructions || '',
        simplifiedExplanation: m.simplifiedExplanation || '',
        sideEffects: m.sideEffects || '',
        drugInteractions: m.drugInteractions || '',
      }));
    }

    // Atomic transaction: lock prescription row FOR UPDATE to serialize concurrent verifications,
    // then replace analysis records, update prescription status, and record AI usage.
    const updated = await prisma.$transaction(async (tx) => {
      const owned = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Prescription" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE;
      `;
      if (!owned || owned.length === 0) {
        const notFound: any = new Error('Prescription record not found.');
        notFound.isNotFound = true;
        throw notFound;
      }

      await tx.prescriptionAnalysis.deleteMany({
        where: { prescriptionId: id }
      });

      if (medicinesData.length > 0) {
        await tx.prescriptionAnalysis.createMany({
          data: medicinesData
        });
      }

      const updatedPres = await tx.prescription.update({
        where: { id },
        data: {
          status: 'ANALYZED',
          ocrResult: {
            update: {
              verifiedData: JSON.stringify(verifiedData),
              verifiedAt: new Date(),
            },
          },
        },
        include: {
          ocrResult: true,
          prescriptionAnalysis: true,
        },
      });

      await tx.aIUsage.create({
        data: {
          userId,
          feature: 'PRESCRIPTION_GEMINI_ANALYSIS',
          tokensUsed: totalTokensUsed || 620,
          modelName: 'Gemini 2.5 Flash'
        }
      });

      return updatedPres;
    });

    return res.json({
      ...updated,
      fileUrl: buildSecureFileUrl('prescriptions', updated.id, userId),
    });
  } catch (err: any) {
    if (err?.isNotFound) {
      return res.status(404).json({ message: 'Prescription record not found.' });
    }
    console.error('Verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error processing Gemini structured parameters.' });
  }
});

// BUG-20 FIX: DELETE /api/prescriptions/:id (Secure Cloudinary & Database deletion)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const item = await prisma.prescription.findFirst({
      where: { id, userId },
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
    });
    if (!item) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    const publicId = item.publicId || extractPublicId(item.fileUrl);
    if (publicId) {
      const cleanup = await destroyCloudinaryAsset(
        publicId,
        item.deliveryType || 'authenticated',
        item.resourceType || 'image'
      );
      if (!cleanup.success) {
        console.error(`[Prescription Delete] Cloudinary destruction failed for ${publicId}: ${cleanup.result}`);
        return res.status(502).json({
          message: 'Unable to safely delete prescription document from secure storage. Operation aborted to prevent orphaned data. Please try again.',
        });
      }
    }

    // Delete child records first (cascade not guaranteed by all DBs without explicit setup)
    await prisma.prescriptionAnalysis.deleteMany({ where: { prescriptionId: id } });
    await prisma.oCRResult.deleteMany({ where: { prescriptionId: id } });
    await prisma.prescription.delete({ where: { id } });

    return res.json({ message: 'Prescription deleted successfully.' });
  } catch (err) {
    console.error('Delete prescription failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Failed to delete prescription.' });
  }
});

export default router;
