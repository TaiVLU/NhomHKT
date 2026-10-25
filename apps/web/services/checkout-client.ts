'use client';

import type { ApiSuccess } from '@hktstore/shared';
import { apiBaseUrl } from '../lib/environment';
import { bootstrapSession, getAccessToken } from './auth-client';

export type PaymentMethod = 'COD';

export interface CheckoutRequest {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  deliveryNote?: string | null;
}

export interface CheckoutOrderItem {
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

export interface CheckoutConfirmation {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: PaymentMethod;
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
  items: CheckoutOrderItem[];
  totalQuantity: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  createdAt: string;
}

export class CheckoutApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const checkoutRequestFingerprint = (request: CheckoutRequest): string =>
  JSON.stringify({
    shippingAddressId: request.shippingAddressId,
    paymentMethod: request.paymentMethod,
    deliveryNote: request.deliveryNote ?? null,
  });

export const createCheckoutIdempotencyKey = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const checkoutApi = {
  placeOrder: async (
    payload: CheckoutRequest,
    idempotencyKey: string,
  ): Promise<CheckoutConfirmation> => {
    if (!getAccessToken() && !(await bootstrapSession()))
      throw new CheckoutApiError('AUTH_UNAUTHORIZED', 'Vui lòng đăng nhập để thanh toán.');
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${getAccessToken() ?? ''}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new CheckoutApiError(
        'NETWORK_UNCERTAIN',
        'Chưa thể xác nhận kết quả đặt hàng. Hệ thống sẽ kiểm tra lại bằng cùng mã xử lý để tránh tạo đơn trùng.',
      );
    }
    const body = (await response.json()) as
      ApiSuccess<CheckoutConfirmation> | { error?: { code?: string; message?: string } };
    if (!response.ok || !('data' in body)) {
      const error = 'error' in body ? body.error : undefined;
      throw new CheckoutApiError(
        error?.code ?? 'CHECKOUT_REQUEST_FAILED',
        error?.message ?? 'Không thể đặt hàng. Vui lòng thử lại.',
      );
    }
    return body.data;
  },
};

const storageKey = 'hktstore.checkout.confirmation';

export const saveCheckoutConfirmation = (confirmation: CheckoutConfirmation): void => {
  window.sessionStorage.setItem(storageKey, JSON.stringify(confirmation));
};

export const readCheckoutConfirmation = (): CheckoutConfirmation | null => {
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutConfirmation;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
};
