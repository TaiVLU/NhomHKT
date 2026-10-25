import { bootstrapSession, getAccessToken, replaceSession } from './auth-client';
import { apiBaseUrl } from '../lib/environment';

export class AccountApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
const call = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  if (!getAccessToken() && !(await bootstrapSession()))
    throw new AccountApiError('AUTH_UNAUTHORIZED');
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      authorization: `Bearer ${getAccessToken() ?? ''}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  const body =
    response.status === 204
      ? null
      : ((await response.json()) as {
          data?: T;
          error?: { code?: string };
        });
  if (!response.ok) throw new AccountApiError(body?.error?.code ?? 'ACCOUNT_REQUEST_FAILED');
  return body?.data as T;
};

export interface ProfileDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  birthday: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  status: string;
  createdAt: string;
}
export interface AddressDto {
  id: string;
  recipientName: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
export const accountApi = {
  profile: () => call<ProfileDto>('/me/profile'),
  updateProfile: (body: object) =>
    call<ProfileDto>('/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  addresses: () => call<AddressDto[]>('/me/addresses'),
  createAddress: (body: object) =>
    call<AddressDto>('/me/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id: string, body: object) =>
    call<AddressDto>(`/me/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAddress: (id: string) => call<null>(`/me/addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id: string) => call<AddressDto>(`/me/addresses/${id}/default`, { method: 'PUT' }),
  changePassword: async (currentPassword: string, newPassword: string) => {
    const data = await call<{ accessToken: string; user: { role: string } }>('/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    replaceSession(data.accessToken, data.user.role);
  },
};
