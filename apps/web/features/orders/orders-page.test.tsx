import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersPage } from './orders-page';

const mocks = vi.hoisted(() => ({
  page: '1',
  list: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mocks.page ? { page: mocks.page } : {}),
}));
vi.mock('../../services/orders-client', () => ({
  ordersApi: { list: mocks.list },
}));

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.page = '1';
    mocks.list.mockResolvedValue({
      data: [
        {
          orderNumber: 'RS20260719120000ABC123',
          createdAt: '2026-07-19T10:00:00.000Z',
          orderStatus: 'PENDING_CONFIRMATION',
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          grandTotal: 440000,
          itemCount: 2,
        },
      ],
      meta: { page: 1, pageSize: 6, total: 1 },
    });
  });
  afterEach(cleanup);

  it('renders order history cards with customer-safe fields', async () => {
    render(<OrdersPage />);
    expect(screen.getByLabelText('Đang tải đơn hàng')).toBeInTheDocument();
    expect(await screen.findByText('RS20260719120000ABC123')).toBeInTheDocument();
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toHaveAttribute(
      'href',
      '/tai-khoan/don-hang/RS20260719120000ABC123',
    );
    expect(mocks.list).toHaveBeenCalledWith(1, 6);
  });

  it('renders empty and error states', async () => {
    mocks.list.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 6, total: 0 } });
    const { unmount } = render(<OrdersPage />);
    expect(await screen.findByText('Bạn chưa có đơn hàng nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục mua sắm' })).toHaveAttribute(
      'href',
      '/san-pham',
    );
    unmount();

    mocks.list.mockRejectedValueOnce(new Error('failed'));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Chưa thể tải đơn hàng')).toBeInTheDocument();
  });

  it('renders pagination controls', async () => {
    mocks.page = '2';
    mocks.list.mockResolvedValueOnce({
      data: [
        {
          orderNumber: 'RS2',
          createdAt: '2026-07-19T10:00:00.000Z',
          orderStatus: 'PENDING_CONFIRMATION',
          paymentMethod: 'COD',
          paymentStatus: 'UNPAID',
          grandTotal: 100000,
          itemCount: 1,
        },
      ],
      meta: { page: 2, pageSize: 6, total: 18 },
    });
    render(<OrdersPage />);
    expect(await screen.findByText('RS2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trang trước' })).toHaveAttribute(
      'href',
      '/tai-khoan/don-hang?page=1',
    );
    expect(screen.getByRole('link', { name: 'Trang sau' })).toHaveAttribute(
      'href',
      '/tai-khoan/don-hang?page=3',
    );
  });
});
