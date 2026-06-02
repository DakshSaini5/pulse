/**
 * Formats a phone number according to the Indian dialing system.
 * Specifically prefixes 8-digit landline numbers with the city's STD code
 * based on the hospital's address.
 * 
 * Delhi -> 011
 * Bangalore / Bengaluru -> 080
 * Mumbai -> 022
 */
export function formatIndianPhoneNumber(phone: string, address: string): string {
  if (!phone) return '';
  
  // Clean spaces, hyphens, and parentheses for length checking
  const cleaned = phone.trim();
  
  // If there are multiple numbers (e.g. separated by semicolon or comma), we handle them
  if (cleaned.includes(';') || cleaned.includes(',')) {
    const separator = cleaned.includes(';') ? ';' : ',';
    return cleaned
      .split(separator)
      .map(p => formatSingleIndianPhoneNumber(p.trim(), address))
      .filter(Boolean)
      .join(', ');
  }
  
  return formatSingleIndianPhoneNumber(cleaned, address);
}

function formatSingleIndianPhoneNumber(phone: string, address: string): string {
  if (!phone) return '';

  // If it already has +91 or starts with 0, keep it as is
  if (phone.startsWith('+') || phone.startsWith('0')) {
    return phone;
  }
  
  // Clean formatting for check
  const digitsOnly = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's an 8-digit landline number (like 25318335)
  if (digitsOnly.length === 8 && /^\d+$/.test(digitsOnly)) {
    const lowerAddress = address.toLowerCase();
    let stdPrefix = '';
    
    if (lowerAddress.includes('delhi') || lowerAddress.includes('new delhi')) {
      stdPrefix = '011';
    } else if (lowerAddress.includes('bangalore') || lowerAddress.includes('bengaluru')) {
      stdPrefix = '080';
    } else if (lowerAddress.includes('mumbai') || lowerAddress.includes('bombay')) {
      stdPrefix = '022';
    }
    
    if (stdPrefix) {
      // Format 8-digit number into 4-4 for readability, e.g. 011 2531 8335
      return `${stdPrefix} ${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4)}`;
    }
  }
  
  // If it's a 10-digit number starting with city code without leading 0 (like 8022868423 or 1126588500)
  if (digitsOnly.length === 10 && /^\d+$/.test(digitsOnly)) {
    if (digitsOnly.startsWith('11')) {
      return `011 ${digitsOnly.substring(2, 6)} ${digitsOnly.substring(6)}`;
    } else if (digitsOnly.startsWith('80')) {
      return `080 ${digitsOnly.substring(2, 6)} ${digitsOnly.substring(6)}`;
    } else if (digitsOnly.startsWith('22')) {
      return `022 ${digitsOnly.substring(2, 6)} ${digitsOnly.substring(6)}`;
    }
  }
  
  return phone;
}

/**
 * Gets a clean, dialable phone link prefix for tel:
 */
export function getDialerHref(phone: string, address: string): string {
  if (!phone) return '';
  
  // If there are multiple numbers, take the first one for the main dialer link
  const firstPhone = (phone.includes(';') ? phone.split(';')[0] : phone.includes(',') ? phone.split(',')[0] : phone).trim();
  
  const cleaned = firstPhone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+') || cleaned.startsWith('0')) {
    return `tel:${cleaned}`;
  }
  
  if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
    const lowerAddress = address.toLowerCase();
    let stdPrefix = '';
    
    if (lowerAddress.includes('delhi') || lowerAddress.includes('new delhi')) {
      stdPrefix = '011';
    } else if (lowerAddress.includes('bangalore') || lowerAddress.includes('bengaluru')) {
      stdPrefix = '080';
    } else if (lowerAddress.includes('mumbai') || lowerAddress.includes('bombay')) {
      stdPrefix = '022';
    }
    
    if (stdPrefix) {
      return `tel:${stdPrefix}${cleaned}`;
    }
  }
  
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    if (cleaned.startsWith('11') || cleaned.startsWith('80') || cleaned.startsWith('22')) {
      return `tel:0${cleaned}`;
    }
  }
  
  return `tel:${cleaned}`;
}
