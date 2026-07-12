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
