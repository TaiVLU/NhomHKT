import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckoutSuccessPage } from './checkout-success-page';

const mocks = vi.hoisted(() => ({
  confirmation: null as Record<string, unknown> | null,
}));

vi.mock('../../services/checkout-client', () => ({
  readCheckoutConfirmation: () => mocks.confirmation,
}));

const confirmation = {
  orderNumber: 'RS20260719120000ABC123',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  shippingAddress: {
    recipientName: 'Customer',
    phone: '+84901111111',
    line1: '1 Main',
    ward: 'W',
    district: 'D',
    province: 'P',
    postalCode: '700000',
    deliveryNote: 'Call me',
  },
  items: [
    {
      id: '1',
      variantId: '11',
      productId: '2',
      sku: 'CLEAN-CODE',
      productName: 'Clean Code',
      productSlug: 'clean-code',
      variantName: 'Bản tiêu chuẩn',
      quantity: 2,
      unitPrice: 220000,
      subtotal: 440000,
    },
  ],
  totalQuantity: 2,
  subtotal: 440000,
  shippingFee: 0,
  discount: 0,
  grandTotal: 440000,
  createdAt: '2026-07-19T10:00:00.000Z',
};

describe('CheckoutSuccessPage', () => {
  afterEach(cleanup);

  it('renders confirmation details, statuses, address snapshot, items, totals, and actions', async () => {
    mocks.confirmation = confirmation;
    render(<CheckoutSuccessPage />);
    expect(await screen.findByRole('heading', { name: 'Đặt hàng thành công' })).toBeInTheDocument();
    expect(screen.getByText('RS20260719120000ABC123')).toBeInTheDocument();
    expect(screen.getByText('PENDING_CONFIRMATION')).toBeInTheDocument();
    expect(screen.getByText('COD · UNPAID')).toBeInTheDocument();
    expect(screen.getByText(/1 Main, W, D, P/)).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getAllByText(/440.000/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Xem đơn hàng' })).toHaveAttribute(
      'href',
      '/tai-khoan/don-hang/RS20260719120000ABC123',
    );
    expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toHaveAttribute(
      'href',
      '/san-pham',
    );
  });

  it('shows graceful fallback on refresh without confirmation state', async () => {
    mocks.confirmation = null;
    render(<CheckoutSuccessPage />);
    expect(
      await screen.findByRole('heading', { name: 'Chưa có dữ liệu xác nhận đơn hàng' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toHaveAttribute(
      'href',
      '/san-pham',
    );
  });
});
