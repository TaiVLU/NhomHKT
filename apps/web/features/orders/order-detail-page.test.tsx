import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderDetailPage } from './order-detail-page';

const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
}));

vi.mock('../../services/orders-client', () => ({
  ordersApi: { detail: mocks.detail },
}));

const order = {
  orderNumber: 'RS20260719120000ABC123',
  createdAt: '2026-07-19T10:00:00.000Z',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  shippingAddress: {
    recipientName: 'Nguyen Van A',
    phone: '+84901234567',
    line1: '12 Nguyen Hue',
    ward: 'Phuong Ben Nghe',
    district: 'Quan 1',
    province: 'TP. Ho Chi Minh',
    postalCode: '700000',
    deliveryNote: 'Call first',
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
  statusHistory: [
    { status: 'PENDING_CONFIRMATION', createdAt: '2026-07-19T10:00:00.000Z' },
    { status: 'CONFIRMED', createdAt: '2026-07-19T11:00:00.000Z' },
  ],
};

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.detail.mockResolvedValue(order);
  });
  afterEach(cleanup);

  it('renders order detail, customer-safe timeline, snapshots, items, totals, and actions', async () => {
    render(<OrderDetailPage orderNumber={order.orderNumber} />);
    expect(await screen.findByRole('heading', { name: order.orderNumber })).toBeInTheDocument();
    expect(screen.getAllByText('Chờ xác nhận').length).toBeGreaterThan(0);
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
    expect(screen.getByText(/Nguyen Van A/)).toBeInTheDocument();
    expect(screen.getByText(/12 Nguyen Hue/)).toBeInTheDocument();
    expect(screen.getByText('Thanh toán khi nhận hàng')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText(/SKU CLEAN-CODE/)).toBeInTheDocument();
    expect(screen.getByText('Tiến trình đơn hàng')).toBeInTheDocument();
    expect(screen.queryByText('Admin note')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toHaveAttribute(
      'href',
      '/san-pham',
    );
  });

  it('renders safe not-found state for missing or unowned order', async () => {
    mocks.detail.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { code: 'ORDER_NOT_FOUND' }),
    );
    render(<OrderDetailPage orderNumber="RS-OTHER" />);
    expect(await screen.findByText('Không tìm thấy đơn hàng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về danh sách đơn hàng' })).toHaveAttribute(
      'href',
      '/tai-khoan/don-hang',
    );
  });

  it('keeps long order numbers inside the mobile order grid', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/\.order-detail-page\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(/\.orders-heading h1,[^}]*overflow-wrap:\s*anywhere/s);
  });
});
