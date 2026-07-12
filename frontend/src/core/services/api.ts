import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL) {
  throw new Error('[Pulse] VITE_API_URL is not set. All API calls will fail. Please add it to your .env file.');
}

export const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for large mobile uploads and OCR processing
});


// Automatic JWT Token Injection Middleware
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulse_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for 401 and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('pulse_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, { refreshToken });
          if (res.data.token) {
            localStorage.setItem('pulse_token', res.data.token);
            if (res.data.user) {
              localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
            
            processQueue(null, res.data.token);
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          processQueue(refreshError, null);
          
          // Only hard-logout if the refresh token is truly rejected (401 or 403)
          if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
            localStorage.removeItem('pulse_token');
            localStorage.removeItem('pulse_refresh_token');
            localStorage.removeItem('pulse_user');
            if (!window.location.pathname.match(/\/login|\/register/)) {
              window.location.href = '/login?expired=true';
            }
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('pulse_token');
        localStorage.removeItem('pulse_user');
        if (!window.location.pathname.match(/\/login|\/register/)) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
      }
    }
    
    // Add simple retry logic for network errors (not 4xx errors)
    if (!originalRequest || !originalRequest.retry) {
      originalRequest.retry = 0;
    }
    
    if (originalRequest.retry < 1 && (!error.response || error.response.status >= 500)) {
      originalRequest.retry += 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(originalRequest)), 1000);
      });
    }

    return Promise.reject(error);
  }
);

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
  photoUrl?: string;
  distance?: number;
  specialties: Array<{
    departments: string;
    averageCost: number;
    opdTimings: string;
    specialty: {
      name: string;
      description: string;
    };
  }>;
}

export interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
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

export interface HealthInsight {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  createdAt: string;
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  avatar?: string;
  createdAt: string;
  _count: {
    prescriptions: number;
    medicalReports: number;
  };
}

