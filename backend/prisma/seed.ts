import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Wipe existing data
  await prisma.adminLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.healthTrend.deleteMany({});
  await prisma.specialistRecommendation.deleteMany({});
  await prisma.medicalReportSummary.deleteMany({});
  await prisma.medicalReportValue.deleteMany({});
  await prisma.medicalReport.deleteMany({});
  await prisma.prescriptionAnalysis.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.oCRResult.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.savedHospital.deleteMany({});
  await prisma.hospitalReview.deleteMany({});
  await prisma.hospitalSpecialty.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🧹 Database cleaned.');

  // Demo Users
  const userPassword = await bcrypt.hash('userpassword123', 10);
  const adminPassword = await bcrypt.hash('adminpassword123', 10);
  await prisma.user.create({ data: { name: 'Demo User', email: 'user@pulse.com', passwordHash: userPassword, role: 'USER' } });
  await prisma.user.create({ data: { name: 'Pulse Admin', email: 'admin@pulse.com', passwordHash: adminPassword, role: 'ADMIN' } });
  console.log('👤 Demo users created.');

  // Specialties
  const specialtyData = [
    { name: 'Cardiology', description: 'Heart and cardiovascular diseases', category: 'HEART' },
    { name: 'Neurology', description: 'Brain and nervous system disorders', category: 'BRAIN' },
    { name: 'Orthopedics', description: 'Bone, joint and muscle disorders', category: 'BONE' },
    { name: 'Pediatrics', description: 'Child healthcare and development', category: 'CHILDREN' },
    { name: 'Gynecology', description: "Women's reproductive health", category: 'WOMEN' },
    { name: 'Oncology', description: 'Cancer diagnosis and treatment', category: 'CANCER' },
    { name: 'Endocrinology', description: 'Hormonal and metabolic disorders', category: 'METABOLIC' },
    { name: 'Gastroenterology', description: 'Digestive system disorders', category: 'DIGESTIVE' },
    { name: 'Pulmonology', description: 'Lung and respiratory disorders', category: 'LUNG' },
    { name: 'Urology', description: 'Urinary tract and kidney disorders', category: 'URINARY' },
    { name: 'Ophthalmology', description: 'Eye and vision disorders', category: 'EYE' },
    { name: 'ENT', description: 'Ear, nose and throat disorders', category: 'ENT' },
    { name: 'Dermatology', description: 'Skin, hair and nail disorders', category: 'SKIN' },
    { name: 'Psychiatry', description: 'Mental health disorders', category: 'MENTAL' },
    { name: 'Hematology', description: 'Blood disorders and diseases', category: 'BLOOD' },
    { name: 'Rheumatology', description: 'Autoimmune and joint diseases', category: 'JOINT' },
    { name: 'Nephrology', description: 'Kidney diseases and dialysis', category: 'KIDNEY' },
    { name: 'General Surgery', description: 'Surgical procedures and operations', category: 'SURGERY' },
    { name: 'General Medicine', description: 'Primary care and general health', category: 'GENERAL' },
    { name: 'Emergency Medicine', description: '24/7 emergency critical care', category: 'EMERGENCY' },
    { name: 'Dental', description: 'Oral health and dental care', category: 'DENTAL' },
    { name: 'Radiology', description: 'Medical imaging and diagnostics', category: 'IMAGING' },
    { name: 'Plastic Surgery', description: 'Reconstructive and cosmetic surgery', category: 'COSMETIC' },
    { name: 'Physiotherapy', description: 'Physical rehabilitation and therapy', category: 'REHAB' },
  ];

  const specialties: Record<string, string> = {};
  for (const s of specialtyData) {
    const created = await prisma.specialty.create({ data: s });
    specialties[s.name] = created.id;
  }
  console.log('🔬 Specialties created.');

  // Helper
  const link = (name: string, departments: string, cost: number, opd = '09:00 AM - 05:00 PM') => ({
    specialtyId: specialties[name],
    departments,
    averageCost: cost,
    opdTimings: opd,
  });

  // Comprehensive Hospital List - Delhi NCR + Mumbai + Bangalore
  const hospitals = [
    // ===== DELHI NCR =====
    {
      name: 'Indraprastha Apollo Hospital',
      address: 'Sarita Vihar, Mathura Road, New Delhi, Delhi 110076',
      latitude: 28.5369, longitude: 77.2882,
      rating: 4.7, phone: '+91-11-26925858',
      email: 'apollo.delhi@apollo.com', website: 'https://delhi.apollohospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Interventional Cardiology, Cardiac Surgery, Heart Failure Clinic', 1500, '08:00 AM - 08:00 PM'),
        link('Neurology', 'Neurological Sciences, Stroke Unit, Epilepsy Clinic', 1200, '09:00 AM - 05:00 PM'),
        link('Oncology', 'Oncology, Chemotherapy, Radiation Center', 2000, '09:00 AM - 04:00 PM'),
        link('Orthopedics', 'Joint Replacement, Spine Surgery, Sports Medicine', 1800, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'Liver Diseases, GI Surgery, Endoscopy', 1000, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Preventive Health Screening', 800, '08:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Trauma, Emergency Critical Care, ICU', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Max Super Speciality Hospital (Saket)',
      address: 'Press Enclave Road, Saket, New Delhi, Delhi 110017',
      latitude: 28.5284, longitude: 77.2114,
      rating: 4.6, phone: '+91-11-26515050',
      email: 'saket@maxhealthcare.com', website: 'https://www.maxhealthcare.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiothoracic Surgery, Cardiac Rehabilitation, TAVR', 1600, '08:00 AM - 08:00 PM'),
        link('Neurology', 'Neurosurgery, Neurosciences, Stroke Center', 1300, '09:00 AM - 05:00 PM'),
        link('Oncology', 'Cancer Institute, Bone Marrow Transplant, Immunotherapy', 2200, '09:00 AM - 04:00 PM'),
        link('Orthopedics', 'Robotic Joint Replacement, Complex Spine', 2000, '09:00 AM - 06:00 PM'),
        link('Urology', 'Urological Sciences, Kidney Transplant, Robotic Surgery', 1400, '09:00 AM - 05:00 PM'),
        link('Gastroenterology', 'Advanced GI, Hepatology, Liver Transplant', 1200, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Preventive & Internal Medicine, Diabetes Center', 900, '08:00 AM - 08:00 PM'),
        link('Emergency Medicine', '24/7 Emergency, Trauma Care, NICU', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Fortis Escorts Heart Institute',
      address: 'Okhla Road, New Delhi, Delhi 110025',
      latitude: 28.5601, longitude: 77.2737,
      rating: 4.8, phone: '+91-11-47135000',
      email: 'contact.escorts@fortishealthcare.com', website: 'https://www.fortisescorts.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Advanced Cardiac Surgery, Heart Transplant, Electrophysiology', 2000, '08:00 AM - 08:00 PM'),
        link('Neurology', 'Brain & Spine, Neurointervention', 1500, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Outpatient Consultations, Internal Medicine', 700, '09:00 AM - 06:00 PM'),
        link('Emergency Medicine', 'Cardiac Emergency, Trauma Center', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'AIIMS New Delhi',
      address: 'Ansari Nagar East, New Delhi, Delhi 110029',
      latitude: 28.5672, longitude: 77.2100,
      rating: 4.9, phone: '+91-11-26594404',
      email: 'info@aiims.edu', website: 'https://www.aiims.edu',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'CTVS, Cardiology OPD, Advanced Cardiac Diagnostics', 200, '09:00 AM - 01:00 PM'),
        link('Neurology', 'Neurology, Neurosurgery, Neuro-rehabilitation', 200, '09:00 AM - 01:00 PM'),
        link('Oncology', 'Cancer Center, Medical Oncology, Radiation Oncology', 300, '09:00 AM - 01:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement, Spine', 200, '09:00 AM - 01:00 PM'),
        link('Pediatrics', 'Pediatrics, PICU, Neonatology', 100, '09:00 AM - 01:00 PM'),
        link('Gynecology', 'Obstetrics & Gynecology, Infertility', 150, '09:00 AM - 01:00 PM'),
        link('Gastroenterology', 'Gastroenterology, Liver Transplant', 200, '09:00 AM - 01:00 PM'),
        link('Pulmonology', 'Pulmonary Medicine, Respiratory ICU', 200, '09:00 AM - 01:00 PM'),
        link('Urology', 'Urology, Renal Sciences', 200, '09:00 AM - 01:00 PM'),
        link('Dermatology', 'Dermatology, Venereology', 150, '09:00 AM - 01:00 PM'),
        link('Psychiatry', 'Psychiatry & Mental Health, Deaddiction', 150, '09:00 AM - 01:00 PM'),
        link('Hematology', 'Hematology, Bone Marrow Transplant', 200, '09:00 AM - 01:00 PM'),
        link('General Medicine', 'General OPD, Emergency Medicine', 100, '09:00 AM - 01:00 PM'),
        link('Emergency Medicine', 'Emergency & Trauma Center', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Safdarjung Hospital',
      address: 'Ansari Nagar West, New Delhi, Delhi 110029',
      latitude: 28.5686, longitude: 77.2065,
      rating: 4.1, phone: '+91-11-26707444',
      email: 'safdarjunghospital@gmail.com', website: 'https://vmmc-sjh.nic.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'General OPD, Internal Medicine', 50, '09:00 AM - 01:00 PM'),
        link('Orthopedics', 'Orthopedics, Trauma Surgery', 50, '09:00 AM - 01:00 PM'),
        link('Gynecology', 'Obstetrics & Gynecology, Maternity', 50, '09:00 AM - 01:00 PM'),
        link('Pediatrics', 'Pediatrics, Child Health', 50, '09:00 AM - 01:00 PM'),
        link('Emergency Medicine', 'Emergency & Trauma', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Sir Ganga Ram Hospital',
      address: 'Old Rajinder Nagar, New Delhi, Delhi 110060',
      latitude: 28.6438, longitude: 77.1875,
      rating: 4.5, phone: '+91-11-25750000',
      email: 'info@sgrh.com', website: 'https://www.sgrh.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Cardiac Surgery, Pacemaker Clinic', 1200, '09:00 AM - 05:00 PM'),
        link('Gastroenterology', 'Gastroenterology, Liver Diseases, GI Surgery', 1000, '09:00 AM - 05:00 PM'),
        link('Neurology', 'Neurology, Neurosurgery, Stroke Unit', 1100, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Surgery, Physiotherapy', 900, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 600, '09:00 AM - 05:00 PM'),
        link('Emergency Medicine', 'Emergency Services, Trauma Unit', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Lok Nayak Hospital (LNJP)',
      address: 'Jawahar Lal Nehru Marg, New Delhi, Delhi 110002',
      latitude: 28.6408, longitude: 77.2385,
      rating: 3.8, phone: '+91-11-23232400',
      email: 'lnjp.hospital@gmail.com', website: 'http://lnjp.delhigovt.nic.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'General OPD, Internal Medicine', 30, '09:00 AM - 01:00 PM'),
        link('Emergency Medicine', 'Emergency Care, Trauma', 0, '24 Hours Open'),
        link('Pediatrics', 'Pediatrics, Child Health Services', 30, '09:00 AM - 01:00 PM'),
      ],
    },
    {
      name: 'Medanta – The Medicity',
      address: 'CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001',
      latitude: 28.4421, longitude: 77.0444,
      rating: 4.7, phone: '+91-124-4141414',
      email: 'care@medanta.org', website: 'https://www.medanta.org',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Heart Institute, TAVR, Cardiac Electrophysiology', 2000, '08:00 AM - 08:00 PM'),
        link('Neurology', 'Institute of Neurosciences, Epilepsy, Stroke', 1500, '09:00 AM - 05:00 PM'),
        link('Oncology', 'Cancer Institute, Proton Therapy, Bone Marrow Transplant', 2500, '09:00 AM - 04:00 PM'),
        link('Orthopedics', 'Bone & Joint Institute, Robotic Surgery', 2000, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'Liver Transplant, GI Oncology, Hepatology', 1500, '09:00 AM - 05:00 PM'),
        link('Kidney Transplant', 'Renal Sciences, Nephrology, Dialysis', 1800, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Preventive Health', 1000, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency & Critical Care, Trauma Center', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Fortis Memorial Research Institute (FMRI)',
      address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
      latitude: 28.4533, longitude: 77.0733,
      rating: 4.6, phone: '+91-124-4962200',
      email: 'fmri@fortishealthcare.com', website: 'https://www.fortishealthcare.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, CTVS, Interventional Cardiology', 1800, '09:00 AM - 07:00 PM'),
        link('Neurology', 'Neuro Sciences, Brain Surgery, Spine', 1500, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Joint Replacement, Arthroscopy, Sports Injuries', 1800, '09:00 AM - 06:00 PM'),
        link('Oncology', 'Comprehensive Cancer Care, Chemotherapy', 2000, '09:00 AM - 04:00 PM'),
        link('Gastroenterology', 'Hepatology, Liver Transplant, GI Endoscopy', 1200, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Outpatient Services', 800, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency Care, Trauma Response', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'BLK-Max Super Speciality Hospital',
      address: '5, Pusa Road, New Delhi, Delhi 110005',
      latitude: 28.6450, longitude: 77.1720,
      rating: 4.5, phone: '+91-11-30403040',
      email: 'info@blkmax.com', website: 'https://www.blkmax.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, Heart Surgery, Cath Lab', 1500, '08:00 AM - 08:00 PM'),
        link('Oncology', 'Blood & Bone Marrow Transplant, Cancer Care', 2000, '09:00 AM - 04:00 PM'),
        link('Neurology', 'Neurosciences, Spine, Brain Tumor', 1300, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Joint Replacement, Arthroscopy', 1500, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'GI Sciences, Liver Transplant, IBD', 1100, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Wellness Clinics', 800, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency, ICU, Critical Care', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Primus Super Speciality Hospital',
      address: 'Chandragupta Marg, Chanakyapuri, New Delhi, Delhi 110021',
      latitude: 28.5979, longitude: 77.1798,
      rating: 4.3, phone: '+91-11-66206620',
      email: 'info@primusdelhi.com', website: 'https://www.primusdelhi.com',
      workingHours: '09:00 AM - 09:00 PM', emergencyAvailable: true,
      specialtyLinks: [
        link('Orthopedics', 'Joint Replacement, Sports Medicine, Arthroscopy', 1500, '09:00 AM - 06:00 PM'),
        link('Cardiology', 'Cardiac Clinic, Preventive Cardiology', 1200, '09:00 AM - 05:00 PM'),
        link('Gastroenterology', 'Digestive Diseases, Bariatric Surgery', 1000, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Health Checkups', 700, '09:00 AM - 08:00 PM'),
      ],
    },
    {
      name: 'Venkateshwar Hospital',
      address: 'Sector 18A, Dwarka, New Delhi, Delhi 110075',
      latitude: 28.5845, longitude: 77.0413,
      rating: 4.4, phone: '+91-11-45000000',
      email: 'info@venkateshwarhospitals.com', website: 'https://www.venkateshwarhospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Cardiac Surgery, PTCA', 1300, '09:00 AM - 07:00 PM'),
        link('Neurology', 'Neurology, Neurosurgery, Stroke Management', 1100, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement, Spine Surgery', 1200, '09:00 AM - 06:00 PM'),
        link('Oncology', 'Oncology, Chemotherapy, Radiation', 1800, '09:00 AM - 04:00 PM'),
        link('Gastroenterology', 'Gastroenterology, Liver Diseases, Endoscopy', 900, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'General Consultation, Internal Medicine', 600, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency, Trauma, ICU', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Manipal Hospital (Dwarka)',
      address: 'Plot No. 2, Sector 6, Dwarka, New Delhi, Delhi 110075',
      latitude: 28.5921, longitude: 77.0455,
      rating: 4.4, phone: '+91-11-40849999',
      email: 'info.dwarka@manipalhospitals.com', website: 'https://www.manipalhospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, Heart Institute', 1400, '09:00 AM - 07:00 PM'),
        link('Orthopedics', 'Orthopedics, Sports Medicine, Joint Replacement', 1300, '09:00 AM - 06:00 PM'),
        link('Neurology', 'Neurology & Neurosurgery', 1100, '09:00 AM - 05:00 PM'),
        link('Oncology', 'Cancer Center, Oncology', 1700, '09:00 AM - 04:00 PM'),
        link('Pediatrics', 'Pediatrics, NICU, Child Health', 800, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 700, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency Services, Trauma Care', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Metro Hospitals & Heart Institute (Lajpat Nagar)',
      address: '21, Lajpat Nagar Part IV, New Delhi, Delhi 110024',
      latitude: 28.5694, longitude: 77.2402,
      rating: 4.3, phone: '+91-11-42777777',
      email: 'info@metrohospitals.com', website: 'https://www.metrohospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Heart Surgery, Pacemaker', 1200, '09:00 AM - 07:00 PM'),
        link('Neurology', 'Neurology, Stroke Unit', 1000, '09:00 AM - 05:00 PM'),
        link('Pediatrics', 'Pediatrics, Child Health, PICU', 800, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 500, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency, ICU', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Delhi Clinic & Metabolic Center',
      address: 'Connaught Place, New Delhi, Delhi 110001',
      latitude: 28.6304, longitude: 77.2177,
      rating: 4.4, phone: '+91-11-23344444',
      email: 'consult@delhiclinic.com', website: 'https://www.delhiclinic.com',
      workingHours: '09:00 AM - 07:00 PM', emergencyAvailable: false,
      specialtyLinks: [
        link('Endocrinology', 'Thyroid Clinic, Diabetes Management, Obesity', 800, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Primary Care, Preventive Health', 600, '09:00 AM - 07:00 PM'),
        link('Dermatology', 'Skin Care, Aesthetic Dermatology', 700, '09:00 AM - 05:00 PM'),
      ],
    },
    {
      name: 'Hindu Rao Hospital',
      address: 'Malkaganj, Sabzi Mandi, North Delhi, Delhi 110007',
      latitude: 28.6726, longitude: 77.2017,
      rating: 3.9, phone: '+91-11-23943000',
      email: 'hindurao@delhi.gov.in', website: 'http://hindurao.delhigovt.nic.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'General OPD, Internal Medicine', 30, '09:00 AM - 01:00 PM'),
        link('Orthopedics', 'Orthopedics, Fracture Management', 30, '09:00 AM - 01:00 PM'),
        link('Gynecology', 'Maternity, Obstetrics', 30, '09:00 AM - 01:00 PM'),
        link('Emergency Medicine', 'Emergency, Casualty', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Max Hospital Vaishali',
      address: 'W3, Sector 1, Vaishali, Ghaziabad, Uttar Pradesh 201010',
      latitude: 28.6419, longitude: 77.3382,
      rating: 4.4, phone: '+91-120-4599222',
      email: 'vaishali@maxhealthcare.com', website: 'https://www.maxhealthcare.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Cath Lab, Heart Surgery', 1300, '09:00 AM - 07:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement', 1200, '09:00 AM - 06:00 PM'),
        link('Neurology', 'Neurology, Neurosurgery', 1100, '09:00 AM - 05:00 PM'),
        link('Pediatrics', 'Pediatrics, NICU', 800, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'General Consultation, Internal Medicine', 600, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Kailash Hospital & Neuro Institute',
      address: 'H-33, Sector 27, Noida, Uttar Pradesh 201301',
      latitude: 28.5706, longitude: 77.3219,
      rating: 4.3, phone: '+91-120-4400000',
      email: 'info@kailashhospital.com', website: 'https://www.kailashhospital.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Neurology', 'Neurology, Neurosurgery, Spine Surgery', 1100, '09:00 AM - 06:00 PM'),
        link('Cardiology', 'Cardiology, Cardiac Surgery', 1200, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement', 1100, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 600, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency, Critical Care', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Fortis Noida',
      address:'B-22, Sector 62, Noida, Uttar Pradesh 201301',
      latitude: 28.6239, longitude: 77.3672,
      rating: 4.4, phone: '+91-120-5000000',
      email: 'noida@fortishealthcare.com', website: 'https://www.fortishealthcare.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, Heart Surgery', 1500, '09:00 AM - 07:00 PM'),
        link('Neurology', 'Neurosciences, Stroke Center', 1200, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Robotic Surgery', 1400, '09:00 AM - 06:00 PM'),
        link('Oncology', 'Cancer Care, Chemotherapy', 1800, '09:00 AM - 04:00 PM'),
        link('General Medicine', 'Internal Medicine, Outpatient', 700, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency Services, Trauma', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Yashoda Hospital (Ghaziabad)',
      address: 'NH-58, Near MMG Hospital, Ghaziabad, Uttar Pradesh 201001',
      latitude: 28.6722, longitude: 77.4176,
      rating: 4.2, phone: '+91-120-6788000',
      email: 'info@yashodahospitals.com', website: 'https://www.yashodahospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Heart Diseases, Cardiac Surgery', 1100, '09:00 AM - 06:00 PM'),
        link('Orthopedics', 'Joint Replacement, Fracture Management', 1000, '09:00 AM - 06:00 PM'),
        link('Neurology', 'Neurology, Brain Stroke', 1000, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'General Consultation, Internal Medicine', 500, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Columbia Asia Hospital (Gurugram)',
      address: 'Plot No. 21, Sector 47, Gurugram, Haryana 122001',
      latitude: 28.4372, longitude: 77.0684,
      rating: 4.3, phone: '+91-124-4565100',
      email: 'gurugram@columbiaasiahospitals.com', website: 'https://www.columbiaasiahospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'Internal Medicine, Family Medicine', 700, '09:00 AM - 08:00 PM'),
        link('Cardiology', 'Cardiology, Echocardiography', 1200, '09:00 AM - 06:00 PM'),
        link('Orthopedics', 'Orthopedics, Sports Medicine', 1000, '09:00 AM - 06:00 PM'),
        link('Pediatrics', 'Pediatrics, Child Health', 700, '09:00 AM - 06:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Paras Hospital (Gurugram)',
      address: 'C-1, Sushant Lok Phase I, Gurugram, Haryana 122002',
      latitude: 28.4674, longitude: 77.0638,
      rating: 4.3, phone: '+91-124-4585555',
      email: 'gurugram@parashospitals.com', website: 'https://www.parashospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Heart Institute, Cath Lab', 1300, '09:00 AM - 07:00 PM'),
        link('Neurology', 'Neurosciences, Stroke Unit', 1100, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement', 1200, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Internal Medicine, Wellness', 700, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency, Critical Care', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Artemis Hospital (Gurugram)',
      address: 'Sector 51, Gurugram, Haryana 122001',
      latitude: 28.4285, longitude: 77.0669,
      rating: 4.5, phone: '+91-124-4511111',
      email: 'care@artemishospitals.com', website: 'https://www.artemishospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, Interventional Cardiology', 1600, '08:00 AM - 08:00 PM'),
        link('Neurology', 'Neurosciences, Neuroradiology', 1300, '09:00 AM - 05:00 PM'),
        link('Oncology', 'Cancer Care, Radiation Oncology', 2000, '09:00 AM - 04:00 PM'),
        link('Orthopedics', 'Joint Replacement, Spine Surgery', 1500, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'GI Sciences, Hepatology', 1100, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Preventive Care', 800, '09:00 AM - 08:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },

    // ===== CENTRAL DELHI =====
    {
      name: 'Ram Manohar Lohia Hospital',
      address: 'Baba Kharak Singh Marg, New Delhi, Delhi 110001',
      latitude: 28.6287, longitude: 77.2032,
      rating: 4.0, phone: '+91-11-23365525',
      email: 'rml.delhi@nic.in', website: 'http://rml.nic.in',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'Internal Medicine, OPD Services', 50, '09:00 AM - 01:00 PM'),
        link('Cardiology', 'Cardiology, Cardiac OPD', 100, '09:00 AM - 01:00 PM'),
        link('Orthopedics', 'Orthopedics, Trauma', 50, '09:00 AM - 01:00 PM'),
        link('Emergency Medicine', 'Emergency, Casualty, Trauma', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Mool Chand Hospital',
      address: 'Lajpat Nagar III, New Delhi, Delhi 110024',
      latitude: 28.5712, longitude: 77.2347,
      rating: 4.3, phone: '+91-11-42000000',
      email: 'info@moolchandhospital.com', website: 'https://www.moolchandhospital.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiac Sciences, Heart Surgery', 1200, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'Hepato-Biliary Surgery, GI Endoscopy', 1000, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Joint Replacement, Spine', 1100, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 600, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency, Trauma', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Holy Family Hospital',
      address: 'Okhla Road, New Delhi, Delhi 110025',
      latitude: 28.5512, longitude: 77.2710,
      rating: 4.2, phone: '+91-11-29840000',
      email: 'hfh@holyfamilyhospital.org', website: 'https://www.holyfamilyhospital.org',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('General Medicine', 'Internal Medicine, Outpatient Services', 700, '09:00 AM - 05:00 PM'),
        link('Gynecology', 'Maternity, Reproductive Health, Infertility', 900, '09:00 AM - 05:00 PM'),
        link('Pediatrics', 'Child Health, PICU, Immunization', 700, '09:00 AM - 05:00 PM'),
        link('Orthopedics', 'Orthopedics, Physiotherapy', 800, '09:00 AM - 05:00 PM'),
        link('Emergency Medicine', 'Emergency, Critical Care', 0, '24 Hours Open'),
      ],
    },

    // ===== SOUTH DELHI =====
    {
      name: 'Rockland Hospital (Dwarka)',
      address: 'Plot No. 1, Sector 7, Dwarka, New Delhi, Delhi 110075',
      latitude: 28.5919, longitude: 77.0633,
      rating: 4.1, phone: '+91-11-45501111',
      email: 'info@rocklandhospitals.com', website: 'https://www.rocklandhospitals.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Echocardiography, Holter', 900, '09:00 AM - 06:00 PM'),
        link('Orthopedics', 'Orthopedics, Arthroscopy', 1000, '09:00 AM - 06:00 PM'),
        link('General Medicine', 'Internal Medicine, Chronic Disease', 500, '09:00 AM - 07:00 PM'),
        link('Gynecology', 'Maternity, Women Health, Laparoscopy', 800, '09:00 AM - 05:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Pushpawati Singhania Hospital',
      address: 'Press Enclave Road, Sheikh Sarai Phase 2, New Delhi, Delhi 110017',
      latitude: 28.5218, longitude: 77.2178,
      rating: 4.3, phone: '+91-11-42776000',
      email: 'info@pshrc.com', website: 'https://www.pshrc.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Gastroenterology', 'Gastroenterology, Hepatology, GI Endoscopy', 1100, '09:00 AM - 05:00 PM'),
        link('Cardiology', 'Cardiology, Cardiac Surgery', 1200, '09:00 AM - 06:00 PM'),
        link('Nephrology', 'Nephrology, Kidney Transplant, Dialysis', 1300, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, Outpatient', 700, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency Services', 0, '24 Hours Open'),
      ],
    },

    // ===== WEST DELHI =====
    {
      name: 'Sant Parmanand Hospital',
      address: '18, Sham Nath Marg, Civil Lines, Delhi, Delhi 110054',
      latitude: 28.6739, longitude: 77.2275,
      rating: 4.1, phone: '+91-11-23978888',
      email: 'info@santparmanand.in', website: 'https://www.santparmanand.in',
      workingHours: '09:00 AM - 08:00 PM', emergencyAvailable: true,
      specialtyLinks: [
        link('Orthopedics', 'Joint Replacement, Fractures, Sports', 900, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 500, '09:00 AM - 07:00 PM'),
        link('Pediatrics', 'Child Health, Vaccination, Newborn Care', 600, '09:00 AM - 05:00 PM'),
      ],
    },
    {
      name: 'Batra Hospital & Medical Research Centre',
      address: '1, Tughlakabad Institutional Area, Mehrauli-Badarpur Road, New Delhi, Delhi 110062',
      latitude: 28.5106, longitude: 77.2664,
      rating: 4.2, phone: '+91-11-29958747',
      email: 'batrahospital@gmail.com', website: 'https://www.batrahospital.com',
      workingHours: '24 Hours Open', emergencyAvailable: true,
      specialtyLinks: [
        link('Cardiology', 'Cardiology, Cardiac Surgery, Cath Lab', 1100, '09:00 AM - 06:00 PM'),
        link('Orthopedics', 'Orthopedics, Joint Replacement, Spine', 1000, '09:00 AM - 06:00 PM'),
        link('Gastroenterology', 'GI Sciences, Liver Diseases, Bariatric', 900, '09:00 AM - 05:00 PM'),
        link('General Medicine', 'Internal Medicine, General Consultation', 600, '09:00 AM - 07:00 PM'),
        link('Emergency Medicine', 'Emergency, Trauma Center', 0, '24 Hours Open'),
      ],
    },
    {
      name: 'Mahajan Imaging & Labs',
      address: 'W-3 Greater Kailash 1, New Delhi, Delhi 110048',
      latitude: 28.5397, longitude: 77.2311,
      rating: 4.5, phone: '+91-11-30413041',
      email: 'info@mahajanimaging.in', website: 'https://www.mahajanimaging.in',
      workingHours: '08:00 AM - 08:00 PM', emergencyAvailable: false,
      specialtyLinks: [
        link('Radiology', 'MRI, CT Scan, PET-CT, Mammography', 1200, '08:00 AM - 08:00 PM'),
      ],
    },
  ];

  // Insert all hospitals
  let hospitalCount = 0;
  for (const h of hospitals) {
    try {
      const created = await prisma.hospital.create({
        data: {
          name: h.name,
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          rating: h.rating,
          phone: h.phone,
          email: h.email,
          website: h.website,
          workingHours: h.workingHours,
          emergencyAvailable: h.emergencyAvailable,
        },
      });
      
      for (const link of h.specialtyLinks) {
        if (!link.specialtyId) {
          console.warn(`Skipping unknown specialty link for ${h.name}`);
          continue;
        }
        await prisma.hospitalSpecialty.create({
          data: {
            hospitalId: created.id,
            specialtyId: link.specialtyId,
            departments: link.departments,
            averageCost: link.averageCost,
            opdTimings: link.opdTimings,
          },
        });
      }
      hospitalCount++;
      console.log(`  ✅ ${h.name}`);
    } catch (err: any) {
      console.error(`  ❌ Failed ${h.name}: ${err.message}`);
    }
  }

  console.log(`\n🏥 Seeded ${hospitalCount} hospitals successfully!`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
