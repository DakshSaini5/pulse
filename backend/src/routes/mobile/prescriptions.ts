import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { prisma } from '../../db';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { performOCR } from '../../services/ocr';
import { parsePrescriptionWithGemini, enrichMedicinesWithGemini, checkDrugInteractionsWithGemini } from '../../services/ai';
import { uploadLimiter, aiLimiter } from '../../middleware/rateLimiter';
import cloudinary from '../../config/cloudinary';

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

    return res.json({
      data: list,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error retrieving prescriptions.' });
  }
});

// GET /api/prescriptions/interactions (Guarded - check cross-prescription interactions)
router.get('/interactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('Interaction check failed:', err);
    return res.status(500).json({ message: 'Error analyzing drug interactions.' });
  }
});

// GET /api/prescriptions/:id (Guarded - retrieve single prescription)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const item = await prisma.prescription.findUnique({
      where: { id },
      include: {
        ocrResult: true,
        prescriptionAnalysis: true,
      },
    });

    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: 'Prescription file not found.' });
    }

    return res.json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading prescription data.' });
  }
});

// POST /api/prescriptions/upload (Guarded - upload file & run OCR)
router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a prescription image/PDF file.' });
  }

  try {
    const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Run OCR and Cloudinary upload in parallel
      const ocrPromise = performOCR(tempFilePath);
      const cloudinaryPromise = new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'pulse_prescriptions', format: 'jpg' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );
        stream.end(req.file!.buffer);
      });

      const [ocr, fileUrl] = await Promise.all([ocrPromise, cloudinaryPromise]);

      // Save record to database
      const prescription = await prisma.prescription.create({
        data: {
          userId,
          fileUrl,
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
          tokensUsed: 150,
          modelName: 'Tesseract.js OCR'
        }
      });

      return res.status(201).json(prescription);
    } finally {
      // Always clean up temp file, even if OCR or Cloudinary upload fails
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Upload & OCR failed:', err);
    return res.status(500).json({ message: 'Error processing Tesseract OCR extraction.' });
  }
});

// POST /api/prescriptions/:id/verify (Guarded - submit verification details to Gemini AI)
router.post('/:id/verify', authenticateToken, aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { verifiedData } = req.body; // Can contain corrected manual fields or updated raw text

  try {
    const pres = await prisma.prescription.findUnique({
      where: { id },
      include: { ocrResult: true }
    });

    if (!pres || pres.userId !== userId) {
      return res.status(404).json({ message: 'Prescription record not found.' });
    }

    const textToAnalyze = verifiedData?.rawText || pres.ocrResult?.rawText || '';

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
      
      medicinesData = analysis.medicines.map((m: any) => ({
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

    // Wipe any existing partial mock analysis records
    await prisma.prescriptionAnalysis.deleteMany({
      where: { prescriptionId: id }
    });

    await prisma.prescriptionAnalysis.createMany({
      data: medicinesData
    });

    // Update prescription metadata status
    const updated = await prisma.prescription.update({
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

    // Log admin usage track with real token count
    await prisma.aIUsage.create({
      data: {
        userId,
        feature: 'PRESCRIPTION_GEMINI_ANALYSIS',
        tokensUsed: totalTokensUsed || 620,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Verification failed:', err);
    return res.status(500).json({ message: 'Error processing Gemini structured parameters.' });
  }
});

// BUG-20 FIX: DELETE /api/prescriptions/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const item = await prisma.prescription.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Delete child records first (cascade not guaranteed by all DBs without explicit setup)
    await prisma.prescriptionAnalysis.deleteMany({ where: { prescriptionId: id } });
    await prisma.oCRResult.deleteMany({ where: { prescriptionId: id } });
    await prisma.prescription.delete({ where: { id } });

    return res.json({ message: 'Prescription deleted successfully.' });
  } catch (err) {
    console.error('Delete prescription failed:', err);
    return res.status(500).json({ message: 'Failed to delete prescription.' });
  }
});

export default router;
