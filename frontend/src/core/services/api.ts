import axios, { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStorage, KeychainAccess } from '@aparajita/capacitor-secure-storage';
import toast from 'react-hot-toast';

const VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL) {
  throw new Error('[Pulse] VITE_API_URL is not set. All API calls will fail. Please add it to your .env file.');
}

// Sensitive legacy localStorage keys that must never persist in plaintext browser storage
const SENSITIVE_LEGACY_KEYS = [
  'pulse_refresh_token',
  'pulse_token',
  'pulse_user',
  'pulse_chat_cache',
  'pulse_latitude',
  'pulse_longitude',
  'pulse_location_source',
  'pulse_location_label',
  'pulse_city_name',
] as const;

let inMemoryAccessToken: string | null = null;
let inMemoryUser: any | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearSensitiveLocalStorage(): void {
  for (const key of SENSITIVE_LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage unavailability
    }
  }
}

let nativeSecureStorageConfigured = false;

async function ensureNativeSecureStorageConfigured(): Promise<void> {
  if (!Capacitor.isNativePlatform() || nativeSecureStorageConfigured) return;
  try {
    await SecureStorage.setKeyPrefix('pulse_sec_');
    await SecureStorage.setSynchronize(false);
    await SecureStorage.setDefaultKeychainAccess(KeychainAccess.afterFirstUnlockThisDeviceOnly);
    nativeSecureStorageConfigured = true;
  } catch {
    // Best-effort native configuration; do not crash if platform plugin is mocked or partially initialized
  }
}

async function getNativeRefreshToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  await ensureNativeSecureStorageConfigured();
  try {
    const secureVal = await SecureStorage.getItem('pulse_refresh_token');
    if (secureVal) {
      // Ensure any stale legacy plaintext copies are purged
      await Preferences.remove({ key: 'pulse_refresh_token' }).catch(() => {});
      try { localStorage.removeItem('pulse_refresh_token'); } catch {}
      return secureVal;
    }

    // One-time migration from legacy plaintext @capacitor/preferences on native devices
    const prefResult = await Preferences.get({ key: 'pulse_refresh_token' }).catch(() => ({ value: null }));
    if (prefResult?.value) {
      await SecureStorage.setItem('pulse_refresh_token', prefResult.value);
      await Preferences.remove({ key: 'pulse_refresh_token' }).catch(() => {});
      try { localStorage.removeItem('pulse_refresh_token'); } catch {}
      return prefResult.value;
    }

    // One-time migration from legacy localStorage on native devices
    const legacy = (() => {
      try { return localStorage.getItem('pulse_refresh_token'); } catch { return null; }
    })();
    if (legacy) {
      await SecureStorage.setItem('pulse_refresh_token', legacy);
      try { localStorage.removeItem('pulse_refresh_token'); } catch {}
      return legacy;
    }
  } catch {
    // Fail closed on native secure storage errors — never fall back to plaintext storage
  }
  return null;
}

async function setNativeRefreshToken(token: string | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await ensureNativeSecureStorageConfigured();
  try {
    if (token) {
      await SecureStorage.setItem('pulse_refresh_token', token);
      await Preferences.remove({ key: 'pulse_refresh_token' }).catch(() => {});
    } else {
      await SecureStorage.removeItem('pulse_refresh_token');
    }
  } catch {
    // Never fall back to plaintext storage on error
  }
}

export async function clearAllSensitiveStorage(): Promise<void> {
  inMemoryAccessToken = null;
  inMemoryUser = null;
  clearSensitiveLocalStorage();
  if (Capacitor.isNativePlatform()) {
    await ensureNativeSecureStorageConfigured();
    await Promise.allSettled([
      SecureStorage.removeItem('pulse_refresh_token'),
      Preferences.remove({ key: 'pulse_refresh_token' }),
      Preferences.remove({ key: 'pulse_chat_cache' }),
    ]);
  }
}

export const api = axios.create({
  baseURL: VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for large mobile uploads and OCR processing
});


