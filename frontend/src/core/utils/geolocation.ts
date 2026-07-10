export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request user's geolocation coordinates from browser.
 * Resolves with current position or rejects if permission is denied / unavailable.
 */
export const getBrowserCoordinates = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 // Fetch fresh coordinates
      }
    );
  });
};

/**
 * Resolves browser GPS coordinates.
 */
export const getInitialLocation = async (): Promise<{ latitude: number; longitude: number; method: 'gps' }> => {
  const coords = await getBrowserCoordinates();
  return { latitude: coords.latitude, longitude: coords.longitude, method: 'gps' };
};

/**
 * Resolves a human-readable city/region name from latitude and longitude.
 * Hits a free reverse geocoding API.
 */
export const getCityNameFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const VITE_API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(
      `${VITE_API_URL}/api/geocoding/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    if (!response.ok) throw new Error('Geocoding api error');
    const data = await response.json();
    return data.city || 'Current City';
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return 'Current City';
  }
};


