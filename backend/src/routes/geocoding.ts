import { Router, Response, Request } from 'express';
import https from 'https';
import { authenticateToken } from '../middleware/auth';
import { geocodingLimiter } from '../middleware/rateLimiter';

const router = Router();

const MAX_GEOCODE_QUERY_LENGTH = 200;
const MAX_PROVIDER_RESPONSE_BYTES = 64 * 1024; // 64 KB
const PROVIDER_TIMEOUT_MS = 5000;

function getGeocodingUserAgent(): string {
  return process.env.GEOCODING_USER_AGENT?.trim() || 'PulseHealthcareApp/1.0';
}

function parseFiniteCoordinate(raw: unknown, min: number, max: number): number | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const str = String(raw).trim();
  if (!str || !/^-?\d+(\.\d+)?$/.test(str)) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < min || num > max) return null;
  return num;
}

function hasUrlInjection(value: string): boolean {
  return /https?:\/\/|\/\/|[\r\n\0]/i.test(value);
}

router.get('/geocode', authenticateToken, geocodingLimiter, async (req: Request, res: Response) => {
  const { street, city, state, pincode, q } = req.query;

  let queryString = '';

  if (q !== undefined) {
    if (typeof q !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter.' });
    }
    queryString = q.trim();
  } else {
    const rawParts = [street, city, state, pincode];
    if (rawParts.some((p) => p !== undefined && typeof p !== 'string')) {
      return res.status(400).json({ message: 'Invalid address query parameters.' });
    }
    const parts = [
      ...(rawParts as Array<string | undefined>),
      'India',
    ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim());

    queryString = parts.join(', ');
  }

  if (!queryString || queryString.length > MAX_GEOCODE_QUERY_LENGTH || hasUrlInjection(queryString)) {
    return res.status(400).json({ message: 'Valid address query parameters (max 200 characters) are required.' });
  }

  try {
    const targetUrl = new URL('/search', 'https://nominatim.openstreetmap.org');
    targetUrl.searchParams.set('format', 'json');
    targetUrl.searchParams.set('limit', '1');
    targetUrl.searchParams.set('addressdetails', '1');
    targetUrl.searchParams.set('q', queryString);

    const options = {
      hostname: targetUrl.hostname,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: {
        'User-Agent': getGeocodingUserAgent(),
      },
      timeout: PROVIDER_TIMEOUT_MS,
    };

    const apiRequest = https.get(options, (apiRes) => {
      if (apiRes.statusCode && apiRes.statusCode >= 400) {
        apiRes.resume();
        if (!res.headersSent) {
          res.status(502).json({ message: 'Geocoding service returned an error.' });
        }
        return;
      }

      let totalBytes = 0;
      const chunks: Buffer[] = [];

      apiRes.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_PROVIDER_RESPONSE_BYTES) {
          apiRes.destroy();
          if (!res.headersSent) {
            res.status(502).json({ message: 'Geocoding service response exceeded size limit.' });
          }
          return;
        }
        chunks.push(chunk);
      });

      apiRes.on('end', () => {
        if (res.headersSent) return;
        try {
          const data = Buffer.concat(chunks).toString('utf8');
          const results = JSON.parse(data);
          if (Array.isArray(results) && results.length > 0) {
            const first = results[0];
            const address = first.address || {};

            const cityName = address.city || address.town || address.suburb || address.village || address.county || '';
            const stateName = address.state || '';

            return res.json({
              latitude: parseFloat(first.lat),
              longitude: parseFloat(first.lon),
              label: first.display_name,
              city: cityName,
              state: stateName,
            });
          } else {
            return res.status(404).json({ message: 'Address could not be geocoded.' });
          }
        } catch {
          console.error('[geocoding] Error parsing Nominatim response');
          return res.status(502).json({ message: 'Invalid response from geocoding service.' });
        }
      });
    });

    apiRequest.on('error', () => {
      if (!res.headersSent) {
        console.error('[geocoding] Nominatim request failed');
        return res.status(502).json({ message: 'Failed to connect to geocoding service.' });
      }
    });

    apiRequest.on('timeout', () => {
      apiRequest.destroy();
      if (!res.headersSent) {
        return res.status(504).json({ message: 'Geocoding service request timed out.' });
      }
    });
  } catch {
    console.error('[geocoding] Unexpected error in geocoding router');
    return res.status(500).json({ message: 'Internal server error during geocoding.' });
  }
});

router.get('/reverse-geocode', geocodingLimiter, async (req: Request, res: Response) => {
  const latNum = parseFiniteCoordinate(req.query.lat, -90, 90);
  const lngNum = parseFiniteCoordinate(req.query.lng, -180, 180);

  if (latNum === null || lngNum === null) {
    return res.status(400).json({ message: 'Valid finite latitude (-90 to 90) and longitude (-180 to 180) are required.' });
  }

  try {
    const targetUrl = new URL('/data/reverse-geocode-client', 'https://api.bigdatacloud.net');
    targetUrl.searchParams.set('latitude', String(latNum));
    targetUrl.searchParams.set('longitude', String(lngNum));
    targetUrl.searchParams.set('localityLanguage', 'en');

    const options = {
      hostname: targetUrl.hostname,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: {
        'User-Agent': getGeocodingUserAgent(),
      },
      timeout: PROVIDER_TIMEOUT_MS,
    };

    const apiRequest = https.get(options, (apiRes) => {
      if (apiRes.statusCode && apiRes.statusCode >= 400) {
        apiRes.resume();
        if (!res.headersSent) {
          res.status(502).json({ message: 'Geocoding service returned an error.' });
        }
        return;
      }

      let totalBytes = 0;
      const chunks: Buffer[] = [];

      apiRes.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_PROVIDER_RESPONSE_BYTES) {
          apiRes.destroy();
          if (!res.headersSent) {
            res.status(502).json({ message: 'Geocoding service response exceeded size limit.' });
          }
          return;
        }
        chunks.push(chunk);
      });

      apiRes.on('end', () => {
        if (res.headersSent) return;
        try {
          const data = Buffer.concat(chunks).toString('utf8');
          const result = JSON.parse(data);

          const cityName = result.city || result.locality || result.principalSubdivision || 'Unknown City';
          const stateName = result.principalSubdivision || '';

          let displayLabel = cityName;
          if (stateName && stateName.toLowerCase() !== cityName.toLowerCase()) {
            displayLabel = `${cityName}, ${stateName}`;
          }

          return res.json({ city: displayLabel });
        } catch {
          console.error('[geocoding] Error parsing BigDataCloud response');
          return res.status(502).json({ message: 'Invalid response from geocoding service.' });
        }
      });
    });

    apiRequest.on('error', () => {
      if (!res.headersSent) {
        console.error('[geocoding] BigDataCloud request failed');
        return res.status(502).json({ message: 'Failed to connect to geocoding service.' });
      }
    });

    apiRequest.on('timeout', () => {
      apiRequest.destroy();
      if (!res.headersSent) {
        return res.status(504).json({ message: 'Geocoding service request timed out.' });
      }
    });
  } catch {
    console.error('[geocoding] Unexpected error in reverse geocoding');
    return res.status(500).json({ message: 'Internal server error during reverse geocoding.' });
  }
});

export default router;
