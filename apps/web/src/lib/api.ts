import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/v1/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/v1/auth/me').then((r) => r.data),
};

// ── AHSP ─────────────────────────────────────────────────────────────────────
export const ahspApi = {
  list: (params?: Record<string, string>) =>
    api.get('/v1/ahsp', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/ahsp/${id}`).then((r) => r.data),
  calculate: (payload: {
    ahspItemId: string;
    regionCode: string;
    calculationDate?: string;
    overheadPct?: number;
    profitPct?: number;
  }) => api.post('/v1/ahsp/calculate', payload).then((r) => r.data),
};

// ── Tax ───────────────────────────────────────────────────────────────────────
export const taxApi = {
  rates: (effectiveDate?: string) =>
    api.get('/v1/tax/rates', { params: effectiveDate ? { effectiveDate } : {} }).then((r) => r.data),
  calculateProgressClaim: (payload: {
    dpp: number;
    taxRateCode: string;
    transactionDate?: string;
    recoupmentPct?: number;
    retentionPct?: number;
  }) => api.post('/v1/tax/progress-claim', payload).then((r) => r.data),
};

// ── Projects ─────────────────────────────────────────────────────────────────
export const projectApi = {
  list: () => api.get('/v1/projects').then((r) => r.data),
  get: (id: string) => api.get(`/v1/projects/${id}`).then((r) => r.data),
  wbsTree: (id: string) => api.get(`/v1/projects/${id}/wbs`).then((r) => r.data),
};

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const jobApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/jobs', { params }).then((r) => r.data),
  myJobs: (params?: Record<string, any>) =>
    api.get('/v1/jobs/my', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/jobs/${id}`).then((r) => r.data),
  create: (payload: any) => api.post('/v1/jobs', payload).then((r) => r.data),
  submit: (id: string, payload: any) =>
    api.post(`/v1/jobs/${id}/submit`, payload).then((r) => r.data),
  transition: (id: string, payload: any) =>
    api.patch(`/v1/jobs/${id}/status`, payload).then((r) => r.data),
  auditTrail: (id: string) =>
    api.get(`/v1/jobs/${id}/audit-trail`).then((r) => r.data),
};
