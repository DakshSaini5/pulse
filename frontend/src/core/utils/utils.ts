import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getHospitalDisplayName = (name: string, address: string): string => {
  if (!name) return '';
  // If the name already has a branch differentiator, just return it
  if (name.includes('-') || name.includes('(') || name.includes(',')) {
    return name;
  }

  const chainKeywords = ['max', 'apollo', 'fortis', 'manipal', 'narayana', 'max super', 'blk-max'];
  const isChain = chainKeywords.some(keyword => name.toLowerCase().includes(keyword));
  if (!isChain) return name;

  // Extract sub-locality from address
  const parts = address.split(',').map(p => p.trim());
  let branch = '';

  // Commonly, the neighborhood is the second or third part of the address
  // e.g. "Press Enclave Road, Saket, New Delhi" -> "Saket"
  // We can look for parts that are not the state, city, or country.
  const noiseWords = ['delhi', 'new delhi', 'mumbai', 'bangalore', 'bengaluru', 'india', 'opposite', 'near', 'beside', 'road', 'rd'];
  
  for (const part of parts) {
    const lower = part.toLowerCase();
    const isNoise = noiseWords.some(w => lower === w || lower.includes('pin') || /^\d{5,6}$/.test(part));
    if (!isNoise && part.length > 2) {
      branch = part;
      break;
    }
  }

  // If no branch was extracted, fallback to the second segment if it exists
  if (!branch && parts.length > 1) {
    branch = parts[1];
  }

  return branch ? `${name} - ${branch}` : name;
};

/**
 * Dynamically extracts and formats the real locality and city from an address string.
 * Example outputs:
 * - "Nagasandra Main Road, Nagasandra, Bengaluru, Karnataka 560073" -> "Nagasandra, Bengaluru"
 * - "Press Enclave Road, Saket, New Delhi, Delhi 110017" -> "Saket, New Delhi"
 * - "Sarita Vihar, Mathura Road, New Delhi, Delhi 110076" -> "Sarita Vihar, New Delhi"
 * - "Old Airport Road, Kodihalli, Bengaluru, Karnataka 560008" -> "Kodihalli, Bengaluru"
 * - "South India Area" -> "" (suppressed)
 */
export const getHospitalLocality = (address: string): string => {
  if (!address) return '';
  const cleanAddress = address.replace(/(South|North|Central|East|West)\s+India\s+Area/gi, '').trim();
  if (!cleanAddress) return '';

  const knownCities = [
    'Bengaluru', 'Bangalore', 'New Delhi', 'Delhi', 'Mumbai',
    'Gurugram', 'Gurgaon', 'Noida', 'Greater Noida', 'Ghaziabad',
    'Faridabad', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'
  ];

  const segments = cleanAddress.split(',').map(s => s.trim()).filter(Boolean);
  if (segments.length <= 1) return segments[0] || '';

  let matchedCity = '';
  for (const seg of segments) {
    for (const c of knownCities) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(seg)) {
        matchedCity = c === 'Bangalore' ? 'Bengaluru' : (c === 'Gurgaon' ? 'Gurugram' : c);
        break;
      }
    }
    if (matchedCity) break;
  }

  let locality = '';
  for (const seg of segments) {
    const segClean = seg.replace(/\b\d{5,6}\b/g, '').trim();
    if (!segClean) continue;
    const lower = segClean.toLowerCase();
    const isCity = knownCities.some(c => lower === c.toLowerCase());
    const isStateOrCountry = ['karnataka', 'delhi', 'new delhi', 'maharashtra', 'haryana', 'uttar pradesh', 'tamil nadu', 'india'].some(s => lower === s);
    const isJustPincodeOrNumber = /^\d+$/.test(segClean);
    const isRoadOrPlot = /\b(road|rd|marg|street|lane|plot|nh-\d+|opp|near)\b/i.test(segClean);

    if (!isCity && !isStateOrCountry && !isJustPincodeOrNumber) {
      if (!isRoadOrPlot) {
        locality = segClean;
        break;
      } else if (!locality) {
        locality = segClean;
      }
    }
  }

  if (!locality && segments.length > 0) {
    locality = segments[0].replace(/\b\d{5,6}\b/g, '').trim();
  }

  if (matchedCity && locality) {
    if (locality.toLowerCase() === matchedCity.toLowerCase()) {
      return matchedCity;
    }
    if (new RegExp(`\\b${matchedCity}\\b`, 'i').test(locality)) {
      return locality;
    }
    return `${locality}, ${matchedCity}`;
  }

  return locality || segments[0] || address;
};
