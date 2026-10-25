'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './cart-provider';

export function AddToCartButton({
  variantId,
  productName,
  productSlug,
  availableQuantity,
  quantity = 1,
  disabled = false,
}: {
  variantId: string;
  productName: string;
  productSlug: string;
  availableQuantity: number;
  quantity?: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { addItem, status } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const outOfStock = availableQuantity < 1;
  const checkingSession = status === 'loading';
  const handleAdd = async () => {
    if (status === 'guest' || status === 'error') {
      router.push(`/dang-nhap?returnUrl=${encodeURIComponent(`/sach/${productSlug}`)}`);
      return;
    }
    setSubmitting(true);
    try {
      await addItem(variantId, productName, quantity);
    } catch {
      // The shared toast provides the actionable error message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      className="add-to-cart-button"
      type="button"
      disabled={disabled || outOfStock || submitting || checkingSession}
      aria-busy={submitting}
      onClick={() => void handleAdd()}
    >
      {outOfStock
        ? 'Tạm hết hàng'
        : submitting
          ? 'Đang thêm…'
          : checkingSession
            ? 'Đang kiểm tra…'
            : 'Thêm vào giỏ hàng'}
    </button>
  );
}
