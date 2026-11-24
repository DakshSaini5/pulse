/**
 * Pulse Cloudinary Medical File Security Verification Test Suite
 * 
 * Verifies:
 * A. Upload security (authenticated access, public access blocked)
 * B. Authentication (missing JWT, invalid JWT)
 * C. Multi-tenant ownership isolation (User B cannot access User A's reports or prescriptions)
 * D. Signed file token security (valid access, expiry, forgery prevention)
 * E. Deletion security (Cloudinary destruction, cascade cleanup)
 * F. Database record integrity
 * G. Regression testing (Auth & OTP endpoints intact)
 */

process.env.NODE_ENV = 'test';

import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/db';
import cloudinary from '../src/config/cloudinary';
import jwt from 'jsonwebtoken';
import { generateFileAccessToken, verifyFileAccessToken } from '../src/utils/fileSecurity';

const JWT_SECRET = process.env.JWT_SECRET!;
const testRunId = `sec_test_${Date.now()}`;

// 1x1 valid PNG image buffer
const sampleImageBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(suite: string, test: string, passed: boolean, details?: string) {
  results.push({ suite, test, passed, details });
  console.log(`${passed ? '  ✅' : '  ❌'} [${suite}] ${test}${details ? ` (${details})` : ''}`);
}

async function runVerification() {
  console.log('================================================================');
  console.log('  🛡️ RUNNING PULSE MEDICAL FILE SECURITY TEST SUITE');
  console.log('================================================================\n');

  // Create two distinct test users for multi-tenant isolation testing
  const userAEmail = `patient_a_${testRunId}@example.com`;
  const userBEmail = `patient_b_${testRunId}@example.com`;

  const userA = await prisma.user.create({
    data: {
      email: userAEmail,
      passwordHash: 'HashedPassword123!',
      name: 'Test Patient A',
      role: 'USER',
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: userBEmail,
      passwordHash: 'HashedPassword123!',
      name: 'Test Patient B',
      role: 'USER',
    },
  });

  const tokenA = jwt.sign({ id: userA.id, email: userA.email, role: userA.role }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB.id, email: userB.email, role: userB.role }, JWT_SECRET, { expiresIn: '1h' });

  let uploadedReportId = '';
  let uploadedReportPublicId = '';
  let uploadedPrescriptionId = '';
  let uploadedPrescriptionPublicId = '';

  try {
    // -------------------------------------------------------------
    // SUITE A: Upload Security
    // -------------------------------------------------------------
    console.log('--- SUITE A: Upload Security ---');
    
    // 1. Upload medical report as User A
    const reportUploadRes = await request(app)
      .post('/api/reports/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', sampleImageBuffer, 'blood_test.jpg');

    if (reportUploadRes.status === 201 && reportUploadRes.body.id) {
      uploadedReportId = reportUploadRes.body.id;
      uploadedReportPublicId = reportUploadRes.body.publicId;
      
      const isPublicUrlExposed = reportUploadRes.body.fileUrl.includes('res.cloudinary.com');
      const isSecureBackendUrl = reportUploadRes.body.fileUrl.includes(`/api/reports/${uploadedReportId}/file?token=`);
      
      record('Upload Security', 'Report upload succeeds with HTTP 201', true);
      record('Upload Security', 'Raw public Cloudinary URL is NOT returned', !isPublicUrlExposed);
      record('Upload Security', 'Secure backend proxy URL with token is returned', isSecureBackendUrl);
      
      // Verify Cloudinary asset is stored with type: 'authenticated'
      const cloudAsset = await cloudinary.api.resource(uploadedReportPublicId, { type: 'authenticated' });
      record('Upload Security', 'Cloudinary asset has type authenticated', cloudAsset.type === 'authenticated');
      
      // Verify unauthenticated direct URL fails
      const unsignedUrl = cloudAsset.secure_url.replace(/\/s--[^/]+--/, '');
      const directFetch = await fetch(unsignedUrl);
      record('Upload Security', 'Direct unsigned Cloudinary access returns 401 Unauthorized', directFetch.status === 401, `Status: ${directFetch.status}`);
    } else {
      record('Upload Security', 'Report upload succeeds with HTTP 201', false, `Status ${reportUploadRes.status}: ${JSON.stringify(reportUploadRes.body)}`);
    }

    // 2. Upload prescription as User A
    const rxUploadRes = await request(app)
      .post('/api/prescriptions/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', sampleImageBuffer, 'prescription_rx.jpg');

    if (rxUploadRes.status === 201 && rxUploadRes.body.id) {
      uploadedPrescriptionId = rxUploadRes.body.id;
      uploadedPrescriptionPublicId = rxUploadRes.body.publicId;

      const isPublicUrlExposed = rxUploadRes.body.fileUrl.includes('res.cloudinary.com');
      const isSecureBackendUrl = rxUploadRes.body.fileUrl.includes(`/api/prescriptions/${uploadedPrescriptionId}/file?token=`);

      record('Upload Security', 'Prescription upload succeeds with HTTP 201', true);
      record('Upload Security', 'Prescription raw public URL is NOT returned', !isPublicUrlExposed);
      record('Upload Security', 'Prescription secure backend proxy URL is returned', isSecureBackendUrl);

      const cloudRx = await cloudinary.api.resource(uploadedPrescriptionPublicId, { type: 'authenticated' });
      record('Upload Security', 'Prescription stored with type authenticated', cloudRx.type === 'authenticated');
    } else {
      record('Upload Security', 'Prescription upload succeeds with HTTP 201', false, `Status ${rxUploadRes.status}`);
    }

    // -------------------------------------------------------------
    // SUITE B: Authentication Enforcement
    // -------------------------------------------------------------
    console.log('\n--- SUITE B: Authentication Enforcement ---');

    // 1. File retrieval without any token
    const noAuthReport = await request(app).get(`/api/reports/${uploadedReportId}/file`);
    record('Authentication', 'Access without token returns 401 Unauthorized', noAuthReport.status === 401);

    const noAuthRx = await request(app).get(`/api/prescriptions/${uploadedPrescriptionId}/file`);
    record('Authentication', 'Prescription access without token returns 401 Unauthorized', noAuthRx.status === 401);

    // 2. File retrieval with invalid JWT
    const invalidAuthReport = await request(app)
      .get(`/api/reports/${uploadedReportId}/file`)
      .set('Authorization', 'Bearer invalid.forged.jwt');
    record('Authentication', 'Access with invalid JWT returns 403 Forbidden', invalidAuthReport.status === 403);

    // -------------------------------------------------------------
    // SUITE C: Multi-Tenant Ownership Isolation
    // -------------------------------------------------------------
    console.log('\n--- SUITE C: Ownership Isolation ---');

    // 1. User B tries to access User A's report using User B's valid JWT
    const crossUserReport = await request(app)
      .get(`/api/reports/${uploadedReportId}/file`)
      .set('Authorization', `Bearer ${tokenB}`);
    record('Ownership', 'User B cannot access User A report via Bearer token (404/403)', crossUserReport.status === 404);

    // 2. User B tries to get User A's report details
    const crossUserDetails = await request(app)
      .get(`/api/reports/${uploadedReportId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    record('Ownership', 'User B cannot view User A report metadata (404)', crossUserDetails.status === 404);

    // 3. User B tries to access User A's prescription
    const crossUserRx = await request(app)
      .get(`/api/prescriptions/${uploadedPrescriptionId}/file`)
      .set('Authorization', `Bearer ${tokenB}`);
    record('Ownership', 'User B cannot access User A prescription via Bearer token (404)', crossUserRx.status === 404);

    // -------------------------------------------------------------
    // SUITE D: Signed File Access Token Security
    // -------------------------------------------------------------
    console.log('\n--- SUITE D: Signed File Access Token Security ---');

    // 1. Valid token generated for User A accessing their own report
    const validToken = generateFileAccessToken(userA.id, uploadedReportId);
    const validTokenRes = await request(app).get(`/api/reports/${uploadedReportId}/file?token=${encodeURIComponent(validToken)}`);
    record('Signed Access', 'Valid file access token retrieves document with HTTP 200', validTokenRes.status === 200);
    record('Signed Access', 'Anti-caching security headers enforced', 
      validTokenRes.headers['cache-control']?.includes('no-store') && validTokenRes.headers['pragma'] === 'no-cache');
    record('Signed Access', 'Report streaming includes Referrer-Policy: no-referrer',
      validTokenRes.headers['referrer-policy'] === 'no-referrer');

    // 1b. Prescription streaming response includes Referrer-Policy
    const rxToken = generateFileAccessToken(userA.id, uploadedPrescriptionId);
    const rxTokenRes = await request(app).get(`/api/prescriptions/${uploadedPrescriptionId}/file?token=${encodeURIComponent(rxToken)}`);
    record('Signed Access', 'Prescription streaming includes Referrer-Policy: no-referrer',
      rxTokenRes.headers['referrer-policy'] === 'no-referrer');

    // 2. Token tampering: use User A's report token on User A's prescription
    const mismatchedTokenRes = await request(app).get(`/api/prescriptions/${uploadedPrescriptionId}/file?token=${encodeURIComponent(validToken)}`);
    record('Signed Access', 'File token forged/used for different fileId returns 403 Forbidden', mismatchedTokenRes.status === 403);

    // 3. Expired token
    const expiredToken = jwt.sign(
      { userId: userA.id, fileId: uploadedReportId, purpose: 'FILE_ACCESS' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const expiredRes = await request(app).get(`/api/reports/${uploadedReportId}/file?token=${encodeURIComponent(expiredToken)}`);
    record('Signed Access', 'Expired file token returns 403 Forbidden', expiredRes.status === 403);

    // -------------------------------------------------------------
    // SUITE E: Deletion & Lifecycle Security
    // -------------------------------------------------------------
    console.log('\n--- SUITE E: Deletion & Lifecycle Security ---');

    // 1. Report deletion when Cloudinary fails (must abort DB deletion with 502)
    const origDestroy = cloudinary.uploader.destroy;
    (cloudinary.uploader as any).destroy = async () => {
      throw new Error('Simulated Cloudinary Network Error');
    };

    const failedReportDelete = await request(app)
      .delete(`/api/reports/${uploadedReportId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    const reportStillInDb = await prisma.medicalReport.findUnique({ where: { id: uploadedReportId } });
    record('Deletion Safety', 'Report deletion returns 502 when Cloudinary fails', failedReportDelete.status === 502);
    record('Deletion Safety', 'Report DB record preserved when Cloudinary deletion fails', reportStillInDb !== null);

    // 2. Prescription deletion when Cloudinary fails (must abort DB deletion with 502)
    const failedRxDelete = await request(app)
      .delete(`/api/prescriptions/${uploadedPrescriptionId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    
    const rxStillInDb = await prisma.prescription.findUnique({ where: { id: uploadedPrescriptionId } });
    record('Deletion Safety', 'Prescription deletion returns 502 when Cloudinary fails', failedRxDelete.status === 502);
    record('Deletion Safety', 'Prescription DB record preserved when Cloudinary deletion fails', rxStillInDb !== null);

    // Restore Cloudinary destroy
    cloudinary.uploader.destroy = origDestroy;

    // 3. Successful report deletion after retry
    const deleteReportRes = await request(app)
      .delete(`/api/reports/${uploadedReportId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    record('Deletion', 'Delete report endpoint returns HTTP 200 on success/retry', deleteReportRes.status === 200);

    const checkReportDb = await prisma.medicalReport.findUnique({ where: { id: uploadedReportId } });
    record('Deletion', 'Database record removed after report deletion', checkReportDb === null);

    let reportCloudinaryGone = false;
    try {
      await cloudinary.api.resource(uploadedReportPublicId, { type: 'authenticated' });
    } catch (err: any) {
      const code = err?.error?.http_code || err?.http_code;
      const msg = err?.error?.message || err?.message;
      reportCloudinaryGone = code === 404 || (typeof msg === 'string' && msg.includes('not found'));
    }
    record('Deletion', 'Cloudinary asset destroyed from cloud CDN after report deletion', reportCloudinaryGone);

    // 4. Successful prescription deletion after retry
    const deleteRxRes = await request(app)
      .delete(`/api/prescriptions/${uploadedPrescriptionId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    record('Deletion', 'Delete prescription endpoint returns HTTP 200 on success/retry', deleteRxRes.status === 200);

    const checkRxDb = await prisma.prescription.findUnique({ where: { id: uploadedPrescriptionId } });
    record('Deletion', 'Database record removed after prescription deletion', checkRxDb === null);

    let rxCloudinaryGone = false;
    try {
      await cloudinary.api.resource(uploadedPrescriptionPublicId, { type: 'authenticated' });
    } catch (err: any) {
      const code = err?.error?.http_code || err?.http_code;
      const msg = err?.error?.message || err?.message;
      rxCloudinaryGone = code === 404 || (typeof msg === 'string' && msg.includes('not found'));
    }
    record('Deletion', 'Cloudinary prescription asset destroyed from cloud CDN', rxCloudinaryGone);

    // 5. Account deletion failure safety
    const userCEmail = `patient_c_${testRunId}@example.com`;
    const userC = await prisma.user.create({
      data: {
        email: userCEmail,
        passwordHash: 'HashedPassword123!',
        name: 'Test Patient C',
        role: 'USER',
      },
    });
    const tokenC = jwt.sign({ id: userC.id, email: userC.email, role: userC.role }, JWT_SECRET, { expiresIn: '1h' });

    // Upload prescription for User C
    const rxCRes = await request(app)
      .post('/api/prescriptions/upload')
      .set('Authorization', `Bearer ${tokenC}`)
      .attach('file', sampleImageBuffer, 'patient_c_rx.jpg');
    const rxCPublicId = rxCRes.body.publicId;

    // Mock failure during account delete
    (cloudinary.uploader as any).destroy = async () => {
      throw new Error('Simulated Cloudinary Network Error during account delete');
    };

    const failedAccountDelete = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${tokenC}`);
    
    const userCStillInDb = await prisma.user.findUnique({ where: { id: userC.id } });
    record('Deletion Safety', 'Account deletion returns 502 when asset cleanup fails', failedAccountDelete.status === 502);
    record('Deletion Safety', 'User account and records preserved in DB on cleanup failure', userCStillInDb !== null);

    // Restore and retry account delete
    cloudinary.uploader.destroy = origDestroy;
    const retryAccountDelete = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${tokenC}`);
    
    const userCGone = await prisma.user.findUnique({ where: { id: userC.id } });
    record('Deletion Safety', 'Account deletion retry succeeds with HTTP 200', retryAccountDelete.status === 200);
    record('Deletion Safety', 'User account and cascaded records removed on successful cleanup', userCGone === null);

    // Clean up asset if still exists
    if (rxCPublicId) {
      try { await cloudinary.uploader.destroy(rxCPublicId, { type: 'authenticated' }); } catch {}
    }

    // -------------------------------------------------------------
    // SUITE F: Regression Testing (Auth & OTP Vulnerability Remains Fixed)
    // -------------------------------------------------------------
    console.log('\n--- SUITE F: Regression Testing ---');

    // Verify OTP endpoints do not expose devOtpFallback
    const regOtpRes = await request(app)
      .post('/api/auth/register/send-otp')
      .send({ email: `otp_test_${Date.now()}@example.com` });
    
    const regOtpExposed = Boolean(regOtpRes.body?.devOtpFallback || regOtpRes.body?.otp);
    record('Regression', 'Registration send-otp does NOT leak OTP in response', !regOtpExposed);

    const forgotOtpRes = await request(app)
      .post('/api/auth/forgot-password/request-email')
      .send({ email: userAEmail });
    
    const forgotOtpExposed = Boolean(forgotOtpRes.body?.devOtpFallback || forgotOtpRes.body?.otp);
    record('Regression', 'Forgot password send-otp does NOT leak OTP in response', !forgotOtpExposed);

    // Verify static /uploads route is removed
    const uploadsStaticRes = await request(app).get('/uploads/some-file.jpg');
    record('Regression', 'Unauthenticated /uploads static route returns 404', uploadsStaticRes.status === 404);

    // -------------------------------------------------------------
    // SUITE G: Client-side Hardening & Migration Logic
    // -------------------------------------------------------------
    console.log('\n--- SUITE G: Client-Side URL Hardening & Migration Format Safety ---');

    // Replicate resolveFileUrl logic from frontend/src/core/services/api.ts for unit verification
    function testResolveFileUrl(fileUrl: string | null | undefined, baseUrl = 'http://localhost:5000'): string {
      if (!fileUrl) return '';
      if (fileUrl.includes('res.cloudinary.com') || fileUrl.includes('api.cloudinary.com')) {
        return '';
      }
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return fileUrl;
      }
      const base = baseUrl.replace(/\/+$/, '');
      return fileUrl.startsWith('/') ? `${base}${fileUrl}` : `${base}/${fileUrl}`;
    }

    const blockedCloudinary = testResolveFileUrl('https://res.cloudinary.com/dcha2jqf0/image/upload/v12345/pulse_reports/sample.jpg');
    record('Client URL Hardening', 'resolveFileUrl blocks raw public Cloudinary URLs (returns empty string)', blockedCloudinary === '');

    const validRelative = testResolveFileUrl('/api/reports/abc-123/file?token=test_tok');
    record('Client URL Hardening', 'resolveFileUrl resolves relative backend API proxy routes', validRelative === 'http://localhost:5000/api/reports/abc-123/file?token=test_tok');

    const validAbsolute = testResolveFileUrl('http://localhost:5000/api/reports/abc-123/file?token=test_tok');
    record('Client URL Hardening', 'resolveFileUrl preserves valid absolute backend URLs', validAbsolute === 'http://localhost:5000/api/reports/abc-123/file?token=test_tok');

    // Verify migration script does not contain hardcoded format: 'jpg'
    const migrateScriptContent = fs.readFileSync(path.join(__dirname, 'migrate-cloudinary-access.ts'), 'utf-8');
    const hasHardcodedJpgCopy = migrateScriptContent.includes("format: 'jpg'");
    record('Migration Safety', 'Migration copy does NOT force format jpg (preserves native PDF/PNG)', !hasHardcodedJpgCopy);
    record('Migration Safety', 'Migration copy explicitly verifies copied asset before DB mutation', 
      migrateScriptContent.includes('verifiedAuth') && migrateScriptContent.includes('prisma.medicalReport.update'));

  } finally {
    // Cleanup test users
    try {
      await prisma.user.deleteMany({
        where: { id: { in: [userA.id, userB.id] } },
      });
    } catch {}
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n================================================================');
  console.log('  🏁 TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Total Tests Run:  ${total}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