// Automatic JWT Token Injection & Client Platform Header Middleware (in-memory access token)
api.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers['X-Client-Platform'] = Capacitor.isNativePlatform() ? 'native' : 'web';
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
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
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url || '';
      if (requestUrl.includes('/api/auth/refresh') || requestUrl.includes('/api/auth/logout')) {
        return Promise.reject(error);
      }

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

      try {
        const isNative = Capacitor.isNativePlatform();
        const nativeRefreshToken = isNative ? await getNativeRefreshToken() : null;

        if (isNative && !nativeRefreshToken) {
          processQueue(error, null);
          await clearAllSensitiveStorage();
          if (!window.location.pathname.match(/\/login|\/register/)) {
            window.location.href = '/login?expired=true';
          }
          return Promise.reject(error);
        }

        const res = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          isNative ? { refreshToken: nativeRefreshToken } : {},
          {
            withCredentials: true,
            headers: {
              'X-Requested-With': 'PulseClient',
              'X-Client-Platform': isNative ? 'native' : 'web',
            },
          }
        );

        if (res.data.token) {
          inMemoryAccessToken = res.data.token;
          if (isNative && res.data.refreshToken) {
            await setNativeRefreshToken(res.data.refreshToken);
          }
          if (res.data.user) {
            inMemoryUser = res.data.user;
          }
          clearSensitiveLocalStorage();
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;

          processQueue(null, res.data.token);
          return api(originalRequest);
        }

        throw new Error('Refresh response missing access token');
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // Only hard-logout if the refresh token is truly rejected (401, 403)
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          await clearAllSensitiveStorage();
          if (!window.location.pathname.match(/\/login|\/register/)) {
            window.location.href = '/login?expired=true';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
  reviewCount?: number;
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
  publicId?: string | null;
  resourceType?: string | null;
  deliveryType?: string | null;
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
  publicId?: string | null;
  resourceType?: string | null;
  deliveryType?: string | null;
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

/**
 * Safely resolves a medical fileUrl for client viewing/download.
 * Strictly blocks raw public Cloudinary URLs from being loaded directly by the browser.
 * Only permits secure relative backend API proxy routes or verified backend host URLs.
 */
export function resolveFileUrl(fileUrl: string | null | undefined): string {
  if (!fileUrl) return '';

  // Block any raw direct Cloudinary delivery URLs to prevent public exposure
  if (fileUrl.includes('res.cloudinary.com') || fileUrl.includes('api.cloudinary.com')) {
    if (import.meta.env.DEV) {
      console.warn('[Security Warning] Attempted to load raw Cloudinary URL directly in client. Blocked for patient privacy:', fileUrl);
    }
    return '';
  }

  // If already an absolute URL (e.g. backend host)
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  // Valid relative backend API path (e.g. /api/prescriptions/:id/file?token=...)
  const base = VITE_API_URL ? VITE_API_URL.replace(/\/+$/, '') : '';
  return fileUrl.startsWith('/') ? `${base}${fileUrl}` : `${base}/${fileUrl}`;
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
      inMemoryAccessToken = res.data.token;
      inMemoryUser = res.data.user || null;
      if (Capacitor.isNativePlatform() && res.data.refreshToken) {
        await setNativeRefreshToken(res.data.refreshToken);
      }
      clearSensitiveLocalStorage();
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
      inMemoryAccessToken = res.data.token;
      inMemoryUser = res.data.user || null;
      if (Capacitor.isNativePlatform() && res.data.refreshToken) {
        await setNativeRefreshToken(res.data.refreshToken);
      }
      clearSensitiveLocalStorage();
    }
    return res.data;
  },
  googleAuth: async (credential: string) => {
    const res = await api.post('/api/auth/google', { credential });
    if (res.data.token) {
      inMemoryAccessToken = res.data.token;
      inMemoryUser = res.data.user || null;
      if (Capacitor.isNativePlatform() && res.data.refreshToken) {
        await setNativeRefreshToken(res.data.refreshToken);
      }
      clearSensitiveLocalStorage();
    }
    return res.data;
  },
  bootstrapSession: async () => {
    // Migrate/purge any obsolete plaintext sensitive data from localStorage
    const legacyAccess = (() => {
      try { return localStorage.getItem('pulse_token'); } catch { return null; }
    })();
    const isNative = Capacitor.isNativePlatform();
    const nativeRefresh = isNative ? await getNativeRefreshToken() : null;
    clearSensitiveLocalStorage();

    if (!inMemoryAccessToken && legacyAccess) {
      inMemoryAccessToken = legacyAccess;
    }

    if (inMemoryAccessToken) {
      return authAPI.verifyToken();
    }

    if (isNative && !nativeRefresh) {
      return null;
    }

    // Attempt silent session restore via HttpOnly cookie (web) or native Preferences refresh token
    try {
      const res = await axios.post(
        `${api.defaults.baseURL}/api/auth/refresh`,
        isNative ? { refreshToken: nativeRefresh } : {},
        {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'PulseClient',
            'X-Client-Platform': isNative ? 'native' : 'web',
          },
        }
      );
      if (res.data.token) {
        inMemoryAccessToken = res.data.token;
        inMemoryUser = res.data.user || null;
        if (isNative && res.data.refreshToken) {
          await setNativeRefreshToken(res.data.refreshToken);
        }
        return inMemoryUser;
      }
    } catch {
      // No active session
    }
    return null;
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
      inMemoryUser = res.data;
    }
    return res.data;
  },
  logout: async () => {
    try {
      const token = inMemoryAccessToken;
      const isNative = Capacitor.isNativePlatform();
      const nativeRefresh = isNative ? await getNativeRefreshToken() : null;
      await axios.post(
        `${api.defaults.baseURL}/api/auth/logout`,
        nativeRefresh ? { refreshToken: nativeRefresh } : {},
        {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'PulseClient',
            'X-Client-Platform': isNative ? 'native' : 'web',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      ).catch(() => {});
    } finally {
      await clearAllSensitiveStorage();
    }
  },
  logoutAll: async () => {
    try {
      await api.post('/api/auth/logout-all').catch(() => {});
    } finally {
      await clearAllSensitiveStorage();
    }
  },
  getCurrentUser: () => {
    return inMemoryUser;
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
    return res.data as {
      hospitals: Array<{ id: string; name: string }>;
      specialties: Array<{ name: string; category?: string; specialty?: string; isTest?: boolean }>;
    };
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
  deleteAccount: async (reauth?: { password?: string; googleCredential?: string; confirmDeletion?: string }) => {
    const res = await api.delete('/api/user/account', { data: reauth || {} });
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
