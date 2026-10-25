'use client';

import type { ApiSuccess } from '@hktstore/shared';
import { apiBaseUrl } from '../lib/environment';
import { getAccessToken } from './auth-client';

export interface CartItemDto {
  id: string;
  variantId: string;
  productId: string;
  sku: string;
  variantName: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableQuantity: number;
}

export interface CartDto {
  cartId: string;
  items: CartItemDto[];
  totalQuantity: number;
  subtotal: number;
}

export interface CartProductMetadata {
  coverUrl: string | null;
  coverAlt: string;
  authors: string;
}

export class CartApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const request = async (path: string, init: RequestInit = {}): Promise<CartDto> => {
  const token = getAccessToken();
  if (!token) throw new CartApiError('AUTH_REQUIRED', 'Vui lòng đăng nhập để sử dụng giỏ hàng.');
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = (await response.json()) as
    ApiSuccess<CartDto> | { error?: { code?: string; message?: string } };
  if (!response.ok || !('data' in body)) {
    const error = 'error' in body ? body.error : undefined;
    throw new CartApiError(
      error?.code ?? 'CART_REQUEST_FAILED',
      error?.message ?? 'Không thể cập nhật giỏ hàng. Vui lòng thử lại.',
    );
  }
  return body.data;
};

export const cartApi = {
  get: () => request('/cart'),
  addItem: (variantId: string, quantity = 1) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity }),
    }),
  updateItem: (itemId: string, quantity: number) =>
    request(`/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId: string) =>
    request(`/cart/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
};

export const getCartProductMetadata = async (slug: string): Promise<CartProductMetadata | null> => {
  const response = await fetch(`${apiBaseUrl}/products/${encodeURIComponent(slug)}`);
  if (!response.ok) return null;
  const { data } = (await response.json()) as ApiSuccess<{
    name: string;
    primaryImage: { url: string; altText: string } | null;
    authors: Array<{ name: string }>;
  }>;
  return {
    coverUrl: data.primaryImage?.url ?? null,
    coverAlt: data.primaryImage?.altText || data.name,
    authors: data.authors.map((author) => author.name).join(', ') || 'Đang cập nhật tác giả',
  };
};
