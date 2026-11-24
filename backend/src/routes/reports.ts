import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { performOCR } from '../services/ocr';
import { parseMedicalReportWithGemini, assessHealthRiskWithGemini } from '../services/ai';
import { documentAiLimiter, riskScoreLimiter } from '../middleware/rateLimiter';
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

// GET /api/reports (Guarded - list reports with pagination)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  try {
    const [list, total] = await Promise.all([
      prisma.medicalReport.findMany({
        where: { userId },
        include: {
          ocrResult: true,
          values: true,
          summary: true,
          specialists: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalReport.count({ where: { userId } }),
    ]);

    const sanitizedList = list.map((r) => ({
      ...r,
      fileUrl: buildSecureFileUrl('reports', r.id, userId),
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
    return res.status(500).json({ message: 'Error loading medical reports.' });
  }
});

// GET /api/reports/risk-assessment (Guarded - AI Health Risk Assessment)
router.get('/risk-assessment', authenticateToken, riskScoreLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const reportValues = await prisma.medicalReportValue.findMany({
      where: { medicalReport: { userId } },
      select: { key: true, value: true, unit: true, referenceRange: true, isAbnormal: true, category: true },
      orderBy: { medicalReport: { reportDate: 'desc' } },
      take: 50
    });

    if (reportValues.length === 0) {
      return res.json({ score: 100, summary: "No lab reports available to assess risk." });
    }

    const result = await assessHealthRiskWithGemini(reportValues);

    // Optional: Log AI usage here
    await prisma.aIUsage.create({
      data: {
        userId,
        feature: 'HEALTH_RISK_ASSESSMENT',
        tokensUsed: result.tokensUsed || 500,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json({
      score: result.score,
      summary: result.summary,
      biomarkersAnalyzed: reportValues.length
    });
  } catch (err) {
    console.error('Health risk assessment failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error assessing health risk.' });
  }
});

// GET /api/reports/:id (Guarded - single report details)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const report = await prisma.medicalReport.findFirst({
      where: { id, userId },
      include: {
        ocrResult: true,
        values: true,
        summary: true,
        specialists: true,
      },
    });

    if (!report) {
      return res.status(404).json({ message: 'Medical report file not found.' });
    }

    return res.json({
      ...report,
      fileUrl: buildSecureFileUrl('reports', report.id, userId),
    });
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error loading report metrics.' });
  }
});

// GET /api/reports/:id/file (Guarded - secure streaming access)
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
    const report = await prisma.medicalReport.findFirst({
      where: { id, userId: userId! },
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
    });

    if (!report) {
      return res.status(404).json({ message: 'Medical report document not found.' });
    }

    const publicId = report.publicId || extractPublicId(report.fileUrl);
    if (!publicId) {
      return res.status(404).json({ message: 'Storage asset not associated with this report.' });
    }

    streamCloudinaryAsset(
      publicId,
      report.deliveryType || (report.publicId ? 'authenticated' : 'upload'),
      report.resourceType || 'image',
      res,
      `report-${id}.jpg`
    );
  } catch (err) {
    console.error('Error fetching medical report file:', err);
    return res.status(500).json({ message: 'Failed to retrieve report file.' });
  }
});

