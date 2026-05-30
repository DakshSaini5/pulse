import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { performOCR } from '../services/ocr';
import { parseMedicalReportWithGemini } from '../services/ai';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const router = Router();

// Pure Cloudinary storage setup for production uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'pulse_reports',
      format: 'jpg', // auto-convert to jpg for optimized OCR
      public_id: `rep-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

// GET /api/reports (Guarded - list reports)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const list = await prisma.medicalReport.findMany({
      where: { userId },
      include: {
        ocrResult: true,
        values: true,
        summary: true,
        specialists: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading medical reports.' });
  }
});

// GET /api/reports/:id (Guarded - single report details)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        ocrResult: true,
        values: true,
        summary: true,
        specialists: true,
      },
    });

    if (!report || report.userId !== userId) {
      return res.status(404).json({ message: 'Medical report file not found.' });
    }

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading report metrics.' });
  }
});

// POST /api/reports/upload (Guarded - upload file & run Tesseract OCR)
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a report image/PDF file.' });
  }

  const fileUrl = req.file.path; // Cloudinary secure URL

  try {
    const ocr = await performOCR(fileUrl);
    const text = ocr.text.toLowerCase();

    // Proactive report category detector
    let detectedType = 'GENERAL';
    if (text.includes('tsh') || text.includes('thyroid') || text.includes('t3') || text.includes('t4')) {
      detectedType = 'THYROID';
    } else if (text.includes('sugar') || text.includes('hba1c') || text.includes('glucose') || text.includes('glycated')) {
      detectedType = 'HBA1C';
    } else if (text.includes('lipid') || text.includes('cholesterol') || text.includes('triglyceride') || text.includes('hdl') || text.includes('ldl')) {
      detectedType = 'LIPID';
    } else if (text.includes('hemoglobin') || text.includes('cbc') || text.includes('wbc') || text.includes('platelet') || text.includes('erythrocyte')) {
      detectedType = 'CBC';
    }

    const report = await prisma.medicalReport.create({
      data: {
        userId,
        fileUrl,
        reportType: detectedType,
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
        values: true,
        summary: true,
        specialists: true,
      },
    });

    return res.status(201).json(report);
  } catch (err) {
    console.error('Report upload failed:', err);
    return res.status(500).json({ message: 'Error parsing document character sets.' });
  }
});

// POST /api/reports/:id/verify (Guarded - submit verified values to Gemini AI)
router.post('/:id/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { verifiedData } = req.body;

  try {
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: { ocrResult: true }
    });

    if (!report || report.userId !== userId) {
      return res.status(404).json({ message: 'Report record not found.' });
    }

    const textToAnalyze = verifiedData?.rawText || report.ocrResult?.rawText || '';
    const activeType = verifiedData?.reportType || report.reportType;

    // Run Gemini analysis (simulates results gracefully if no key is stored)
    const analysis = await parseMedicalReportWithGemini(textToAnalyze, activeType);

    // Clean up past database references
    await prisma.medicalReportValue.deleteMany({ where: { medicalReportId: id } });
    await prisma.medicalReportSummary.deleteMany({ where: { medicalReportId: id } });
    await prisma.specialistRecommendation.deleteMany({ where: { medicalReportId: id } });

    // 1. Insert parsed values
    const normalCount = analysis.values.filter((v: any) => !v.isAbnormal).length;
    const abnormalCount = analysis.values.filter((v: any) => v.isAbnormal).length;

    const valuesData = analysis.values.map((v: any) => ({
      medicalReportId: id,
      key: v.key,
      value: parseFloat(v.value),
      unit: v.unit,
      referenceRange: v.referenceRange,
      isAbnormal: !!v.isAbnormal,
      description: v.description || '',
      category: activeType,
    }));

    await prisma.medicalReportValue.createMany({
      data: valuesData
    });

    // 2. Insert summary analysis block
    await prisma.medicalReportSummary.create({
      data: {
        medicalReportId: id,
        healthSummary: analysis.summary,
        normalFindingsCount: normalCount,
        abnormalFindingsCount: abnormalCount,
        overallStatus: analysis.status || 'STABLE',
      },
    });

    // 3. Insert specialist routing recommendations
    const specialistsData = analysis.specialists.map((s: any) => ({
      medicalReportId: id,
      specialtyName: s.specialtyName,
      confidenceScore: parseFloat(s.confidenceScore),
      reason: s.reason,
      recommendedHospitalsJson: JSON.stringify([]),
    }));

    await prisma.specialistRecommendation.createMany({
      data: specialistsData
    });

    // 4. Save to HealthTrends timeline for tracking
    const trendPromises = analysis.values.map((v: any) => {
      // Clean up index key to support simplified tracking maps
      let markerName = v.key;
      if (v.key.toLowerCase().includes('hemoglobin') || v.key.toLowerCase() === 'hb') {
        markerName = 'Hemoglobin';
      } else if (v.key.toLowerCase().includes('hba1c') || v.key.toLowerCase() === 'a1c') {
        markerName = 'HbA1c';
      } else if (v.key.toLowerCase().includes('tsh')) {
        markerName = 'TSH';
      } else if (v.key.toLowerCase().includes('cholesterol')) {
        markerName = 'Cholesterol';
      }

      return prisma.healthTrend.create({
        data: {
          userId,
          markerName,
          value: parseFloat(v.value),
          unit: v.unit,
          recordedAt: new Date()
        }
      });
    });

    await Promise.all(trendPromises);

    // Pull updated models
    const updated = await prisma.medicalReport.update({
      where: { id },
      data: {
        status: 'ANALYZED',
        reportType: activeType,
        ocrResult: {
          update: {
            verifiedData: JSON.stringify(verifiedData),
            verifiedAt: new Date(),
          },
        },
      },
      include: {
        ocrResult: true,
        values: true,
        summary: true,
        specialists: true,
      },
    });

    await prisma.aIUsage.create({
      data: {
        userId,
        feature: 'REPORT_GEMINI_ANALYSIS',
        tokensUsed: 840,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Verification failed:', err);
    return res.status(500).json({ message: 'Error processing Gemini structured report.' });
  }
});

export default router;
