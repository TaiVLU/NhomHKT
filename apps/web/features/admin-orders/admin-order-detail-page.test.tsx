import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrderDetailPage } from './admin-order-detail-page';

const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  transition: vi.fn(),
  role: 'STAFF',
}));

vi.mock('../../services/admin-orders-client', () => ({
  adminOrdersApi: { detail: mocks.detail, transition: mocks.transition },
}));
vi.mock('../../services/auth-client', () => ({
  getCurrentRole: () => mocks.role,
}));

const order = {
  orderNumber: 'RS20260719130000ADMIN',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:05:00.000Z',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  customer: {
    id: '10',
    fullName: 'Nguyen Van A',
    email: 'customer@example.test',
    phone: '+84901234567',
  },
  shippingAddress: {
    recipientName: 'Snapshot Recipient',
    phone: '+84909999999',
    line1: '12 Nguyen Hue',
    ward: 'Ben Nghe',
    district: 'Quan 1',
    province: 'TP. Ho Chi Minh',
    postalCode: '700000',
    deliveryNote: 'Call first',
  },
  items: [
    {
      id: '1',
      variantId: '2',
      productId: '3',
      productName: 'Clean Code',
      productSlug: 'clean-code',
      variantName: 'Paperback',
      sku: 'CLEAN-CODE',
      image: { url: 'https://example.test/clean-code.jpg', altText: 'Clean Code cover' },
      quantity: 2,
      unitPrice: 220000,
      lineTotal: 440000,
    },
  ],
  totalQuantity: 2,
  subtotal: 440000,
  shippingFee: 0,
  discount: 0,
  grandTotal: 440000,
  statusHistory: [
    {
      id: 'h1',
      fromStatus: null,
      toStatus: 'PENDING_CONFIRMATION',
      note: 'Order created',
      changedByUserId: null,
      actorName: null,
      actorEmail: null,
      createdAt: '2026-07-19T10:00:00.000Z',
    },
  ],
  allowedTransitions: ['CONFIRMED', 'CANCELLED'],
};

describe('AdminOrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'STAFF';
    mocks.detail.mockResolvedValue(order);
    mocks.transition.mockResolvedValue({
      ...order,
      orderStatus: 'CONFIRMED',
      allowedTransitions: ['PACKING', 'CANCELLED'],
    });
  });
  afterEach(cleanup);

  it('renders detail sections, timeline, totals, snapshots, and staff read-only state', async () => {
    render(<AdminOrderDetailPage orderNumber={order.orderNumber} />);
    expect(await screen.findByRole('heading', { name: order.orderNumber })).toBeInTheDocument();
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByText('customer@example.test')).toBeInTheDocument();
    expect(screen.getByText(/Snapshot Recipient/)).toBeInTheDocument();
    expect(screen.getByText(/12 Nguyen Hue/)).toBeInTheDocument();
    expect(screen.getByText('Thanh toán khi nhận hàng')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Clean Code cover' })).toBeInTheDocument();
    expect(screen.getByText(/SKU CLEAN-CODE/)).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Xác nhận đơn|Hủy đơn/i })).not.toBeInTheDocument();
  });

  it('shows valid admin actions, requires cancellation reason, and refreshes after success', async () => {
    mocks.role = 'ADMIN';
    render(<AdminOrderDetailPage orderNumber={order.orderNumber} />);
    expect(await screen.findByRole('button', { name: 'Xác nhận đơn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy đơn' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Lý do hủy'), { target: { value: 'Khach doi y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() =>
      expect(mocks.transition).toHaveBeenCalledWith(order.orderNumber, {
        targetStatus: 'CANCELLED',
        expectedCurrentStatus: 'PENDING_CONFIRMATION',
        note: 'Khach doi y',
      }),
    );
  });

  it('renders safe not-found state', async () => {
    mocks.detail.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { code: 'ORDER_NOT_FOUND' }),
    );
    render(<AdminOrderDetailPage orderNumber="RS_UNKNOWN" />);
    expect(await screen.findByText('Không tìm thấy đơn hàng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về quản lý đơn hàng' })).toHaveAttribute(
      'href',
      '/admin/orders',
    );
  });
});
