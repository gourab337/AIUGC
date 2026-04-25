import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const modelsApi = {
  getByType: (type: string) => api.get(`/models/${type}`).then(r => r.data),
  getAll: () => api.get('/models').then(r => r.data),
};

export const scriptApi = {
  generate: (data: Record<string, unknown>) => api.post('/script/generate', data).then(r => r.data),
  getJob: (id: string) => api.get(`/script/jobs/${id}`).then(r => r.data),
};

export const imageApi = {
  generate: (data: Record<string, unknown>) => api.post('/image/generate', data).then(r => r.data),
  getJob: (id: string) => api.get(`/image/jobs/${id}`).then(r => r.data),
};

export const voiceApi = {
  generate: (data: Record<string, unknown>) => api.post('/voice/generate', data).then(r => r.data),
  getJob: (id: string) => api.get(`/voice/jobs/${id}`).then(r => r.data),
};

export const videoApi = {
  generate: (data: Record<string, unknown>) => api.post('/video/generate', data).then(r => r.data),
  getJob: (id: string) => api.get(`/video/jobs/${id}`).then(r => r.data),
};

export const jobsApi = {
  getAll: () => api.get('/jobs').then(r => r.data),
};
