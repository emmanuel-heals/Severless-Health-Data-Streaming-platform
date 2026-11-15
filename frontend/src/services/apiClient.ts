/*
 * Single Axios instance. Request interceptor attaches the Cognito JWT (CI-02);
 * response interceptor handles 401 (session) and 403 (authorization) centrally.
 * All payloads are JSON/UTF-8 (CI-04).
 */
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { authService } from './authService';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await authService.getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

/** Normalized error shape consumed by forms and toasts. */
export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  status?: number;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ code?: string; message?: string; fieldErrors?: Record<string, string> }>) => {
    const status = error.response?.status;

    // 401: session invalid/expired or account deactivated (FR-008). Force re-auth.
    if (status === 401) {
      await authService.signOut();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const data = error.response?.data;
    const apiError: ApiError = {
      code: data?.code ?? (status ? `HTTP_${status}` : 'NETWORK_ERROR'),
      message: data?.message ?? defaultMessage(status),
      fieldErrors: data?.fieldErrors,
      status,
    };
    return Promise.reject(apiError);
  },
);

function defaultMessage(status?: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid.';
    case 403:
      return 'You are not authorized to perform this action.';
    case 404:
      return 'Not found.';
    case 429:
      return 'Too many requests. Please slow down.';
    case 500:
    case 502:
    case 503:
      return 'Service temporarily unavailable. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
