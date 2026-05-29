import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT Token Injection Middleware
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  phone?: string;
  email?: string;
  website?: string;
  workingHours: string;
  emergencyAvailable: boolean;
  recommendationScore: number;
  explanation?: string;
  specialties: Array<{
    departments: string;
    averageCost: number;
    specialty: {
      name: string;
      description: string;
    };
  }>;
}

export interface PrescriptionAnalysis {
  medicineName: string;
  dosage: string;
  instructions: string;
  simplifiedExplanation: string;
  sideEffects: string;
  drugInteractions: string;
}

export interface Prescription {
  id: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  ocrResult?: {
    rawText: string;
    verifiedData?: string;
  };
  prescriptionAnalysis: PrescriptionAnalysis[];
}

export interface MedicalReportValue {
  id: string;
  key: string;
  value: number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  description?: string;
  category: string;
}

export interface SpecialistRecommendation {
  specialtyName: string;
  confidenceScore: number;
  reason: string;
  recommendedHospitalsJson: string; // JSON string of hospitals
}

export interface MedicalReport {
  id: string;
  fileUrl: string;
  reportType: string;
  status: string;
  reportDate: string;
  createdAt: string;
  ocrResult?: {
    rawText: string;
    verifiedData?: string;
  };
  values: MedicalReportValue[];
  summary?: {
    healthSummary: string;
    normalFindingsCount: number;
    abnormalFindingsCount: number;
    overallStatus: string;
  };
  specialists: SpecialistRecommendation[];
}

export interface HealthTrend {
  markerName: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface AdminStats {
  usersCount: number;
  hospitalsCount: number;
  ocrCount: number;
  aiTokens: number;
  aiCost: number;
  errorCount: number;
  usages: Array<{
    id: string;
    feature: string;
    tokensUsed: number;
    processedAt: string;
    user: { name: string; email: string };
  }>;
}

export const authAPI = {
  login: async (email: string, passwordHash: string) => {
    const res = await api.post('/api/auth/login', { email, passwordHash });
    if (res.data.token) {
      localStorage.setItem('pulse_token', res.data.token);
      localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (name: string, email: string, passwordHash: string) => {
    const res = await api.post('/api/auth/register', { name, email, passwordHash });
    if (res.data.token) {
      localStorage.setItem('pulse_token', res.data.token);
      localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('pulse_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const hospitalAPI = {
  search: async (query: string, specialty: string, maxDistance: number, lat?: number, lng?: number) => {
    const res = await api.get('/api/hospitals', {
      params: { query, specialty, maxDistance, lat, lng },
    });
    return res.data as Hospital[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/hospitals/${id}`);
    return res.data as Hospital;
  },
  compare: async (ids: string[]) => {
    const res = await api.get(`/api/hospitals/compare`, {
      params: { ids: ids.join(',') },
    });
    return res.data as Hospital[];
  },
  save: async (id: string) => {
    const res = await api.post(`/api/hospitals/${id}/save`);
    return res.data;
  },
  unsave: async (id: string) => {
    const res = await api.delete(`/api/hospitals/${id}/save`);
    return res.data;
  },
  getSaved: async () => {
    const res = await api.get('/api/hospitals/saved');
    return res.data as Hospital[];
  },
};

export const prescriptionAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as Prescription;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/prescriptions/${id}/verify`, { verifiedData });
    return res.data as Prescription;
  },
  getAll: async () => {
    const res = await api.get('/api/prescriptions');
    return res.data as Prescription[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/prescriptions/${id}`);
    return res.data as Prescription;
  },
};

export const reportAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as MedicalReport;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/reports/${id}/verify`, { verifiedData });
    return res.data as MedicalReport;
  },
  getAll: async () => {
    const res = await api.get('/api/reports');
    return res.data as MedicalReport[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/reports/${id}`);
    return res.data as MedicalReport;
  },
};

export const trendAPI = {
  getTrends: async () => {
    const res = await api.get('/api/trends');
    return res.data as HealthTrend[];
  },
};

export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data as AdminStats;
  },
};