export const authAPI = {
  login: async (identifier: string, password: string) => {
    const res = await api.post('/api/auth/login', { identifier, password });
    if (res.data.token) {
      localStorage.setItem('pulse_token', res.data.token);
      if (res.data.refreshToken) localStorage.setItem('pulse_refresh_token', res.data.refreshToken);
      localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  sendRegisterOTP: async (email: string) => {
    const res = await api.post('/api/auth/register/send-otp', { email });
    return res.data;
  },
  register: async (name: string, email: string, mobileNumber: string, password: string, code: string) => {
    const res = await api.post('/api/auth/register', { name, email, mobileNumber, password, code });
    if (res.data.token) {
      localStorage.setItem('pulse_token', res.data.token);
      if (res.data.refreshToken) localStorage.setItem('pulse_refresh_token', res.data.refreshToken);
      localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  googleAuth: async (credential: string) => {
    const res = await api.post('/api/auth/google', { credential });
    if (res.data.token) {
      localStorage.setItem('pulse_token', res.data.token);
      if (res.data.refreshToken) localStorage.setItem('pulse_refresh_token', res.data.refreshToken);
      localStorage.setItem('pulse_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  checkMobile: async (mobileNumber: string) => {
    const res = await api.post('/api/auth/check-mobile', { mobileNumber });
    return res.data as { exists: boolean };
  },
  requestEmailOTP: async (email: string) => {
    const res = await api.post('/api/auth/forgot-password/request-email', { email });
    return res.data;
  },
  verifyEmailOTP: async (email: string, code: string) => {
    const res = await api.post('/api/auth/forgot-password/verify-email', { email, code });
    return res.data as { resetToken: string };
  },
  resetPassword: async (data: { newPassword: string; resetToken?: string; firebaseToken?: string }) => {
    const res = await api.post('/api/auth/forgot-password/reset', data);
    return res.data;
  },
  verifyToken: async () => {
    const res = await api.get('/api/auth/me');
    if (res.data) {
      localStorage.setItem('pulse_user', JSON.stringify(res.data));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_refresh_token');
    localStorage.removeItem('pulse_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('pulse_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const hospitalAPI = {
  search: async (query: string, specialty: string, maxDistance: number, lat?: number, lng?: number, city?: string) => {
    const res = await api.get('/api/hospitals', {
      params: { query, specialty, maxDistance, lat, lng, city },
    });
    return res.data.data as Hospital[];
  },
  autocomplete: async (q: string, lat?: number, lng?: number, city?: string) => {
    const res = await api.get('/api/hospitals/autocomplete', {
      params: { q, lat, lng, city },
    });
    return res.data as { hospitals: Array<{ id: string; name: string }>; specialties: Array<{ name: string }> };
  },
  getById: async (id: string, lat?: number, lng?: number, specialty?: string) => {
    const res = await api.get(`/api/hospitals/${id}`, {
      params: { lat, lng, specialty }
    });
    return res.data as Hospital;
  },
  compare: async (ids: string[], lat?: number, lng?: number) => {
    const res = await api.get(`/api/hospitals/compare`, {
      params: { ids: ids.join(','), lat, lng },
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
  getSaved: async (lat?: number, lng?: number) => {
    const res = await api.get('/api/hospitals/saved', {
      params: { lat, lng }
    });
    return res.data as Hospital[];
  },
  getReviews: async (id: string, page: number = 1, limit: number = 10) => {
    const res = await api.get(`/api/hospitals/${id}/reviews`, {
      params: { page, limit }
    });
    return res.data as { reviews: Review[], pagination: { total: number, page: number, pages: number } };
  },
  postReview: async (id: string, rating: number, reviewText: string) => {
    const res = await api.post(`/api/hospitals/${id}/reviews`, { rating, reviewText });
    return res.data as Review;
  },
  addHospital: async (data: any) => {
    const res = await api.post('/api/hospitals', data);
    return res.data as Hospital;
  },
};

export const geocodingAPI = {
  geocode: async (params: { street?: string; city?: string; state?: string; pincode?: string; q?: string }) => {
    const res = await api.get('/api/geocoding/geocode', { params });
    return res.data as {
      latitude: number;
      longitude: number;
      label: string;
      city: string;
      state: string;
    };
  },
};

export const prescriptionAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30 seconds for uploads
    });
    return res.data as Prescription;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/prescriptions/${id}/verify`, { verifiedData }, {
      timeout: 60000, // 60 seconds for detailed AI analysis
    });
    return res.data as Prescription;
  },
  getAll: async () => {
    const res = await api.get('/api/prescriptions');
    return res.data.data as Prescription[];
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/prescriptions/${id}`);
    return res.data as Prescription;
  },
  // BUG-20 FIX
  delete: async (id: string) => {
    const res = await api.delete(`/api/prescriptions/${id}`);
    return res.data;
  },
  checkInteractions: async () => {
    const res = await api.get<{ interactions: string; severity: string; medicinesChecked: number }>('/api/prescriptions/interactions');
    return res.data;
  }
};

export const reportAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30 seconds for uploads
    });
    return res.data as MedicalReport;
  },
  verify: async (id: string, verifiedData: any) => {
    const res = await api.post(`/api/reports/${id}/verify`, { verifiedData }, {
      timeout: 60000,
    });
    return res.data as MedicalReport;
  },
  getAll: async (page = 1, limit = 10) => {
    const res = await api.get(`/api/reports?page=${page}&limit=${limit}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/api/reports/${id}`);
    return res.data as MedicalReport;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/api/reports/${id}`);
    return res.data;
  },
  getRiskAssessment: async () => {
    const res = await api.get<{ score: number; summary: string; biomarkersAnalyzed: number }>('/api/reports/risk-assessment');
    return res.data;
  }
};

export const trendAPI = {
  getTrends: async () => {
    const res = await api.get('/api/trends');
    return res.data as HealthTrend[];
  },
  getInsights: async () => {
    const res = await api.get('/api/trends/insights');
    return res.data as HealthInsight[];
  },
};

export const notificationAPI = {
  getAll: async () => {
    const res = await api.get('/api/notifications');
    return res.data as Notification[];
  },
  getUnreadCount: async () => {
    const res = await api.get('/api/notifications/unread-count');
    return res.data.count as number;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch('/api/notifications/read-all');
    return res.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data as AdminStats;
  },
};

export const userAPI = {
  getProfile: async () => {
    const res = await api.get('/api/user/profile');
    return res.data as UserProfile;
  },
  updateProfile: async (data: { name?: string }) => { // BUG-10: email no longer updated directly
    const res = await api.patch('/api/user/profile', data);
    return res.data;
  },
  // BUG-10 FIX: Step 1 — request OTP to the new email address
  requestEmailChange: async (newEmail: string) => {
    const res = await api.post('/api/user/request-email-change', { newEmail });
    return res.data as { message: string };
  },
  // BUG-10 FIX: Step 2 — submit the OTP to confirm and apply the email change
  confirmEmailChange: async (newEmail: string, code: string) => {
    const res = await api.post('/api/user/confirm-email-change', { newEmail, code });
    return res.data as { message: string; user: any };
  },
  changePassword: async (data: any) => {
    const res = await api.post('/api/user/change-password', data);
    return res.data;
  },
  deleteAccount: async () => {
    const res = await api.delete('/api/user/account');
    return res.data;
  },
};

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  createdAt: string;
}

export const emergencyAPI = {
  getContacts: async () => {
    const res = await api.get('/api/emergency/contacts');
    return res.data as EmergencyContact[];
  },
  addContact: async (data: { name: string; phoneNumber: string; relationship: string }) => {
    const res = await api.post('/api/emergency/contacts', data);
    return res.data as EmergencyContact;
  },
  deleteContact: async (id: string) => {
    const res = await api.delete(`/api/emergency/contacts/${id}`);
    return res.data;
  },
  triggerPanic: async (lat?: number, lng?: number) => {
    const res = await api.post('/api/emergency/panic', { lat, lng });
    return res.data as { message: string, results: any[], simulated: boolean };
  },
};

export const chatAPI = {
  getHistory: async () => {
    const res = await api.get('/api/chat/history');
    return res.data as Array<{ id: string; role: 'user' | 'model'; content: string; createdAt: string }>;
  },
  clearHistory: async () => {
    const res = await api.delete('/api/chat/history');
    return res.data;
  }
};
