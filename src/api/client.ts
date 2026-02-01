import axios from 'axios';

declare global {
  interface Window {
    __ENV__?: {
      API_URL?: string;
      DEFAULT_NAS_IP?: string;
      DEFAULT_NAS_SECRET?: string;
      DEFAULT_NAS_COA_PORT?: string | number;
    };
  }
}

function getRuntimeApiUrl(): string | undefined {
  const apiUrl = window?.__ENV__?.API_URL;
  if (typeof apiUrl !== 'string') return undefined;
  const trimmed = apiUrl.trim();
  return trimmed.length ? trimmed : undefined;
}

const baseURL = getRuntimeApiUrl() ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (import.meta.env.DEV) console.log('Token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        if (currentPath && currentPath !== '/login') {
          localStorage.setItem('redirectTo', currentPath);
        }
      } catch {}
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);