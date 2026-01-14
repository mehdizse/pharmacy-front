export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status: number;
  error?: any;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  observe?: 'body' | 'response' | 'events';
  responseType?: 'json' | 'text' | 'blob';
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    REFRESH: '/api/auth/refresh/',
    USER: '/api/auth/user/',
    REGISTER: '/api/auth/register/'
  },
  SUPPLIERS: {
    LIST: '/api/suppliers/',
    DETAIL: (id: number) => `/api/suppliers/${id}/`,
    CREATE: '/api/suppliers/',
    UPDATE: (id: number) => `/api/suppliers/${id}/`,
    DELETE: (id: number) => `/api/suppliers/${id}/`
  },
  INVOICES: {
    LIST: '/api/invoices/',
    DETAIL: (id: number) => `/api/invoices/${id}/`,
    CREATE: '/api/invoices/',
    UPDATE: (id: number) => `/api/invoices/${id}/`,
    DELETE: (id: number) => `/api/invoices/${id}/`,
    ITEMS: (id: number) => `/api/invoices/${id}/items/`
  },
  CREDIT_NOTES: {
    LIST: '/api/credit-notes/',
    DETAIL: (id: number) => `/api/credit-notes/${id}/`,
    CREATE: '/api/credit-notes/',
    UPDATE: (id: number) => `/api/credit-notes/${id}/`,
    DELETE: (id: number) => `/api/credit-notes/${id}/`
  },
  REPORTS: {
    DASHBOARD: '/api/reports/dashboard/',
    MONTHLY: '/api/reports/monthly/',
    SUPPLIER_BREAKDOWN: '/api/reports/supplier-breakdown/'
  }
};
