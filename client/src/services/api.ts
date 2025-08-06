import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    businessInfo?: any;
    artistInfo?: any;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: any) => api.put('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  refreshToken: () => api.post('/auth/refresh'),

  logout: () => api.post('/auth/logout'),
};

// Music API
export const musicApi = {
  getMusic: (params?: {
    page?: number;
    limit?: number;
    genre?: string;
    search?: string;
    businessType?: string;
  }) => api.get('/music', { params }),

  getMusicById: (id: string) => api.get(`/music/${id}`),

  uploadMusic: (formData: FormData) =>
    api.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateMusic: (id: string, data: any) => api.put(`/music/${id}`, data),

  deleteMusic: (id: string) => api.delete(`/music/${id}`),

  getMusicAnalytics: (id: string) => api.get(`/music/${id}/analytics`),
};

// Royalty API
export const royaltyApi = {
  recordPlay: (data: {
    musicId: string;
    playType?: string;
    duration?: number;
    location?: any;
    deviceInfo?: any;
  }) => api.post('/royalty/play', data),

  getTransactions: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    musicId?: string;
  }) => api.get('/royalty/transactions', { params }),

  getSummary: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/royalty/summary', { params }),

  getEarnings: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
  }) => api.get('/royalty/earnings', { params }),

  processPayment: (transactionIds: string[], paymentMethod?: string) =>
    api.post('/royalty/process-payment', { transactionIds, paymentMethod }),

  getLMKReport: (params?: {
    startDate?: string;
    endDate?: string;
    reportingStatus?: string;
  }) => api.get('/royalty/lmk-report', { params }),
};

// Business API
export const businessApi = {
  getLicense: () => api.get('/business/license'),

  applyForLicense: (data: any) => api.post('/business/license/apply', data),

  getBusinessUsers: (params?: {
    page?: number;
    limit?: number;
    businessType?: string;
    licenseStatus?: string;
  }) => api.get('/business/users', { params }),

  approveLicense: (userId: string) =>
    api.post(`/business/license/${userId}/approve`),

  suspendLicense: (userId: string, reason: string) =>
    api.post(`/business/license/${userId}/suspend`, { reason }),

  getCompliance: () => api.get('/business/compliance'),

  updateBusinessInfo: (data: any) => api.put('/business/info', data),
};

// Playlist API
export const playlistApi = {
  getPlaylists: (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => api.get('/playlists', { params }),

  createPlaylist: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    businessType?: string;
    mood?: string[];
    tags?: string[];
  }) => api.post('/playlists', data),

  getPlaylistById: (id: string) => api.get(`/playlists/${id}`),

  updatePlaylist: (id: string, data: any) => api.put(`/playlists/${id}`, data),

  deletePlaylist: (id: string) => api.delete(`/playlists/${id}`),

  addToPlaylist: (playlistId: string, musicId: string) =>
    api.post(`/playlists/${playlistId}/add`, { musicId }),

  removeFromPlaylist: (playlistId: string, musicId: string) =>
    api.delete(`/playlists/${playlistId}/remove/${musicId}`),

  getBusinessPlaylists: (businessType: string) =>
    api.get(`/playlists/business/${businessType}`),
};

// Reports API
export const reportsApi = {
  getRoyaltyReport: (params: {
    startDate: string;
    endDate: string;
    type?: 'business' | 'artist' | 'admin';
    format?: 'json' | 'csv' | 'pdf';
  }) => api.get('/reports/royalty', { params }),

  getBusinessReport: (params: {
    startDate: string;
    endDate: string;
    businessId?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => api.get('/reports/business', { params }),

  getArtistReport: (params: {
    startDate: string;
    endDate: string;
    artistId?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => api.get('/reports/artist', { params }),

  getLMKComplianceReport: (params: {
    startDate: string;
    endDate: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => api.get('/reports/lmk-compliance', { params }),

  downloadReport: (reportId: string) => api.get(`/reports/download/${reportId}`),
};

export default api;