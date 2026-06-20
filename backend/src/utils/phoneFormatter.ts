/**
 * Rebuilt National Phone Formatter
 * Formats Indian phone numbers and attaches correct regional STD prefixes for landlines.
 */

const STD_CODES: Record<string, string> = {
  // Metros
  'delhi': '011', 'new delhi': '011', 'mumbai': '022', 'bombay': '022',
  'kolkata': '033', 'calcutta': '033', 'chennai': '044', 'madras': '044',
  'hyderabad': '040', 'bangalore': '080', 'bengaluru': '080', 'pune': '020',
  'ahmedabad': '079',

  // Other Major Cities
  'surat': '0261', 'jaipur': '0141', 'lucknow': '0522', 'kanpur': '0512',
  'nagpur': '0712', 'indore': '0731', 'bhopal': '0755', 'patna': '0612',
  'vadodara': '0265', 'ludhiana': '0161', 'agra': '0562', 'visakhapatnam': '0891',
  'rajkot': '0281', 'coimbatore': '0422', 'amritsar': '0183', 'dehradun': '0135',
  'guwahati': '0361', 'chandigarh': '0172', 'shimla': '0177', 'srinagar': '0194',
  'jammu': '0191', 'jodhpur': '0291', 'udaipur': '0294', 'varanasi': '0542',
  'allahabad': '0532', 'prayagraj': '0532', 'ranchi': '0651', 'jamshedpur': '0657',
  'bhubaneswar': '0674', 'cuttack': '0671', 'raipur': '0771', 'gwalior': '0751',
  'mysore': '0821', 'mangalore': '0824', 'madurai': '0452', 'warangal': '0870',
  'vijayawada': '0866', 'kochi': '0484', 'thiruvananthapuram': '0471', 'kozhikode': '0495',
  'panaji': '0832', 'goa': '0832', 'siliguri': '0353', 'shillong': '0364',
  'imphal': '0385', 'agartala': '0381', 'aizawl': '0389', 'kohima': '0370',
  'itanagar': '0360', 'gangtok': '03592'
};

export function formatIndianPhoneNumber(phone: string, localizedAddress: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+') || cleaned.startsWith('0')) {
    return phone; // Already formatted with country or STD code
  }

  const lowerAddress = localizedAddress.toLowerCase();
  
  // 1. Identify landline (8 digits typically in metro)
  if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
    let stdPrefix = '';
    for (const city in STD_CODES) {
      if (lowerAddress.includes(city)) {
        stdPrefix = STD_CODES[city];
        break;
      }
    }
    
    if (stdPrefix) {
      return `${stdPrefix} ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
    }
  }

  // 2. Mobile handling or numbers parsed without a leading zero
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    for (const city in STD_CODES) {
      const stdCode = STD_CODES[city];
      const prefixWithoutZero = stdCode.substring(1);
      
      // E.g. Chennai '44' -> Mobile numbers or landlines missing '0'
      if (cleaned.startsWith(prefixWithoutZero)) {
        const rest = cleaned.substring(prefixWithoutZero.length);
        if (rest.length === 8) {
          return `${stdCode} ${rest.substring(0, 4)} ${rest.substring(4)}`;
        } else if (rest.length === 7 || rest.length === 6) {
          return `${stdCode} ${rest.substring(0, 3)} ${rest.substring(3)}`;
        }
      }
    }
    
    // Standard 10 digit mobile number
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }

  return phone;
}
