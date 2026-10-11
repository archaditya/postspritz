import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('postspritz_access_token') ||
        localStorage.getItem('sharepostsync_access_token') ||
        localStorage.getItem('pushpost_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken =
          localStorage.getItem('postspritz_refresh_token') ||
          localStorage.getItem('sharepostsync_refresh_token') ||
          localStorage.getItem('pushpost_refresh_token');
        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const newAccessToken = refreshRes.data.data.accessToken;
            localStorage.setItem('postspritz_access_token', newAccessToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          } catch (refreshErr) {
            localStorage.removeItem('postspritz_access_token');
            localStorage.removeItem('postspritz_refresh_token');
            localStorage.removeItem('sharepostsync_access_token');
            localStorage.removeItem('sharepostsync_refresh_token');
            localStorage.removeItem('pushpost_access_token');
            localStorage.removeItem('pushpost_refresh_token');
            window.location.href = '/login?expired=true';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
