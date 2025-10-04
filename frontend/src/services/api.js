import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Column API
export const columnApi = {
  getAll: () => api.get('/columns/'),
  getById: (id) => api.get(`/columns/${id}`),
  create: (column) => api.post('/columns/', column),
  update: (id, column) => api.put(`/columns/${id}`, column),
  delete: (id) => api.delete(`/columns/${id}`),
};

// Task API
export const taskApi = {
  getAll: () => api.get('/tasks/'),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (task) => api.post('/tasks/', task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  move: (id, moveData) => api.patch(`/tasks/${id}/move`, moveData),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export default api;
