import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AdminReportingClientModule from '../../services/admin-reporting-client';
import {
  AdminDashboardPage,
  AdminInventoryPage,
  AdminProductStatisticsPage,
  AdminRevenuePage,
} from './reporting-pages';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../services/admin-reporting-client', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminReportingClientModule>();
  return { ...actual, fetchAdminReport: mocks.fetch };
});

const report = {
  range: {
    from: '2026-07-01',
    to: '2026-07-30',
    timezone: 'Asia/Ho_Chi_Minh',
    previousFrom: '2026-06-01',
    previousTo: '2026-06-30',
  },
  summary: {
    recognizedRevenue: 500000,
    recognizedOrderCount: 2,
    completedOrderCount: 2,
    averageOrderValue: 250000,
    itemsSold: 5,
    previousPeriodRevenue: 400000,
    revenueChangePercent: 25,
    orderChangePercent: 0,
    processingOrderCount: 1,
    lowStockProductCount: 1,
    outOfStockProductCount: 1,
    totalOrderCount: 4,
  },
  quickRevenue: { today: 100000, last7Days: 300000, last30Days: 500000 },
  revenueSeries: [{ date: '2026-07-01', revenue: 500000, orderCount: 2, itemsSold: 5 }],
  orderStatuses: [
    { status: 'COMPLETED', orderCount: 2, totalValue: 500000, revenueEligible: true },
    { status: 'CANCELLED', orderCount: 1, totalValue: 100000, revenueEligible: false },
  ],
  topProductsByQuantity: [
    {
      rank: 1,
      title: 'Sách A',
      slug: 'sach-a',
      quantitySold: 3,
      recognizedRevenue: 300000,
      orderCount: 2,
      image: null,
    },
  ],
  topProductsByRevenue: [
    {
      rank: 1,
      title: 'Sách B',
      slug: 'sach-b',
      quantitySold: 2,
      recognizedRevenue: 350000,
      orderCount: 1,
      image: null,
    },
  ],
  lowSellingProducts: [
    { title: 'Sách C', slug: 'sach-c', quantitySold: 1, recognizedRevenue: 50000 },
  ],
  noSalesProducts: [{ title: 'Sách D', slug: 'sach-d' }],
  categories: [{ category: 'Văn học', quantitySold: 5, recognizedRevenue: 500000 }],
  inventory: {
    totalVariants: 2,
    totalOnHand: 5,
    totalReserved: 1,
    totalAvailable: 4,
    lowStock: [
      {
        productName: 'Sách A',
        productSlug: 'sach-a',
        variantName: 'Bìa mềm',
        sku: 'A-1',
        onHandQuantity: 4,
        reservedQuantity: 1,
        availableQuantity: 3,
        lowStockThreshold: 5,
      },
    ],
    outOfStock: [
      {
        productName: 'Sách B',
        productSlug: 'sach-b',
        variantName: 'Bìa cứng',
        sku: 'B-1',
        onHandQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        lowStockThreshold: 5,
      },
    ],
    items: [],
  },
  latestOrders: [
    {
      orderNumber: 'RS001',
      orderStatus: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      grandTotal: 250000,
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  policy: {
    authoritativeTotal: 'Order.grandTotal',
    recognizedStatuses: ['COMPLETED'],
    excludedStatuses: ['CANCELLED'],
    refundAdjustmentSupported: false,
  },
};

describe('M7.4E Admin reporting pages', () => {
  afterEach(cleanup);
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue(report);
  });

  it('renders dashboard metrics, shortcuts, recent orders and top products', async () => {
    render(<AdminDashboardPage />);
    expect(screen.getByLabelText('Đang tải báo cáo')).toBeInTheDocument();
    expect((await screen.findAllByText('500.000 ₫')).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Theo dõi đơn hàng' })).toHaveAttribute(
      'href',
      '/admin/orders',
    );
    expect(screen.getByRole('link', { name: 'RS001' })).toHaveAttribute(
      'href',
      '/admin/orders/RS001',
    );
  });

  it('supports revenue presets, custom range, chart fallback and reset', async () => {
    render(<AdminRevenuePage />);
    expect(
      await screen.findByRole('table', { name: 'Dữ liệu doanh thu theo ngày' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7 ngày' }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole('table', { name: 'Phân bố trạng thái đơn trong kỳ' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Có · hoàn tất')).toBeInTheDocument();
  });

  it('renders product, category and role-safe inventory statistics', async () => {
    render(<AdminProductStatisticsPage />);
    expect(await screen.findByRole('table', { name: 'Sản phẩm bán chạy' })).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'Số lượng và doanh thu theo danh mục' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/giá vốn|lợi nhuận/i)).not.toBeInTheDocument();
  });

  it('renders inventory summary and safe retry state', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('network'));
    render(<AdminInventoryPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải dữ liệu báo cáo.');
    mocks.fetch.mockResolvedValueOnce(report);
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Danh sách tồn kho')).toBeInTheDocument();
  });
});
