import axios from 'axios';

const api = axios.create({ baseURL: '/', timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const registerUser = (data) => api.post('/auth/register', data);
export const listUsers = () => api.get('/auth/users');
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// Visitors
export const listVisitors   = (params)    => api.get('/visitors', { params });
export const createVisitor  = (data)      => api.post('/visitors', data);
export const searchVisitors = (params)    => api.get('/visitors/search', { params });
export const getVisitor     = (id)        => api.get(`/visitors/${id}`);
export const updateVisitor  = (id, data)  => api.put(`/visitors/${id}`, data);

// Visits
export const createVisit = (data) => api.post('/visits', data);
export const getActiveVisits = () => api.get('/visits/active');

// Gate
export const gateCheckin = (data) => api.post('/gate/checkin', data);
export const gateCheckout = (data) => api.post('/gate/checkout', data);
export const getGateHistory = (params) => api.get('/gate/history', { params });
export const exportGateExcel = (params) => api.get('/gate/export', { params, responseType: 'blob' });

// Reception
export const receptionCheckin = (data) => api.post('/reception/checkin', data);
export const receptionCheckout = (data) => api.post('/reception/checkout', data);
export const getReceptionHistory = (params) => api.get('/reception/history', { params });
export const exportReceptionExcel = (params) => api.get('/reception/export', { params, responseType: 'blob' });

// Reports
export const getReport = (params) => api.get('/reports', { params });
export const getDashboard = () => api.get('/reports/dashboard');
export const exportExcel = (params) => api.get('/reports/export', { params, responseType: 'blob' });
export const exportCSV = (params) => api.get('/reports/export/csv', { params, responseType: 'blob' });

// Signature
export const generateSignatureToken = (visit_id) => api.post('/signature/generate', { visit_id });
export const getSignatureStatus      = (token)    => api.get(`/signature/status/${token}`);
// Public (no auth) — utilisé depuis la page mobile
export const getSignatureInfo        = (token)    => api.get(`/signature/${token}`);
export const submitSignature         = (token, signature) => api.post(`/signature/${token}/sign`, { signature });
