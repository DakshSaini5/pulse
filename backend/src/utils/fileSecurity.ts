import https from 'https';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import cloudinary from '../config/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Cannot initialize file security.');
}

export interface FileAccessTokenPayload {
  userId: string;
  fileId: string;
  purpose: 'FILE_ACCESS';
}

/**
 * Generate a cryptographically signed, short-lived file access token (5 minutes).
 * This token is bound strictly to a single specific userId and fileId.
 */
export function generateFileAccessToken(userId: string, fileId: string): string {
  return jwt.sign(
    { userId, fileId, purpose: 'FILE_ACCESS' } as FileAccessTokenPayload,
    JWT_SECRET!,
    { expiresIn: '5m' }
  );
}

/**
 * Verify a short-lived file access token.
 * Validates cryptographic signature, expiry, and ensures token matches the requested fileId.
 */
export function verifyFileAccessToken(token: string, expectedFileId: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (decoded && decoded.purpose === 'FILE_ACCESS' && decoded.fileId === expectedFileId && decoded.userId) {
      return { userId: decoded.userId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reliably extract Cloudinary public ID from a Cloudinary URL (handles version, folder, signed components).
 */
export function extractPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/(?:upload|authenticated)(?:\/s--[^/]+--)?(?:\/v\d+)?\/(.+)\.[a-zA-Z0-9]+$/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Build a safe, dynamic backend proxy fileUrl for a medical record.
 * Never exposes raw Cloudinary storage URLs or Cloudinary credentials to clients.
 */
export function buildSecureFileUrl(
  type: 'reports' | 'prescriptions',
  fileId: string,
  userId: string,
  originPrefix?: string
): string {
  const token = generateFileAccessToken(userId, fileId);
  const prefix = originPrefix ? originPrefix.replace(/\/+$/, '') : '';
  return `${prefix}/api/${type}/${fileId}/file?token=${encodeURIComponent(token)}`;
}

/**
 * Destroy a Cloudinary asset safely.
 * Tries the recorded deliveryType first; if not found, falls back to 'upload' (for pre-migration files).
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  deliveryType: string = 'authenticated',
  resourceType: string = 'image'
): Promise<{ success: boolean; result: string; notFound?: boolean }> {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      type: (deliveryType as any) || 'authenticated',
      resource_type: (resourceType as any) || 'image',
      invalidate: true,
    });

    if (res.result === 'not found' && deliveryType === 'authenticated') {
      const retryRes = await cloudinary.uploader.destroy(publicId, {
        type: 'upload',
        resource_type: (resourceType as any) || 'image',
        invalidate: true,
      });
      const isCleaned = retryRes.result === 'ok' || retryRes.result === 'not found';
      return { success: isCleaned, result: retryRes.result, notFound: retryRes.result === 'not found' };
    }

    const isCleaned = res.result === 'ok' || res.result === 'not found';
    return { success: isCleaned, result: res.result, notFound: res.result === 'not found' };
  } catch (err: any) {
    console.error(`[Cloudinary Destroy] Failed for asset ${publicId}:`, err?.message || err);
    return { success: false, result: err?.message || 'destroy_failed' };
  }
}

/**
 * Streams an authenticated Cloudinary file directly to the Express HTTP response.
 * Medical documents are streamed chunk-by-chunk in memory directly through the response.
 * Never written to local filesystem or disk directories.
 */
export function streamCloudinaryAsset(
  publicId: string,
  deliveryType: string,
  resourceType: string,
  res: Response,
  filename: string
): void {
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 min validity for internal fetch
  const downloadUrl = cloudinary.utils.private_download_url(publicId, 'jpg', {
    type: (deliveryType as any) || 'authenticated',
    resource_type: (resourceType as any) || 'image',
    expires_at: expiresAt,
  });

  https.get(downloadUrl, (fileStream) => {
    if (fileStream.statusCode !== 200) {
      console.error(`[File Stream] Cloudinary download failed with status ${fileStream.statusCode} for ${publicId}`);
      if (!res.headersSent) {
        return res.status(502).json({ message: 'Error retrieving file from secure storage.' });
      }
      return;
    }

    // Set strict anti-caching & medical security headers
    res.setHeader('Content-Type', fileStream.headers['content-type'] || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    fileStream.pipe(res);
  }).on('error', (err) => {
    console.error(`[File Stream] Stream error for asset ${publicId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming document.' });
    }
  });
}
