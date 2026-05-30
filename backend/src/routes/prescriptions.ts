import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { performOCR } from '../services/ocr';
import { parsePrescriptionWithGemini, enrichMedicinesWithGemini } from '../services/ai';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const router = Router();

// Pure Cloudinary storage setup for production uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'pulse_prescriptions',
      format: 'jpg', // auto-convert to jpg for optimized OCR
      public_id: `pres-${Date.now()}`,
    };
  },
});

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

// GET /api/prescriptions (Guarded - list user scans)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const list = await prisma.prescription.findMany({
      where: { userId },
      include: {
        ocrResult: true,
        prescriptionAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error retrieving prescriptions.' });
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

// POST /api/prescriptions/upload (Guarded - upload file & run Tesseract OCR)
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a prescription image/PDF file.' });
  }

  const fileUrl = req.file.path; // Cloudinary returns the secure URL in req.file.path
  
  // Since we are doing Tesseract locally right now, we need to fetch the image from Cloudinary to OCR it.
  // Alternatively, Tesseract.js accepts a URL directly in Node!
  try {
    // Triggers Tesseract scanning asynchronously
    const ocr = await performOCR(fileUrl);

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
  } catch (err) {
    console.error('Upload & OCR failed:', err);
    return res.status(500).json({ message: 'Error processing Tesseract OCR extraction.' });
  }
});

// POST /api/prescriptions/:id/verify (Guarded - submit verification details to Gemini AI)
router.post('/:id/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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

    // Check if the user manually added/verified medicines in verifiedData
    if (verifiedData?.medicines && Array.isArray(verifiedData.medicines) && verifiedData.medicines.length > 0 && verifiedData.medicines.some((m: any) => m.name && m.name.trim() !== '')) {
      console.log(`Enriching user-verified medicine fields for prescription ${id}`);
      const validMedicines = verifiedData.medicines.filter((m: any) => m.name && m.name.trim() !== '');
      const enrichedMedicines = await enrichMedicinesWithGemini(validMedicines);
      
      medicinesData = enrichedMedicines.map((m: any) => ({
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
      const analysis = await parsePrescriptionWithGemini(textToAnalyze);
      
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

    // Log admin usage track
    await prisma.aIUsage.create({
      data: {
        userId,
        feature: 'PRESCRIPTION_GEMINI_ANALYSIS',
        tokensUsed: 620,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Verification failed:', err);
    return res.status(500).json({ message: 'Error processing Gemini structured parameters.' });
  }
});

export default router;
