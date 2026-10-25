'use client';

import type { ApiSuccess } from '@hktstore/shared';
import { apiBaseUrl } from '../lib/environment';
import { bootstrapSession, getAccessToken } from './auth-client';

export interface AdminOrderListQuery {
  page?: number | undefined;
  pageSize?: number | undefined;
  search?: string | undefined;
  orderStatus?: string | undefined;
  paymentStatus?: string | undefined;
  paymentMethod?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sort?: 'newest' | 'oldest' | 'totalAsc' | 'totalDesc' | undefined;
}

export interface AdminOrderRow {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  customerEmail: string;
  itemCount: number;
  grandTotal: number;
}

export interface AdminOrderDetail {
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  customer: { id: string; fullName: string; email: string; phone: string };
  shippingAddress: {
    recipientName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    province: string;
    postalCode: string | null;
    deliveryNote: string | null;
  };
  items: Array<{
    id: string;
    variantId: string;
    productId: string;
    productName: string;
    productSlug: string;
    variantName: string;
    sku: string;
    image: { url: string; altText: string } | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalQuantity: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    changedByUserId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    createdAt: string;
  }>;
  allowedTransitions: string[];
}

export interface AdminOrderListResult {
  data: AdminOrderRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export class AdminOrdersApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const request = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta?: AdminOrderListResult['meta'] }> => {
  if (!getAccessToken() && !(await bootstrapSession()))
    throw new AdminOrdersApiError(
      'AUTH_UNAUTHORIZED',
      'Vui lòng đăng nhập bằng tài khoản quản trị.',
    );
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      authorization: `Bearer ${getAccessToken() ?? ''}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  const body = (await response.json()) as
    | (ApiSuccess<T> & { meta?: AdminOrderListResult['meta'] })
    | { error?: { code?: string; message?: string } };
  if (!response.ok || !('data' in body)) {
    const error = 'error' in body ? body.error : undefined;
    throw new AdminOrdersApiError(
      error?.code ?? 'ADMIN_ORDERS_REQUEST_FAILED',
      error?.message ?? 'Không thể tải dữ liệu đơn hàng.',
    );
  }
  return body.meta ? { data: body.data, meta: body.meta } : { data: body.data };
};

const queryString = (query: AdminOrderListQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
};

export const adminOrdersApi = {
  list: async (query: AdminOrderListQuery): Promise<AdminOrderListResult> => {
    const normalized = {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      sort: query.sort ?? 'newest',
    };
    const result = await request<AdminOrderRow[]>(`/admin/orders?${queryString(normalized)}`);
    return {
      data: result.data,
      meta: result.meta ?? {
        page: normalized.page,
        pageSize: normalized.pageSize,
        total: result.data.length,
        totalPages: 1,
      },
    };
  },
  detail: async (orderNumber: string): Promise<AdminOrderDetail> =>
    (await request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(orderNumber)}`)).data,
  transition: async (
    orderNumber: string,
    input: {
      targetStatus: string;
      expectedCurrentStatus?: string | undefined;
      note?: string | undefined;
    },
  ): Promise<AdminOrderDetail> =>
    (
      await request<AdminOrderDetail>(
        `/admin/orders/${encodeURIComponent(orderNumber)}/transitions`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      )
    ).data,
};
