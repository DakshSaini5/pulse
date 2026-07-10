import { Router, Response, Request } from 'express';
import https from 'https';

const router = Router();

router.get('/geocode', async (req: Request, res: Response) => {
  const { street, city, state, pincode, q } = req.query;

  let queryString = '';

  if (q && typeof q === 'string') {
    queryString = q.trim();
  } else {
    const parts = [
      street as string,
      city as string,
      state as string,
      pincode as string,
      'India',
    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);

    queryString = parts.join(', ');
  }

  if (!queryString) {
    return res.status(400).json({ message: 'Address query parameters are required.' });
  }

  try {
    const pathQuery = `/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(queryString)}`;

    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: pathQuery,
      headers: {
        'User-Agent': 'PulseHealthcareApp/1.0 (deepa@pulseapp.com)',
      },
      timeout: 10000,
    };

    const apiRequest = https.get(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
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
        } catch (err) {
          console.error('[geocoding] Error parsing Nominatim response:', err);
          return res.status(502).json({ message: 'Invalid response from geocoding service.' });
        }
      });
    });

    apiRequest.on('error', (err) => {
      console.error('[geocoding] Nominatim request error:', err);
      return res.status(502).json({ message: 'Failed to connect to geocoding service.' });
    });

    apiRequest.on('timeout', () => {
      apiRequest.destroy();
      return res.status(504).json({ message: 'Geocoding service request timed out.' });
    });
  } catch (err) {
    console.error('[geocoding] Unexpected error in geocoding router:', err);
    return res.status(500).json({ message: 'Internal server error during geocoding.' });
  }
});

router.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }

  try {
    const pathQuery = `/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;

    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: pathQuery,
      headers: {
        'User-Agent': 'PulseHealthcareApp/1.0 (deepa@pulseapp.com)',
      },
      timeout: 10000,
    };

    const apiRequest = https.get(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          const address = result.address || {};
          
          // Try to get city, town, village, or state district
          const cityName = address.city || address.town || address.village || address.suburb || address.county || address.state_district || 'Unknown City';
          const stateName = address.state || '';

          let displayLabel = cityName;
          if (stateName && stateName.toLowerCase() !== cityName.toLowerCase()) {
            displayLabel = `${cityName}, ${stateName}`;
          }

          return res.json({ city: displayLabel });
        } catch (err) {
          console.error('[geocoding] Error parsing Nominatim response:', err);
          return res.status(502).json({ message: 'Invalid response from geocoding service.' });
        }
      });
    });

    apiRequest.on('error', (err) => {
      console.error('[geocoding] Nominatim request error:', err);
      return res.status(502).json({ message: 'Failed to connect to geocoding service.' });
    });

    apiRequest.on('timeout', () => {
      apiRequest.destroy();
      return res.status(504).json({ message: 'Geocoding service request timed out.' });
    });
  } catch (err) {
    console.error('[geocoding] Unexpected error in reverse geocoding:', err);
    return res.status(500).json({ message: 'Internal server error during reverse geocoding.' });
  }
});

export default router;
