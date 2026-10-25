'use client';

import type { ApiSuccess } from '@hktstore/shared';
import { apiBaseUrl } from '../lib/environment';
import { bootstrapSession, getAccessToken } from './auth-client';

export interface ReportingRange {
  from: string;
  to: string;
  timezone: string;
  previousFrom: string;
  previousTo: string;
}

export interface ReportingProduct {
  rank?: number;
  title: string;
  slug: string | null;
  quantitySold: number;
  recognizedRevenue: number;
  orderCount?: number;
  image?: string | null;
}

export interface InventoryReportingItem {
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
}

export interface AdminReport {
  range: ReportingRange;
  summary: {
    recognizedRevenue: number;
    recognizedOrderCount: number;
    completedOrderCount: number;
    averageOrderValue: number;
    itemsSold: number;
    previousPeriodRevenue: number;
    revenueChangePercent: number | null;
    orderChangePercent: number | null;
    processingOrderCount: number;
    lowStockProductCount: number;
    outOfStockProductCount: number;
    totalOrderCount: number;
  };
  quickRevenue: { today: number; last7Days: number; last30Days: number };
  revenueSeries: Array<{ date: string; revenue: number; orderCount: number; itemsSold: number }>;
  orderStatuses: Array<{
    status: string;
    orderCount: number;
    totalValue: number;
    revenueEligible: boolean;
  }>;
  topProductsByQuantity: ReportingProduct[];
  topProductsByRevenue: ReportingProduct[];
  lowSellingProducts: ReportingProduct[];
  noSalesProducts: Array<{ title: string; slug: string }>;
  categories: Array<{ category: string; quantitySold: number; recognizedRevenue: number }>;
  inventory: {
    totalVariants: number;
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    lowStock: InventoryReportingItem[];
    outOfStock: InventoryReportingItem[];
    items: InventoryReportingItem[];
  };
  latestOrders: Array<{
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    grandTotal: number;
    createdAt: string;
  }>;
  policy: {
    authoritativeTotal: string;
    recognizedStatuses: string[];
    excludedStatuses: string[];
    refundAdjustmentSupported: boolean;
  };
}

export class AdminReportingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const reportingPreset = (
  preset: 'today' | '7d' | '30d' | 'currentMonth' | 'previousMonth',
  now = new Date(),
): { from: string; to: string } => {
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const date = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const to = new Date(local.getFullYear(), local.getMonth(), local.getDate());
  if (preset === 'today') return { from: date(to), to: date(to) };
  if (preset === '7d' || preset === '30d') {
    const from = new Date(to);
    from.setDate(from.getDate() - (preset === '7d' ? 6 : 29));
    return { from: date(from), to: date(to) };
  }
  if (preset === 'currentMonth')
    return { from: date(new Date(to.getFullYear(), to.getMonth(), 1)), to: date(to) };
  return {
    from: date(new Date(to.getFullYear(), to.getMonth() - 1, 1)),
    to: date(new Date(to.getFullYear(), to.getMonth(), 0)),
  };
};

export const fetchAdminReport = async (
  resource: 'overview' | 'revenue' | 'product-statistics',
  range: { from: string; to: string },
  signal?: AbortSignal,
): Promise<AdminReport> => {
  if (!getAccessToken() && !(await bootstrapSession()))
    throw new AdminReportingError('AUTH_UNAUTHORIZED', 'Vui lòng đăng nhập lại.');
  const query = new URLSearchParams(range);
  const response = await fetch(`${apiBaseUrl}/admin/dashboard/${resource}?${query}`, {
    credentials: 'include',
    ...(signal ? { signal } : {}),
    headers: { authorization: `Bearer ${getAccessToken() ?? ''}` },
  });
  const body = (await response.json()) as
    ApiSuccess<AdminReport> | { error?: { code?: string; message?: string } };
  if (!response.ok || !('data' in body)) {
    const error = 'error' in body ? body.error : undefined;
    throw new AdminReportingError(
      error?.code ?? 'REPORTING_REQUEST_FAILED',
      error?.message ?? 'Không thể tải dữ liệu báo cáo.',
    );
  }
  return body.data;
};
