import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(toApiError(error));
  },
);

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (error.response?.data) {
    const { code, message, details } = error.response.data;
    return new ApiError(error.response.status, code ?? 'unknown', message ?? error.message, details);
  }
  return new ApiError(0, 'network_error', error.message);
}
