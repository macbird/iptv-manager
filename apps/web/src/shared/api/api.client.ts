import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const isAdminRoute = url.startsWith('/admin');
  const token = isAdminRoute
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
