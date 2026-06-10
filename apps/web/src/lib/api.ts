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
  login: (tenantCode: string, email: string, password: string) =>
    api.post('/v1/auth/login', { tenantCode, email, password }).then((r) => r.data),
  me: () => api.get('/v1/auth/me').then((r) => r.data),
};

// ── AHSP ─────────────────────────────────────────────────────────────────────
export const ahspApi = {
  list: (params?: Record<string, string>) =>
    api.get('/v1/ahsp', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/ahsp/${id}`).then((r) => r.data),
  create: (payload: any) => api.post('/v1/ahsp', payload).then((r) => r.data),
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
  create: (payload: any) => api.post('/v1/projects', payload).then((r) => r.data),
  wbsTree: (id: string) => api.get(`/v1/projects/${id}/wbs`).then((r) => r.data),
  createWBS: (projectId: string, payload: any) =>
    api.post(`/v1/projects/${projectId}/wbs`, payload).then((r) => r.data),
};

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const jobApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/jobs', { params }).then((r) => r.data),
  myJobs: (params?: Record<string, any>) =>
    api.get('/v1/jobs/my', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/jobs/${id}`).then((r) => r.data),
  create: (payload: any) => api.post('/v1/jobs', payload).then((r) => r.data),
  assign: (id: string, payload: any) =>
    api.post(`/v1/jobs/${id}/assign`, payload).then((r) => r.data),
  submit: (id: string, payload: any) =>
    api.post(`/v1/jobs/${id}/submit`, payload).then((r) => r.data),
  transition: (id: string, payload: any) =>
    api.patch(`/v1/jobs/${id}/status`, payload).then((r) => r.data),
  auditTrail: (id: string) =>
    api.get(`/v1/jobs/${id}/audit-trail`).then((r) => r.data),
};

// ── RAB/RAP ──────────────────────────────────────────────────────────────────
export const rabRapApi = {
  listVersions: (projectId: string) =>
    api.get(`/v1/budget/projects/${projectId}/versions`).then((r) => r.data),
  createVersion: (payload: any) =>
    api.post('/v1/budget/versions', payload).then((r) => r.data),
  getVersion: (id: string) =>
    api.get(`/v1/budget/versions/${id}`).then((r) => r.data),
  addLines: (versionId: string, payload: any) =>
    api.post(`/v1/budget/versions/${versionId}/lines`, payload).then((r) => r.data),
  getSummary: (projectId: string) =>
    api.get(`/v1/budget/projects/${projectId}/summary`).then((r) => r.data),
};

// ── NCR ───────────────────────────────────────────────────────────────────────
export const ncrApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/ncrs', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/ncrs/${id}`).then((r) => r.data),
  create: (payload: any) => api.post('/v1/ncrs', payload).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.patch(`/v1/ncrs/${id}`, payload).then((r) => r.data),
  transition: (id: string, toStatus: string, note?: string) =>
    api.patch(`/v1/ncrs/${id}/status`, { toStatus, note }).then((r) => r.data),
};

// ── RFI ───────────────────────────────────────────────────────────────────────
export const rfiApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/rfis', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/rfis/${id}`).then((r) => r.data),
  create: (payload: any) => api.post('/v1/rfis', payload).then((r) => r.data),
  issue: (id: string) => api.post(`/v1/rfis/${id}/issue`).then((r) => r.data),
  respond: (id: string, payload: any) =>
    api.post(`/v1/rfis/${id}/respond`, payload).then((r) => r.data),
  close: (id: string) => api.patch(`/v1/rfis/${id}/close`).then((r) => r.data),
};

// ── Progress Claims ───────────────────────────────────────────────────────────
export const claimApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/progress-claims', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/progress-claims/${id}`).then((r) => r.data),
  create: (payload: any) =>
    api.post('/v1/progress-claims', payload).then((r) => r.data),
  transition: (id: string, toStatus: string) =>
    api.patch(`/v1/progress-claims/${id}/status`, { toStatus }).then((r) => r.data),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/documents', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/documents/${id}`).then((r) => r.data),
  create: (payload: any) =>
    api.post('/v1/documents', payload).then((r) => r.data),
  addVersion: (id: string, payload: any) =>
    api.post(`/v1/documents/${id}/versions`, payload).then((r) => r.data),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/v1/analytics/dashboard').then((r) => r.data),
  evm: (projectId: string) =>
    api.get(`/v1/analytics/projects/${projectId}/evm`).then((r) => r.data),
  budgetVsActual: (projectId: string) =>
    api.get(`/v1/analytics/projects/${projectId}/budget-vs-actual`).then((r) => r.data),
};

// ── Daily Logs ────────────────────────────────────────────────────────────────
export const dailyLogApi = {
  list: (params?: Record<string, any>) =>
    api.get('/v1/daily-logs', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/v1/daily-logs/${id}`).then((r) => r.data),
  create: (payload: any) =>
    api.post('/v1/daily-logs', payload).then((r) => r.data),
  update: (id: string, payload: any) =>
    api.patch(`/v1/daily-logs/${id}`, payload).then((r) => r.data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: (unread?: boolean) =>
    api.get('/v1/notifications', { params: unread ? { unread: 'true' } : {} }).then((r) => r.data),
  markRead: (id: string) =>
    api.patch(`/v1/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () =>
    api.patch('/v1/notifications/read-all').then((r) => r.data),
};

// ── Master Data ───────────────────────────────────────────────────────────────
export const masterDataApi = {
  regions: () => api.get('/v1/master-data/regions').then((r) => r.data),
  hsd: (params?: Record<string, any>) =>
    api.get('/v1/master-data/hsd', { params }).then((r) => r.data),
  taxRates: () => api.get('/v1/master-data/tax-rates').then((r) => r.data),
};
