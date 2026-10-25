import { Prisma, type PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { reportingRangeSchema } from '../src/modules/reporting/reporting.schema.js';
import {
  ReportingService,
  resolveReportingRange,
} from '../src/modules/reporting/reporting.service.js';

const decimal = (value: number) => new Prisma.Decimal(value);

const createPrisma = () => {
  const order = {
    count: vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(1),
    findMany: vi
      .fn()
      .mockResolvedValueOnce([
        {
          orderNumber: 'RS-COMPLETED',
          createdAt: new Date('2026-07-20T03:00:00.000Z'),
          grandTotal: decimal(250_000),
          items: [
            {
              quantity: 2,
              lineTotal: decimal(200_000),
              unitEffectivePrice: decimal(100_000),
              unitPrice: decimal(100_000),
              productTitleSnapshot: 'Sách lịch sử',
              productSlugSnapshot: 'sach-lich-su',
              primaryCategoryNameSnapshot: null,
              coverImageUrlSnapshot: null,
            },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          orderNumber: 'RS-COMPLETED',
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: 'COD',
          grandTotal: decimal(250_000),
          createdAt: new Date('2026-07-20T03:00:00.000Z'),
        },
      ]),
    aggregate: vi
      .fn()
      .mockResolvedValueOnce({ _sum: { grandTotal: decimal(100_000) } })
      .mockResolvedValueOnce({ _sum: { grandTotal: decimal(0) } })
      .mockResolvedValueOnce({ _sum: { grandTotal: decimal(0) } })
      .mockResolvedValueOnce({ _sum: { grandTotal: decimal(0) } }),
    groupBy: vi.fn().mockResolvedValue([
      { status: 'COMPLETED', _count: { _all: 1 }, _sum: { grandTotal: decimal(250_000) } },
      { status: 'CANCELLED', _count: { _all: 1 }, _sum: { grandTotal: decimal(999_000) } },
      { status: 'PACKING', _count: { _all: 1 }, _sum: { grandTotal: decimal(50_000) } },
    ]),
  };
  const inventory = {
    findMany: vi.fn().mockResolvedValue([
      {
        onHandQuantity: 4,
        reservedQuantity: 1,
        lowStockThreshold: 5,
        productVariant: {
          sku: 'SKU-LOW',
          name: 'Bìa mềm',
          product: { name: 'Sách lịch sử', slug: 'sach-lich-su', isActive: true, deletedAt: null },
        },
      },
      {
        onHandQuantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        productVariant: {
          sku: 'SKU-OUT',
          name: 'Bìa cứng',
          product: {
            name: 'Sách hết hàng',
            slug: 'sach-het-hang',
            isActive: true,
            deletedAt: null,
          },
        },
      },
    ]),
  };
  const product = {
    findMany: vi.fn().mockResolvedValue([
      { name: 'Sách lịch sử', slug: 'sach-lich-su', isActive: false, deletedAt: new Date() },
      { name: 'Chưa bán', slug: 'chua-ban', isActive: true, deletedAt: null },
    ]),
  };
  return { order, inventory, product };
};

describe('M7.4E reporting policy and aggregation', () => {
  it('validates bounded strict reporting ranges', () => {
    expect(reportingRangeSchema.parse({ from: '2026-07-01', to: '2026-07-31' })).toEqual({
      from: '2026-07-01',
      to: '2026-07-31',
    });
    expect(() => reportingRangeSchema.parse({ from: '2026-07-31', to: '2026-07-01' })).toThrow();
    expect(() => reportingRangeSchema.parse({ from: '2024-01-01', to: '2026-01-01' })).toThrow();
    expect(() => reportingRangeSchema.parse({ from: '2026-02-30', to: '2026-03-01' })).toThrow();
    expect(() =>
      reportingRangeSchema.parse({ from: '2026-07-01', to: '2026-07-02', x: '1' }),
    ).toThrow();
  });

  it('uses equal-duration previous periods and Vietnam inclusive day boundaries', () => {
    const range = resolveReportingRange({ from: '2026-07-20', to: '2026-07-22' });
    expect(range.days).toBe(3);
    expect(range.start.toISOString()).toBe('2026-07-19T17:00:00.000Z');
    expect(range.endExclusive.toISOString()).toBe('2026-07-22T17:00:00.000Z');
    expect(range.previousStart.toISOString()).toBe('2026-07-16T17:00:00.000Z');
  });

  it('recognizes only COMPLETED grandTotal and preserves snapshot product history', async () => {
    const prisma = createPrisma();
    const report = await new ReportingService(prisma as unknown as PrismaClient).report({
      from: '2026-07-20',
      to: '2026-07-22',
    });
    expect(report.summary).toMatchObject({
      recognizedRevenue: 250_000,
      recognizedOrderCount: 1,
      averageOrderValue: 250_000,
      itemsSold: 2,
      previousPeriodRevenue: 100_000,
      processingOrderCount: 1,
      lowStockProductCount: 1,
      outOfStockProductCount: 1,
    });
    expect(report.revenueSeries).toHaveLength(3);
    expect(report.revenueSeries.map((row) => row.revenue)).toEqual([250_000, 0, 0]);
    expect(report.topProductsByRevenue[0]).toMatchObject({
      title: 'Sách lịch sử',
      quantitySold: 2,
      recognizedRevenue: 200_000,
    });
    expect(report.categories).toEqual([
      { category: 'Không xác định', quantitySold: 2, recognizedRevenue: 200_000 },
    ]);
    expect(report.noSalesProducts).toEqual([{ title: 'Chưa bán', slug: 'chua-ban' }]);
    expect(report.policy).toMatchObject({
      authoritativeTotal: 'Order.grandTotal',
      recognizedStatuses: ['COMPLETED'],
      refundAdjustmentSupported: false,
    });
    expect(JSON.stringify(report)).not.toMatch(/email|phone|customerId|password/i);
  });
});
