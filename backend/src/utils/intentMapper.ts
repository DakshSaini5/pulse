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
  'blood test': 'General Medicine',
  'blood work': 'General Medicine',
  'lab test': 'General Medicine',
  'pathology': 'General Medicine',
  'blood report': 'General Medicine',
  'cbc': 'General Medicine',
  'complete blood count': 'General Medicine',
  'blood sugar': 'General Medicine',
  'cholesterol test': 'General Medicine',

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
  'sugar level': 'Endocrinology',

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
