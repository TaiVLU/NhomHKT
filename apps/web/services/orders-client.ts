'use client';

import type { ApiSuccess } from '@hktstore/shared';
import { apiBaseUrl } from '../lib/environment';
import { bootstrapSession, getAccessToken } from './auth-client';

export interface OrderSummary {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  productSlug: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetail {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
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
  items: OrderItem[];
  totalQuantity: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  statusHistory: Array<{ status: string; createdAt: string }>;
}

export interface OrderListResult {
  data: OrderSummary[];
  meta: { page: number; pageSize: number; total: number };
}

export class OrdersApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const request = async <T>(path: string): Promise<{ data: T; meta?: OrderListResult['meta'] }> => {
  if (!getAccessToken() && !(await bootstrapSession()))
    throw new OrdersApiError('AUTH_UNAUTHORIZED', 'Vui lòng đăng nhập để xem đơn hàng.');
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: {
      authorization: `Bearer ${getAccessToken() ?? ''}`,
      'content-type': 'application/json',
    },
  });
  const body = (await response.json()) as
    | (ApiSuccess<T> & { meta?: OrderListResult['meta'] })
    | { error?: { code?: string; message?: string } };
  if (!response.ok || !('data' in body)) {
    const error = 'error' in body ? body.error : undefined;
    throw new OrdersApiError(
      error?.code ?? 'ORDERS_REQUEST_FAILED',
      error?.message ?? 'Không thể tải đơn hàng.',
    );
  }
  return body.meta ? { data: body.data, meta: body.meta } : { data: body.data };
};

export const ordersApi = {
  list: async (page = 1, pageSize = 10): Promise<OrderListResult> => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const result = await request<OrderSummary[]>(`/orders?${query.toString()}`);
    return {
      data: result.data,
      meta: result.meta ?? { page, pageSize, total: result.data.length },
    };
  },
  detail: async (orderNumber: string): Promise<OrderDetail> =>
    (await request<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`)).data,
};
