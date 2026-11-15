/**
 * Intent Mapper Utility
 * Maps patient-oriented symptoms, procedures, treatments, and common terms
 * to clinical specialties in the database.
 * Single source of truth — used by both search and autocomplete backend routes.
 */

const INTENT_MAPPING: { [key: string]: string } = {
  // Dental / Dentistry
  'root canal': 'Dental',
  'dentist': 'Dental',
  'dental': 'Dental',
  'tooth': 'Dental',
  'teeth': 'Dental',
  'crown': 'Dental',
  'cavity': 'Dental',
  'filling': 'Dental',
  'braces': 'Dental',
  'orthodontist': 'Dental',
  'extraction': 'Dental',
  'implant': 'Dental',
  'scaling': 'Dental',
  'periodontist': 'Dental',
  'gum': 'Dental',
  'molar': 'Dental',

  // Eye Care / Ophthalmology
  'eye': 'Eye Care',
  'optician': 'Eye Care',
  'ophthalmology': 'Eye Care',
  'ophthalmologist': 'Eye Care',
  'vision': 'Eye Care',
  'glasses': 'Eye Care',
  'cataract': 'Eye Care',
  'lasik': 'Eye Care',
  'glaucoma': 'Eye Care',
  'lens': 'Eye Care',
  'cornea': 'Eye Care',
  'retina': 'Eye Care',
  'optometrist': 'Eye Care',
  'eyesight': 'Eye Care',

  // Pediatrics / Child Care
  'child vaccination': 'Pediatrics',
  'child': 'Pediatrics',
  'children': 'Pediatrics',
  'pediatric': 'Pediatrics',
  'pediatrics': 'Pediatrics',
  'baby': 'Pediatrics',
  'infant': 'Pediatrics',
  'newborn': 'Pediatrics',
  'pediatrician': 'Pediatrics',
  'polio': 'Pediatrics',
  'measles': 'Pediatrics',
  'neonatal': 'Pediatrics',

  // Blood Tests & Lab — mapped to General Medicine (broadest hospital match)
  'sugar test': 'General Medicine',
  'blood sugar test': 'General Medicine',
  'blood sugar': 'General Medicine',
  'sugar check': 'General Medicine',
  'fasting sugar': 'General Medicine',
  'fasting blood sugar': 'General Medicine',
  'random blood sugar': 'General Medicine',
  'glucose test': 'General Medicine',
  'blood glucose': 'General Medicine',
  'sugar level': 'General Medicine',
  'sugar': 'General Medicine',
  'hba1c test': 'General Medicine',
  'hba1c': 'General Medicine',
  'blood test': 'General Medicine',
  'blood tests': 'General Medicine',
  'blood work': 'General Medicine',
  'lab test': 'General Medicine',
  'lab tests': 'General Medicine',
  'laboratory': 'General Medicine',
  'pathology': 'General Medicine',
  'pathology test': 'General Medicine',
  'blood report': 'General Medicine',
  'cbc': 'General Medicine',
  'complete blood count': 'General Medicine',
  'hemoglobin test': 'General Medicine',
  'platelet count': 'General Medicine',
  'cholesterol test': 'General Medicine',
  'lipid profile': 'General Medicine',
  'lipid test': 'General Medicine',
  'urine test': 'General Medicine',
  'urine routine': 'General Medicine',
  'urinalysis': 'General Medicine',
  'stool test': 'General Medicine',
  'thyroid test': 'Endocrinology',
  'tsh': 'Endocrinology',
  'liver test': 'Gastroenterology',
  'liver function test': 'Gastroenterology',
  'lft': 'Gastroenterology',
  'kidney test': 'General Medicine',
  'kidney function test': 'General Medicine',
  'kft': 'General Medicine',
  'creatinine test': 'General Medicine',
  'creatinine': 'General Medicine',
  'uric acid': 'General Medicine',
  'vitamin d': 'General Medicine',
  'vitamin b12': 'General Medicine',
  'calcium test': 'General Medicine',
  'dengue test': 'General Medicine',
  'dengue': 'General Medicine',
  'malaria test': 'General Medicine',
  'malaria': 'General Medicine',
  'typhoid test': 'General Medicine',
  'widal test': 'General Medicine',
  'covid test': 'General Medicine',
  'rt pcr': 'General Medicine',
  'rt-pcr': 'General Medicine',
  'x ray': 'Orthopedics',
  'x-ray': 'Orthopedics',
  'xray': 'Orthopedics',
  'ultrasound': 'General Medicine',
  'usg': 'General Medicine',
  'sonography': 'General Medicine',
  'ct scan': 'General Medicine',
  'mri': 'Neurology',
  'mri scan': 'Neurology',
  'diagnostic center': 'General Medicine',
  'diagnostic centre': 'General Medicine',
  'diagnostic': 'General Medicine',
  'diagnostics': 'General Medicine',

  // Vaccination — mapped to General Medicine (adult vaccination is in most hospitals)
  'vaccination': 'General Medicine',
  'vaccine': 'General Medicine',
  'immunization': 'General Medicine',
  'flu shot': 'General Medicine',
  'covid vaccine': 'General Medicine',

  // Hematology (specialist blood disorders only)
  'anemia': 'Hematology',
  'haematology': 'Hematology',
  'hematology': 'Hematology',
  'thalassemia': 'Hematology',
  'sickle cell': 'Hematology',
  'platelet': 'Hematology',
  'bleeding disorder': 'Hematology',

  // Cardiology (Heart)
  'heart': 'Cardiology',
  'cardiology': 'Cardiology',
  'cardiologist': 'Cardiology',
  'ecg': 'Cardiology',
  'cardiac': 'Cardiology',
  'chest pain': 'Cardiology',
  'heart attack': 'Cardiology',
  'pacemaker': 'Cardiology',
  'bypass': 'Cardiology',
  'angioplasty': 'Cardiology',

  // Orthopedics (Bones & Joints)
  'bone': 'Orthopedics',
  'fracture': 'Orthopedics',
  'joint': 'Orthopedics',
  'knee': 'Orthopedics',
  'spine': 'Orthopedics',
  'back pain': 'Orthopedics',
  'physiotherapy': 'Orthopedics',
  'orthopedic': 'Orthopedics',
  'orthopaedic': 'Orthopedics',
  'shoulder': 'Orthopedics',
  'hip': 'Orthopedics',
  'sports injury': 'Orthopedics',
  'slip disc': 'Orthopedics',

  // Gynecology
  'gynecologist': 'Gynecology',
  'gynaecologist': 'Gynecology',
  'pregnancy': 'Gynecology',
  'delivery': 'Gynecology',
  'maternity': 'Gynecology',
  'obstetrics': 'Gynecology',
  'gynecology': 'Gynecology',
  'gynaecology': 'Gynecology',
  'periods': 'Gynecology',
  'menstrual': 'Gynecology',
  'ivf': 'Gynecology',
  'uterus': 'Gynecology',
  'ovarian': 'Gynecology',

  // Endocrinology (Hormones, Diabetes)
  'thyroid': 'Endocrinology',
  'hormone': 'Endocrinology',
  'diabetes': 'Endocrinology',
  'diabetic': 'Endocrinology',
  'endocrinology': 'Endocrinology',
  'endocrinologist': 'Endocrinology',
  'metabolic': 'Endocrinology',
  'insulin': 'Endocrinology',

  // Neurology (Brain & Nerves)
  'brain': 'Neurology',
  'neurology': 'Neurology',
  'neurologist': 'Neurology',
  'stroke': 'Neurology',
  'migraine': 'Neurology',
  'seizure': 'Neurology',
  'nerve': 'Neurology',
  'epilepsy': 'Neurology',
  'paralysis': 'Neurology',
  'vertigo': 'Neurology',
  'memory loss': 'Neurology',

  // Gastroenterology (Digestive System)
  'stomach': 'Gastroenterology',
  'digestion': 'Gastroenterology',
  'liver': 'Gastroenterology',
  'acidity': 'Gastroenterology',
  'gastro': 'Gastroenterology',
  'endoscopy': 'Gastroenterology',
  'colonoscopy': 'Gastroenterology',
  'ulcer': 'Gastroenterology',
  'ibs': 'Gastroenterology',
  'bowel': 'Gastroenterology',
  'jaundice': 'Gastroenterology',
  'constipation': 'Gastroenterology',
  'diarrhea': 'Gastroenterology',

  // Dermatology (Skin)
  'skin': 'Dermatology',
  'rash': 'Dermatology',
  'acne': 'Dermatology',
  'eczema': 'Dermatology',
  'dermatologist': 'Dermatology',
  'dermatology': 'Dermatology',
  'psoriasis': 'Dermatology',
  'allergy': 'Dermatology',
  'hair loss': 'Dermatology',
  'fungal': 'Dermatology',
  'itching': 'Dermatology',

  // Pulmonology (Lungs & Breathing)
  'lungs': 'Pulmonology',
  'breathing': 'Pulmonology',
  'asthma': 'Pulmonology',
  'respiratory': 'Pulmonology',
  'pulmonologist': 'Pulmonology',
  'pulmonology': 'Pulmonology',
  'tuberculosis': 'Pulmonology',
  'tb': 'Pulmonology',
  'copd': 'Pulmonology',
  'pneumonia': 'Pulmonology',
  'shortness of breath': 'Pulmonology',

  // ENT (Ear, Nose, Throat)
  'ear': 'ENT',
  'nose': 'ENT',
  'throat': 'ENT',
  'ent': 'ENT',
  'hearing': 'ENT',
  'tonsil': 'ENT',
  'sinusitis': 'ENT',
  'tinnitus': 'ENT',
  'snoring': 'ENT',
  'adenoids': 'ENT',

  // General Medicine / Primary Care
  'cough': 'General Medicine',
  'cold': 'General Medicine',
  'flu': 'General Medicine',
  'fever': 'General Medicine',
  'headache': 'General Medicine',
  'stomach ache': 'General Medicine',
  'general medicine': 'General Medicine',
  'general physician': 'General Medicine',
  'physician': 'General Medicine',
  'gp': 'General Medicine',
  'consultation': 'General Medicine',
  'checkup': 'General Medicine',
  'check up': 'General Medicine',
  'high blood pressure': 'General Medicine',
  'hypertension': 'General Medicine',
  'general': 'General Medicine',
  'body pain': 'General Medicine',
  'weakness': 'General Medicine',
};

