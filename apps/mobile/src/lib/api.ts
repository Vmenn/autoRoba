import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (tenantCode: string, email: string, password: string) =>
    api.post('/v1/auth/login', { tenantCode, email, password }).then((r) => r.data),
  me: () => api.get('/v1/auth/me').then((r) => r.data),
};

export const attendanceApi = {
  checkIn: (payload: { projectId: string; latitude: number; longitude: number; selfieUri?: string }) =>
    api.post('/v1/attendance/check-in', payload).then((r) => r.data),
  checkOut: (payload: { latitude: number; longitude: number }) =>
    api.post('/v1/attendance/check-out', payload).then((r) => r.data),
  today: () => api.get('/v1/attendance/today').then((r) => r.data),
  history: (params?: { from?: string; to?: string }) =>
    api.get('/v1/attendance', { params }).then((r) => r.data),
};

export const leaveApi = {
  list: (params?: Record<string, string>) =>
    api.get('/v1/leaves', { params }).then((r) => r.data),
  create: (payload: {
    leaveType: string; startDate: string; endDate: string; reason: string;
  }) => api.post('/v1/leaves', payload).then((r) => r.data),
  cancel: (id: string) => api.patch(`/v1/leaves/${id}/cancel`).then((r) => r.data),
};

export const reimbursementApi = {
  list: (params?: Record<string, string>) =>
    api.get('/v1/reimbursements', { params }).then((r) => r.data),
  create: (payload: {
    category: string; amount: number; description: string; expenseDate: string; receiptUri?: string;
  }) => api.post('/v1/reimbursements', payload).then((r) => r.data),
  get: (id: string) => api.get(`/v1/reimbursements/${id}`).then((r) => r.data),
};

export const taskApi = {
  myJobs: (params?: Record<string, string>) =>
    api.get('/v1/jobs/my', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/jobs/${id}`).then((r) => r.data),
  updateProgress: (id: string, payload: { progressPct: number; notes?: string }) =>
    api.post(`/v1/jobs/${id}/submit`, payload).then((r) => r.data),
  dailyLog: (payload: { projectId: string; logDate: string; workSummary: string; manpowerCount?: number }) =>
    api.post('/v1/daily-logs', payload).then((r) => r.data),
};

export const projectApi = {
  list: () => api.get('/v1/projects').then((r) => r.data),
};
