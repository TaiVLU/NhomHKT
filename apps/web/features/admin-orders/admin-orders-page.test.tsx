import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrdersPage } from './admin-orders-page';

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
  refresh: vi.fn(),
  list: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => mocks.params,
}));
vi.mock('../../services/admin-orders-client', () => ({
  adminOrdersApi: { list: mocks.list },
}));

const row = {
  orderNumber: 'RS20260719130000ADMIN',
  createdAt: '2026-07-19T10:00:00.000Z',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentStatus: 'UNPAID',
  paymentMethod: 'COD',
  recipientName: 'Nguyen Admin',
  recipientPhone: '+84901234567',
  customerEmail: 'customer@example.test',
  itemCount: 3,
  grandTotal: 330000,
};

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = new URLSearchParams();
    mocks.list.mockResolvedValue({
      data: [row],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
  });
  afterEach(cleanup);

  it('renders order list as read-only table and mobile cards', async () => {
    render(<AdminOrdersPage />);
    expect(screen.getByText('Quản lý đơn hàng')).toBeInTheDocument();
    expect(await screen.findAllByText(row.orderNumber)).toHaveLength(2);
    expect(screen.getAllByText('Chờ xác nhận').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chưa thanh toán').length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /cập nhật|xác nhận|hủy/i }),
    ).not.toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: undefined,
      orderStatus: undefined,
      paymentStatus: undefined,
      paymentMethod: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: 'newest',
    });
  });

  it('renders loading, empty, no-result, and error states', async () => {
    mocks.list.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    });
    const { unmount } = render(<AdminOrdersPage />);
    expect(await screen.findByText('Chưa có đơn hàng')).toBeInTheDocument();
    unmount();

    mocks.params = new URLSearchParams({ search: 'missing' });
    mocks.list.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    });
    const second = render(<AdminOrdersPage />);
    expect(await screen.findByText('Không có đơn hàng phù hợp')).toBeInTheDocument();
    second.unmount();

    mocks.list.mockRejectedValueOnce(new Error('failed'));
    render(<AdminOrdersPage />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Không thể tải dữ liệu đơn hàng.')).toBeInTheDocument();
  });

  it('submits search, filters, sort, and preserves URL query state', async () => {
    render(<AdminOrdersPage />);
    await screen.findAllByText(row.orderNumber);
    fireEvent.change(screen.getByLabelText('Tìm kiếm'), { target: { value: 'Nguyen' } });
    fireEvent.change(screen.getByLabelText('Trạng thái đơn'), {
      target: { value: 'PENDING_CONFIRMATION' },
    });
    fireEvent.change(screen.getByLabelText('Thanh toán'), { target: { value: 'UNPAID' } });
    fireEvent.change(screen.getByLabelText('Phương thức'), { target: { value: 'COD' } });
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-07-19' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-07-19' } });
    fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'totalDesc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(mocks.push).toHaveBeenCalledWith(
      '/admin/orders?page=1&pageSize=10&search=Nguyen&orderStatus=PENDING_CONFIRMATION&paymentStatus=UNPAID&paymentMethod=COD&dateFrom=2026-07-19&dateTo=2026-07-19&sort=totalDesc',
    );
  });

  it('renders pagination controls with filters preserved', async () => {
    mocks.params = new URLSearchParams({ page: '2', search: 'RS' });
    mocks.list.mockResolvedValueOnce({
      data: [row],
      meta: { page: 2, pageSize: 10, total: 25, totalPages: 3 },
    });
    render(<AdminOrdersPage />);
    expect(await screen.findAllByText(row.orderNumber)).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Trang trước' })).toHaveAttribute(
      'href',
      '/admin/orders?page=1&pageSize=10&search=RS&sort=newest',
    );
    expect(screen.getByRole('link', { name: 'Trang sau' })).toHaveAttribute(
      'href',
      '/admin/orders?page=3&pageSize=10&search=RS&sort=newest',
    );
  });

  it('rejects invalid date ranges before submitting', async () => {
    render(<AdminOrdersPage />);
    await screen.findAllByText(row.orderNumber);
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-07-20' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-07-19' } });
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Khoảng ngày không hợp lệ');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
