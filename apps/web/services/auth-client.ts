'use client';

import { apiBaseUrl } from '../lib/environment';

const TOKEN_KEY = 'hktstore:access_token';
const ROLE_KEY = 'hktstore:role';
const USER_KEY = 'hktstore:user_label';
const SESSION_HINT_KEY = 'hktstore:session';

// Khởi tạo giá trị ban đầu từ localStorage nếu có
const getStored = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

let accessToken: string | null = getStored(TOKEN_KEY);
let currentRole: string | null = getStored(ROLE_KEY);
let currentUserLabel: string | null = getStored(USER_KEY);
let bootstrapPromise: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export const getAccessToken = (): string | null => accessToken;
export const getCurrentRole = (): string | null => currentRole;
export const getCurrentUserLabel = (): string | null => currentUserLabel;

export const subscribeAuth = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyAuth = (): void => listeners.forEach((listener) => listener());

const hasSessionHint = (): boolean =>
  typeof window !== 'undefined' &&
  (window.localStorage.getItem(SESSION_HINT_KEY) === '1' || Boolean(window.localStorage.getItem(TOKEN_KEY)));

const saveSession = (token?: string | null, role?: string | null, userLabel?: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  if (role) window.localStorage.setItem(ROLE_KEY, role);
  if (userLabel) window.localStorage.setItem(USER_KEY, userLabel);
  window.localStorage.setItem(SESSION_HINT_KEY, '1');
};

const clearSessionStorage = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(SESSION_HINT_KEY);
};

export const clearAccessToken = (): void => {
  accessToken = null;
  currentRole = null;
  currentUserLabel = null;
  clearSessionStorage();
  notifyAuth();
};

export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

const request = async (path: string, init: RequestInit = {}) => {
  const currentToken = accessToken || getStored(TOKEN_KEY);
  const authHeaders: Record<string, string> = currentToken
    ? { Authorization: `Bearer ${currentToken}` }
    : {};

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...authHeaders,
      ...init.headers,
    },
  });

  const body: unknown = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const errorBody = body as {
      error?: { code?: string; message?: string; fields?: Record<string, string[]> };
    } | null;
    throw new AuthApiError(
      errorBody?.error?.code ?? 'REQUEST_FAILED',
      errorBody?.error?.message ?? 'Yêu cầu không thành công.',
      errorBody?.error?.fields,
    );
  }
  return body as {
    data?: {
      accessToken?: string;
      user?: {
        role?: string;
        fullName?: string;
        username?: string;
        email?: string;
        phone?: string;
      };
    };
  } | null;
};

export const authenticate = async (
  path: '/auth/login' | '/auth/admin/login' | '/auth/register',
  payload: object,
): Promise<void> => {
  const result = await request(path, { method: 'POST', body: JSON.stringify(payload) });
  accessToken = result?.data?.accessToken ?? null;
  currentRole = result?.data?.user?.role ?? null;
  currentUserLabel = result?.data?.user?.fullName ?? result?.data?.user?.username ?? null;

  if (accessToken) {
    saveSession(accessToken, currentRole, currentUserLabel);
  }

  notifyAuth();
};

export const bootstrapSession = (): Promise<boolean> => {
  // Đồng bộ lại dữ liệu từ localStorage vào bộ nhớ nếu có
  if (typeof window !== 'undefined') {
    accessToken = accessToken || getStored(TOKEN_KEY);
    currentRole = currentRole || getStored(ROLE_KEY);
    currentUserLabel = currentUserLabel || getStored(USER_KEY);
  }

  if (!hasSessionHint() && !accessToken) {
    return Promise.resolve(false);
  }

  // Nếu trong localStorage đã có sẵn token, lập tức xác thực thành công để F5 không bị out
  if (accessToken) {
    notifyAuth();
  }

  bootstrapPromise ??= (async () => {
    try {
      const result = await request('/auth/refresh', {
        method: 'POST',
        headers: { 'X-HKTStore-Client': 'web' },
      });

      if (result?.data?.accessToken) {
        accessToken = result.data.accessToken;
        currentRole = result.data.user?.role ?? currentRole;
        currentUserLabel =
          result.data.user?.fullName ?? result.data.user?.username ?? currentUserLabel;
        saveSession(accessToken, currentRole, currentUserLabel);
        notifyAuth();
      }
      return true;
    } catch {
      // Nếu API refresh lỗi nhưng localStorage vẫn còn token, vẫn giữ phiên làm việc cho user
      if (accessToken) {
        return true;
      }
      clearAccessToken();
      return false;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
};

export const logout = async (): Promise<void> => {
  try {
    await request('/auth/logout', { method: 'POST', headers: { 'X-HKTStore-Client': 'web' } });
  } finally {
    clearAccessToken();
  }
};

export const forgotPassword = (email: string) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const verifyOtp = (email: string, otp: string) =>
  request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });

export const resetPassword = (resetToken: string, newPassword: string) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
  });

export const replaceSession = (token: string, role: string): void => {
  accessToken = token;
  currentRole = role;
  currentUserLabel = null;
  saveSession(token, role, null);
  notifyAuth();
};