/**
 * Searches the queryText for symptoms/treatments and maps it to a database Specialty.
 * Returns the specialty name, or null if no mapping is found.
 * Sorted by key length descending to match longest phrase first (e.g. "child vaccination" over "vaccination").
 */
export function findMappedSpecialty(queryText: string): string | null {
  if (!queryText) return null;
  const normalized = queryText.toLowerCase().trim();

  // Sort keys by length descending to match longest phrase first
  const keys = Object.keys(INTENT_MAPPING).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (normalized.includes(key)) {
      return INTENT_MAPPING[key];
    }
  }

  return null;
}

export interface SearchableTest {
  name: string;
  category: string;
  specialty: string;
  keywords: string[];
}

export const SEARCHABLE_TESTS: SearchableTest[] = [
  { name: 'Blood Test', category: 'Pathology & Lab', specialty: 'General Medicine', keywords: ['blood', 'blood test', 'blood tests', 'cbc', 'complete blood count', 'hemoglobin', 'platelet', 'blood report'] },
  { name: 'Sugar Test (Blood Glucose / HbA1c)', category: 'Diabetes Screening', specialty: 'General Medicine', keywords: ['sugar', 'sugar test', 'blood sugar', 'glucose', 'fasting sugar', 'pp sugar', 'hba1c', 'diabetes test'] },
  { name: 'Urine Test (Routine & Microscopy)', category: 'Routine Lab', specialty: 'General Medicine', keywords: ['urine', 'urine test', 'urinalysis', 'urine routine'] },
  { name: 'Thyroid Profile (TSH, T3, T4)', category: 'Hormone Profile', specialty: 'Endocrinology', keywords: ['thyroid', 'thyroid test', 'tsh', 't3', 't4'] },
  { name: 'Lipid Profile (Cholesterol / Triglycerides)', category: 'Heart Health', specialty: 'General Medicine', keywords: ['lipid', 'lipid profile', 'cholesterol', 'cholesterol test', 'triglycerides', 'lipid test'] },
  { name: 'Liver Function Test (LFT)', category: 'Hepatic Panel', specialty: 'Gastroenterology', keywords: ['lft', 'liver function', 'liver test', 'bilirubin', 'sgot', 'sgpt'] },
  { name: 'Kidney Function Test (KFT / Creatinine)', category: 'Renal Panel', specialty: 'General Medicine', keywords: ['kft', 'kidney function', 'kidney test', 'creatinine', 'uric acid', 'urea'] },
  { name: 'X-Ray (Chest / Bone)', category: 'Radiology & Imaging', specialty: 'Orthopedics', keywords: ['x-ray', 'x ray', 'xray', 'chest x-ray'] },
  { name: 'Ultrasound / Sonography (USG)', category: 'Diagnostic Imaging', specialty: 'General Medicine', keywords: ['ultrasound', 'usg', 'sonography'] },
  { name: 'CT Scan', category: 'Radiology & Imaging', specialty: 'General Medicine', keywords: ['ct', 'ct scan', 'computed tomography'] },
  { name: 'MRI Scan', category: 'Radiology & Imaging', specialty: 'Neurology', keywords: ['mri', 'mri scan', 'magnetic resonance'] },
  { name: 'ECG / Echo', category: 'Cardiac Diagnostics', specialty: 'Cardiology', keywords: ['ecg', 'echo', 'echocardiogram', 'tmt', 'heart test'] },
  { name: 'Dengue & Malaria Fever Test', category: 'Infectious Disease', specialty: 'General Medicine', keywords: ['dengue', 'malaria', 'fever test', 'widal', 'typhoid'] },
  { name: 'Vitamin Profile (Vitamin D & B12)', category: 'Wellness & Nutrition', specialty: 'General Medicine', keywords: ['vitamin d', 'vitamin b12', 'vitamin test', 'calcium'] },
  { name: 'Vaccination / Immunization', category: 'Preventive Care', specialty: 'General Medicine', keywords: ['vaccine', 'vaccination', 'immunization', 'flu shot', 'covid vaccine'] },
];

export function findMatchingTests(queryText: string): SearchableTest[] {
  if (!queryText) return [];
  const normalized = queryText.toLowerCase().trim();
  return SEARCHABLE_TESTS.filter(t => 
    t.name.toLowerCase().includes(normalized) ||
    t.category.toLowerCase().includes(normalized) ||
    t.keywords.some(kw => normalized.includes(kw) || kw.includes(normalized))
  );
}
