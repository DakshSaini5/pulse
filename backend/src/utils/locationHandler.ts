/**
 * Reverse-Coordinate Address Localization Handler
 * Maps raw GPS coordinates to proper geographical strings to standardize textual indexing.
 */
export function getLocalizedAddress(lat: number, lon: number, defaultAddress: string = ''): string {
  // Bounding boxes for major Indian metros and states
  const regions = [
    { name: 'Delhi Area', minLat: 28.40, maxLat: 28.88, minLon: 76.84, maxLon: 77.34 },
    { name: 'Mumbai Area, Maharashtra', minLat: 18.89, maxLat: 19.27, minLon: 72.77, maxLon: 73.00 },
    { name: 'Bangalore Area, Karnataka', minLat: 12.83, maxLat: 13.14, minLon: 77.46, maxLon: 77.78 },
    { name: 'Chennai Area, Tamil Nadu', minLat: 12.90, maxLat: 13.25, minLon: 80.10, maxLon: 80.35 },
    { name: 'Kolkata Area, West Bengal', minLat: 22.40, maxLat: 22.75, minLon: 88.20, maxLon: 88.50 },
    { name: 'Hyderabad Area, Telangana', minLat: 17.20, maxLat: 17.60, minLon: 78.20, maxLon: 78.60 },
    { name: 'Pune Area, Maharashtra', minLat: 18.40, maxLat: 18.70, minLon: 73.70, maxLon: 74.00 }
  ];

  for (const region of regions) {
    if (lat >= region.minLat && lat <= region.maxLat && lon >= region.minLon && lon <= region.maxLon) {
      // If we have a very specific default address (not a generic OSM placeholder), we append the region.
      // But if it's generic like "Location via OSM", we replace it entirely.
      const isGeneric = !defaultAddress || defaultAddress.toLowerCase().includes('location via osm');
      if (isGeneric) {
        return region.name;
      }
      return `${defaultAddress}, ${region.name}`;
    }
  }

  // Fallback
  return defaultAddress && !defaultAddress.toLowerCase().includes('location via osm')
    ? defaultAddress
    : 'India Area';
}
