import { Prisma, type PrismaClient } from '@prisma/client';
import type { ReportingRangeInput } from './reporting.schema.js';

export const REPORTING_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const REVENUE_ELIGIBLE_STATUSES = ['COMPLETED'] as const;
export const ORDER_STATUSES = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PACKING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;
const PROCESSING_STATUSES = ['PENDING_CONFIRMATION', 'CONFIRMED', 'PACKING', 'SHIPPING'];
const dayMs = 86_400_000;

const money = (value: Prisma.Decimal.Value | null | undefined): number =>
  Number(new Prisma.Decimal(value ?? 0));
const vnStart = (value: string): Date => new Date(`${value}T00:00:00.000+07:00`);
const addDays = (date: Date, count: number): Date => new Date(date.getTime() + count * dayMs);
const isoDay = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORTING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
const todayVn = (): string => isoDay(new Date());

export interface ResolvedReportingRange {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
  previousStart: Date;
  previousEndExclusive: Date;
  days: number;
}

export const resolveReportingRange = (input: ReportingRangeInput): ResolvedReportingRange => {
  const to = input.to ?? todayVn();
  const toStart = vnStart(to);
  const from = input.from ?? isoDay(addDays(toStart, -29));
  const start = vnStart(from);
  const endExclusive = addDays(toStart, 1);
  const days = Math.round((endExclusive.getTime() - start.getTime()) / dayMs);
  return {
    from,
    to,
    start,
    endExclusive,
    previousStart: addDays(start, -days),
    previousEndExclusive: start,
    days,
  };
};

const percentChange = (current: number, previous: number): number | null =>
  previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;

type ProductAccumulator = {
  title: string;
  slug: string | null;
  quantitySold: number;
  recognizedRevenue: number;
  orderNumbers: Set<string>;
  image: string | null;
};

const rankProducts = (products: ProductAccumulator[], by: 'quantity' | 'revenue') =>
  [...products]
    .sort((a, b) => {
      const difference =
        by === 'quantity'
          ? b.quantitySold - a.quantitySold
          : b.recognizedRevenue - a.recognizedRevenue;
      return difference || a.title.localeCompare(b.title, 'vi');
    })
    .slice(0, 10)
    .map((product, index) => ({
      rank: index + 1,
      title: product.title,
      slug: product.slug,
      quantitySold: product.quantitySold,
      recognizedRevenue: product.recognizedRevenue,
      orderCount: product.orderNumbers.size,
      image: product.image,
    }));

export class ReportingService {
  constructor(private readonly prisma: PrismaClient) {}