// POST /api/reports/upload (Guarded - upload file & run OCR)
router.post('/upload', authenticateToken, documentAiLimiter, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a report image/PDF file.' });
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
            folder: 'pulse_reports',
            type: 'authenticated', // Secure, authenticated storage - no public direct delivery
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
    } finally {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }

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
    } else if (text.includes('ultrasound') || text.includes('x-ray') || text.includes('mri') || text.includes('ct scan') || text.includes('radiology') || text.includes('scan') || text.includes('impression')) {
      detectedType = 'IMAGING';
    }

    try {
      const report = await prisma.medicalReport.create({
        data: {
          userId,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          resourceType: uploadResult.resource_type || 'image',
          deliveryType: 'authenticated',
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

      return res.status(201).json({
        ...report,
        fileUrl: buildSecureFileUrl('reports', report.id, userId),
      });
    } catch (dbErr) {
      // Cleanup Cloudinary asset if DB operation fails to avoid orphaned files
      console.error('DB insert failed after Cloudinary upload; cleaning up asset:', dbErr);
      if (uploadResult?.public_id) {
        try {
          await destroyCloudinaryAsset(uploadResult.public_id, 'authenticated', uploadResult.resource_type || 'image');
        } catch (cleanupErr) {
          console.error('Failed to cleanup orphaned asset after DB failure:', cleanupErr);
        }
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('Report upload failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error parsing document character sets.' });
  }
});

// POST /api/reports/:id/verify (Guarded - submit verified values to Gemini AI)
router.post('/:id/verify', authenticateToken, documentAiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { verifiedData } = req.body;

  try {
    const report = await prisma.medicalReport.findFirst({
      where: { id, userId },
      include: { ocrResult: true }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report record not found.' });
    }

    const textToAnalyze = verifiedData?.rawText || report.ocrResult?.rawText || '';
    const activeType = verifiedData?.reportType || report.reportType;

    // Run Gemini analysis (simulates results gracefully if no key is stored)
    const parseResult = await parseMedicalReportWithGemini(textToAnalyze, activeType);
    const analysis = parseResult.result;
    const totalTokensUsed = parseResult.tokensUsed;

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
      value: v.value !== undefined && v.value !== null && v.value !== "" ? parseFloat(v.value) : 0,
      unit: v.unit || "N/A",
      referenceRange: v.referenceRange || "N/A",
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

      // If it's a text-based finding with no numeric value, skip adding to numeric trends
      if (v.value === undefined || v.value === null || v.value === "") return null;

      return prisma.healthTrend.create({
        data: {
          userId,
          markerName,
          value: parseFloat(v.value) || 0,
          unit: v.unit || '',
          recordedAt: new Date()
        }
      });
    }).filter((v: any) => v !== null);

    await Promise.all(trendPromises);

    // 5. Save generated habits to HealthInsights
    if (analysis.healthHabits && Array.isArray(analysis.healthHabits)) {
      const insightsData = analysis.healthHabits.map((habit: string) => ({
        userId,
        title: 'Daily Health Habit',
        description: habit,
        category: 'HABIT',
        severity: 'INFO',
      }));
      if (insightsData.length > 0) {
        await prisma.healthInsight.createMany({
          data: insightsData
        });
      }
    }

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
        tokensUsed: totalTokensUsed || 840,
        modelName: 'Gemini 2.5 Flash'
      }
    });

    return res.json({
      ...updated,
      fileUrl: buildSecureFileUrl('reports', updated.id, userId),
    });
  } catch (err) {
    console.error('Verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Error processing Gemini structured report.' });
  }
});

// BUG-20 FIX: DELETE /api/reports/:id (Secure Cloudinary & Database deletion)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const report = await prisma.medicalReport.findFirst({
      where: { id, userId },
      select: { id: true, fileUrl: true, publicId: true, deliveryType: true, resourceType: true },
    });
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const publicId = report.publicId || extractPublicId(report.fileUrl);
    if (publicId) {
      const cleanup = await destroyCloudinaryAsset(
        publicId,
        report.deliveryType || 'authenticated',
        report.resourceType || 'image'
      );
      if (!cleanup.success) {
        console.error(`[Report Delete] Cloudinary destruction failed for ${publicId}: ${cleanup.result}`);
        return res.status(502).json({
          message: 'Unable to safely delete report document from secure storage. Operation aborted to prevent orphaned data. Please try again.',
        });
      }
    }

    // Delete child records first
    await prisma.medicalReportValue.deleteMany({ where: { medicalReportId: id } });
    await prisma.medicalReportSummary.deleteMany({ where: { medicalReportId: id } });
    await prisma.specialistRecommendation.deleteMany({ where: { medicalReportId: id } });
    await prisma.oCRResult.deleteMany({ where: { medicalReportId: id } });
    await prisma.medicalReport.delete({ where: { id } });

    return res.json({ message: 'Medical report deleted successfully.' });
  } catch (err) {
    console.error('Delete report failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(500).json({ message: 'Failed to delete report.' });
  }
});

export default router;