  async report(input: ReportingRangeInput) {
    const range = resolveReportingRange(input);
    const selectedWhere = { createdAt: { gte: range.start, lt: range.endExclusive } };
    const recognizedWhere = { ...selectedWhere, status: { in: [...REVENUE_ELIGIBLE_STATUSES] } };
    const previousWhere = {
      createdAt: { gte: range.previousStart, lt: range.previousEndExclusive },
      status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
    };
    const today = todayVn();
    const todayStart = vnStart(today);
    const [
      selectedOrders,
      recognizedOrders,
      previousAggregate,
      previousOrderCount,
      statusGroups,
      inventoryRows,
      products,
      latestOrders,
      todayAggregate,
      sevenDayAggregate,
      thirtyDayAggregate,
    ] = await Promise.all([
      this.prisma.order.count({ where: selectedWhere }),
      this.prisma.order.findMany({
        where: recognizedWhere,
        select: {
          orderNumber: true,
          createdAt: true,
          grandTotal: true,
          items: {
            select: {
              quantity: true,
              lineTotal: true,
              unitEffectivePrice: true,
              unitPrice: true,
              productTitleSnapshot: true,
              productSlugSnapshot: true,
              primaryCategoryNameSnapshot: true,
              coverImageUrlSnapshot: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.order.aggregate({ where: previousWhere, _sum: { grandTotal: true } }),
      this.prisma.order.count({ where: previousWhere }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: selectedWhere,
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.inventory.findMany({
        select: {
          onHandQuantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
          productVariant: {
            select: {
              sku: true,
              name: true,
              product: { select: { name: true, slug: true, isActive: true, deletedAt: true } },
            },
          },
        },
        orderBy: { productVariantId: 'asc' },
      }),
      this.prisma.product.findMany({
        where: {
          publicationState: 'ACTIVE',
          isActive: true,
          deletedAt: null,
          variants: { some: { isActive: true } },
        },
        select: { name: true, slug: true, isActive: true, deletedAt: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.order.findMany({
        where: selectedWhere,
        select: {
          orderNumber: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          grandTotal: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5,
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
          createdAt: { gte: todayStart, lt: addDays(todayStart, 1) },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
          createdAt: { gte: addDays(todayStart, -6), lt: addDays(todayStart, 1) },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
          createdAt: { gte: addDays(todayStart, -29), lt: addDays(todayStart, 1) },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    const seriesMap = new Map<string, { revenue: number; orderCount: number; itemsSold: number }>();
    const productMap = new Map<string, ProductAccumulator>();
    const categoryMap = new Map<string, { quantitySold: number; recognizedRevenue: number }>();
    let recognizedRevenue = 0;
    let itemsSold = 0;
    for (const order of recognizedOrders) {
      const total = money(order.grandTotal);
      recognizedRevenue += total;
      const date = isoDay(order.createdAt);
      const bucket = seriesMap.get(date) ?? { revenue: 0, orderCount: 0, itemsSold: 0 };
      bucket.revenue += total;
      bucket.orderCount += 1;
      for (const item of order.items) {
        const itemRevenue = money(
          item.lineTotal ??
            new Prisma.Decimal(item.unitEffectivePrice ?? item.unitPrice).mul(item.quantity),
        );
        itemsSold += item.quantity;
        bucket.itemsSold += item.quantity;
        const productKey = `${item.productTitleSnapshot ?? 'Sản phẩm lịch sử'}|${item.productSlugSnapshot ?? ''}`;
        const product = productMap.get(productKey) ?? {
          title: item.productTitleSnapshot ?? 'Sản phẩm lịch sử',
          slug: item.productSlugSnapshot,
          quantitySold: 0,
          recognizedRevenue: 0,
          orderNumbers: new Set<string>(),
          image: item.coverImageUrlSnapshot,
        };
        product.quantitySold += item.quantity;
        product.recognizedRevenue += itemRevenue;
        product.orderNumbers.add(order.orderNumber);
        productMap.set(productKey, product);
        const category = item.primaryCategoryNameSnapshot ?? 'Không xác định';
        const categoryTotal = categoryMap.get(category) ?? {
          quantitySold: 0,
          recognizedRevenue: 0,
        };
        categoryTotal.quantitySold += item.quantity;
        categoryTotal.recognizedRevenue += itemRevenue;
        categoryMap.set(category, categoryTotal);
      }
      seriesMap.set(date, bucket);
    }

    const revenueSeries = Array.from({ length: range.days }, (_, index) => {
      const date = isoDay(addDays(range.start, index));
      return { date, ...(seriesMap.get(date) ?? { revenue: 0, orderCount: 0, itemsSold: 0 }) };
    });
    const previousRevenue = money(previousAggregate._sum.grandTotal);
    const available = (row: (typeof inventoryRows)[number]) =>
      Math.max(0, row.onHandQuantity - row.reservedQuantity);
    const inventoryItems = inventoryRows.map((row) => ({
      productName: row.productVariant.product.name,
      productSlug: row.productVariant.product.slug,
      variantName: row.productVariant.name,
      sku: row.productVariant.sku,
      onHandQuantity: row.onHandQuantity,
      reservedQuantity: row.reservedQuantity,
      availableQuantity: available(row),
      lowStockThreshold: row.lowStockThreshold,
    }));
    const lowStock = inventoryItems.filter(
      (row) => row.availableQuantity > 0 && row.availableQuantity <= row.lowStockThreshold,
    );
    const outOfStock = inventoryItems.filter((row) => row.availableQuantity === 0);
    const soldSlugs = new Set(
      [...productMap.values()]
        .map((product) => product.slug)
        .filter((slug): slug is string => !!slug),
    );
    const noSales = products
      .filter((product) => product.isActive && !product.deletedAt && !soldSlugs.has(product.slug))
      .slice(0, 10)
      .map((product) => ({ title: product.name, slug: product.slug }));
    const productValues = [...productMap.values()];

    return {
      range: {
        from: range.from,
        to: range.to,
        timezone: REPORTING_TIMEZONE,
        previousFrom: isoDay(range.previousStart),
        previousTo: isoDay(addDays(range.previousEndExclusive, -1)),
      },
      summary: {
        recognizedRevenue,
        recognizedOrderCount: recognizedOrders.length,
        completedOrderCount: recognizedOrders.length,
        averageOrderValue: recognizedOrders.length
          ? recognizedRevenue / recognizedOrders.length
          : 0,
        itemsSold,
        previousPeriodRevenue: previousRevenue,
        revenueChangePercent: percentChange(recognizedRevenue, previousRevenue),
        orderChangePercent: percentChange(recognizedOrders.length, previousOrderCount),
        processingOrderCount: statusGroups
          .filter((group) => PROCESSING_STATUSES.includes(group.status))
          .reduce((sum, group) => sum + group._count._all, 0),
        lowStockProductCount: lowStock.length,
        outOfStockProductCount: outOfStock.length,
        totalOrderCount: selectedOrders,
      },
      quickRevenue: {
        today: money(todayAggregate._sum.grandTotal),
        last7Days: money(sevenDayAggregate._sum.grandTotal),
        last30Days: money(thirtyDayAggregate._sum.grandTotal),
      },
      revenueSeries,
      orderStatuses: ORDER_STATUSES.map((status) => {
        const group = statusGroups.find((candidate) => candidate.status === status);
        return {
          status,
          orderCount: group?._count._all ?? 0,
          totalValue: money(group?._sum.grandTotal),
          revenueEligible: REVENUE_ELIGIBLE_STATUSES.includes(
            status as (typeof REVENUE_ELIGIBLE_STATUSES)[number],
          ),
        };
      }),
      topProductsByQuantity: rankProducts(productValues, 'quantity'),
      topProductsByRevenue: rankProducts(productValues, 'revenue'),
      lowSellingProducts: [...productValues]
        .sort((a, b) => a.quantitySold - b.quantitySold || a.title.localeCompare(b.title, 'vi'))
        .slice(0, 10)
        .map((product) => ({
          title: product.title,
          slug: product.slug,
          quantitySold: product.quantitySold,
          recognizedRevenue: product.recognizedRevenue,
        })),
      noSalesProducts: noSales,
      categories: [...categoryMap.entries()]
        .map(([category, values]) => ({ category, ...values }))
        .sort(
          (a, b) =>
            b.recognizedRevenue - a.recognizedRevenue || a.category.localeCompare(b.category, 'vi'),
        ),
      inventory: {
        totalVariants: inventoryRows.length,
        totalOnHand: inventoryRows.reduce((sum, row) => sum + row.onHandQuantity, 0),
        totalReserved: inventoryRows.reduce((sum, row) => sum + row.reservedQuantity, 0),
        totalAvailable: inventoryRows.reduce((sum, row) => sum + available(row), 0),
        lowStock,
        outOfStock,
        items: inventoryItems,
      },
      latestOrders: latestOrders.map((order) => ({
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        grandTotal: money(order.grandTotal),
        createdAt: order.createdAt.toISOString(),
      })),
      policy: {
        authoritativeTotal: 'Order.grandTotal',
        recognizedStatuses: [...REVENUE_ELIGIBLE_STATUSES],
        excludedStatuses: ORDER_STATUSES.filter(
          (status) =>
            !REVENUE_ELIGIBLE_STATUSES.includes(
              status as (typeof REVENUE_ELIGIBLE_STATUSES)[number],
            ),
        ),
        refundAdjustmentSupported: false,
      },
    };
  }
}
