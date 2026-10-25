import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import type { AuthPrincipal } from '../../middlewares/authenticate.js';
import { InventoryMovementService } from '../inventory/inventory-movement.service.js';
import type {
  AdminOrderListQuery,
  OrderListQuery,
  OrderStatus,
  OrderTransitionInput,
} from './orders.schema.js';

const decimalNumber = (value: Prisma.Decimal.Value): number => Number(new Prisma.Decimal(value));
const transitionMap = {
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
} satisfies Record<OrderStatus, OrderStatus[]>;

export const allowedOrderTransitions = (status: string): OrderStatus[] =>
  status in transitionMap ? transitionMap[status as OrderStatus] : [];

const orderInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
  statusHistory: { orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }] },
} satisfies Prisma.OrderInclude;
const adminOrderInclude = {
  customer: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
  statusHistory: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type AdminOrderWithItems = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

const parseAuthorNamesSnapshot = (value: string | null): string[] | null => {
  if (value === null) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const orderItemDto = (item: OrderWithItems['items'][number]) => {
  const unitPrice = decimalNumber(item.unitEffectivePrice ?? item.unitPrice);
  const authorNames = parseAuthorNamesSnapshot(item.authorNamesSnapshot);
  return {
    id: item.id.toString(),
    variantId: item.variantId.toString(),
    productId: item.variant.productId.toString(),
    sku: item.skuSnapshot ?? item.variant.sku,
    productName: item.productTitleSnapshot ?? item.variant.product.name,
    productSlug: item.productSlugSnapshot ?? item.variant.product.slug,
    variantName: item.variantNameSnapshot ?? item.variant.name,
    authorNames,
    publisherName: item.publisherNameSnapshot,
    primaryCategoryName: item.primaryCategoryNameSnapshot,
    coverImageUrl: item.coverImageUrlSnapshot,
    isbn: item.isbnSnapshot ?? item.variant.isbn,
    language: item.languageSnapshot ?? item.variant.product.language,
    quantity: item.quantity,
    unitPrice,
    subtotal: decimalNumber(item.lineTotal ?? new Prisma.Decimal(unitPrice).mul(item.quantity)),
  };
};

const customerHistoryDto = (history: OrderWithItems['statusHistory'][number]) => ({
  status: history.toStatus,
  createdAt: history.createdAt.toISOString(),
});

const orderDetailDto = (order: OrderWithItems) => {
  const items = order.items.map(orderItemDto);
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    orderStatus: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: {
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      ward: order.shippingWard,
      district: order.shippingDistrict,
      province: order.shippingProvince,
      postalCode: order.shippingPostalCode,
      deliveryNote: order.deliveryNote,
    },
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: decimalNumber(order.subtotal),
    shippingFee: decimalNumber(order.shippingFee),
    discount: decimalNumber(order.discount),
    grandTotal: decimalNumber(order.grandTotal),
    statusHistory: order.statusHistory.map(customerHistoryDto),
  };
};

const orderSummaryDto = (order: OrderWithItems) => ({
  orderNumber: order.orderNumber,
  createdAt: order.createdAt.toISOString(),
  orderStatus: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  grandTotal: decimalNumber(order.grandTotal),
  itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
});

const vnDateStart = (value: string): Date => new Date(`${value}T00:00:00.000+07:00`);
const vnDateAfter = (value: string): Date => {
  const date = vnDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
};

const adminWhere = (query: AdminOrderListQuery): Prisma.OrderWhereInput => {
  const where: Prisma.OrderWhereInput = {};
  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { shippingRecipientName: { contains: search } },
      { shippingPhone: { contains: search } },
      { customer: { email: { contains: search } } },
    ];
  }
  if (query.orderStatus) where.status = query.orderStatus;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: vnDateStart(query.dateFrom) } : {}),
      ...(query.dateTo ? { lt: vnDateAfter(query.dateTo) } : {}),
    };
  }
  return where;
};

const adminOrderBy = (sort: AdminOrderListQuery['sort']): Prisma.OrderOrderByWithRelationInput[] =>
  sort === 'oldest'
    ? [{ createdAt: 'asc' }, { id: 'asc' }]
    : sort === 'totalAsc'
      ? [{ grandTotal: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }]
      : sort === 'totalDesc'
        ? [{ grandTotal: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
        : [{ createdAt: 'desc' }, { id: 'desc' }];

const adminItemDto = (item: AdminOrderWithItems['items'][number]) => {
  const unitPrice = decimalNumber(item.unitEffectivePrice ?? item.unitPrice);
  const authorNames = parseAuthorNamesSnapshot(item.authorNamesSnapshot);
  const image = item.coverImageUrlSnapshot
    ? {
        url: item.coverImageUrlSnapshot,
        altText: item.productTitleSnapshot ?? item.variant.product.name,
      }
    : null;
  const fallbackImage =
    item.variant.product.images.find(
      (candidate) => candidate.productVariantId === item.variantId,
    ) ??
    item.variant.product.images.find((candidate) => candidate.productVariantId === null) ??
    item.variant.product.images[0] ??
    null;
  const resolvedImage =
    image ?? (fallbackImage ? { url: fallbackImage.url, altText: fallbackImage.altText } : null);
  return {
    id: item.id.toString(),
    variantId: item.variantId.toString(),
    productId: item.variant.productId.toString(),
    productName: item.productTitleSnapshot ?? item.variant.product.name,
    productSlug: item.productSlugSnapshot ?? item.variant.product.slug,
    variantName: item.variantNameSnapshot ?? item.variant.name,
    sku: item.skuSnapshot ?? item.variant.sku,
    authorNames,
    publisherName: item.publisherNameSnapshot,
    primaryCategoryName: item.primaryCategoryNameSnapshot,
    isbn: item.isbnSnapshot ?? item.variant.isbn,
    language: item.languageSnapshot ?? item.variant.product.language,
    image: resolvedImage,
    quantity: item.quantity,
    unitPrice,
    lineTotal: decimalNumber(item.lineTotal ?? new Prisma.Decimal(unitPrice).mul(item.quantity)),
  };
};

const adminHistoryDto = (history: AdminOrderWithItems['statusHistory'][number]) => ({
  id: history.id.toString(),
  fromStatus: history.fromStatus,
  toStatus: history.toStatus,
  note: history.note,
  changedByUserId: history.changedByUserId?.toString() ?? null,
  actorName: history.changedByNameSnapshot,
  actorEmail: history.changedByEmailSnapshot,
  createdAt: history.createdAt.toISOString(),
});

const adminDetailDto = (order: AdminOrderWithItems) => {
  const items = order.items.map(adminItemDto);
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    orderStatus: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customer: {
      id: order.customer.id.toString(),
      fullName: order.customer.fullName,
      email: order.customer.email,
      phone: order.customer.phone,
    },
    shippingAddress: {
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      ward: order.shippingWard,
      district: order.shippingDistrict,
      province: order.shippingProvince,
      postalCode: order.shippingPostalCode,
      deliveryNote: order.deliveryNote,
    },
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: decimalNumber(order.subtotal),
    shippingFee: decimalNumber(order.shippingFee),
    discount: decimalNumber(order.discount),
    grandTotal: decimalNumber(order.grandTotal),
    statusHistory: order.statusHistory.map(adminHistoryDto),
    allowedTransitions: allowedOrderTransitions(order.status),
  };
};

export class OrdersService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(customerId: bigint, query: OrderListQuery) {
    const where = { customerId };
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data: rows.map(orderSummaryDto),
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async detail(customerId: bigint, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { customerId, orderNumber },
      include: orderInclude,
    });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
    return orderDetailDto(order);
  }

  async adminList(query: AdminOrderListQuery) {
    const where = adminWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          shippingRecipientName: true,
          shippingPhone: true,
          grandTotal: true,
          customer: { select: { email: true } },
        },
        orderBy: adminOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const quantityRows = rows.length
      ? await this.prisma.orderItem.groupBy({
          by: ['orderId'],
          where: { orderId: { in: rows.map((order) => order.id) } },
          _sum: { quantity: true },
        })
      : [];
    const quantityByOrderId = new Map(
      quantityRows.map((row) => [row.orderId.toString(), row._sum.quantity ?? 0]),
    );
    return {
      data: rows.map((order) => ({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        recipientName: order.shippingRecipientName,
        recipientPhone: order.shippingPhone,
        customerEmail: order.customer.email,
        itemCount: quantityByOrderId.get(order.id.toString()) ?? 0,
        grandTotal: decimalNumber(order.grandTotal),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async adminDetail(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: adminOrderInclude,
    });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Khong tim thay don hang.');
    return adminDetailDto(order);
  }

  async transition(orderNumber: string, input: OrderTransitionInput, principal: AuthPrincipal) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          include: { items: true },
        });
        if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Khong tim thay don hang.');
        if (!(order.status in transitionMap))
          throw new AppError(
            409,
            'ORDER_TRANSITION_INVALID',
            'Trang thai don hang hien tai khong hop le.',
          );

        const currentStatus = order.status as OrderStatus;
        const expectedCurrentStatus = input.expectedCurrentStatus ?? currentStatus;
        if (currentStatus !== expectedCurrentStatus)
          throw new AppError(
            409,
            'ORDER_STATUS_CONFLICT',
            'Trang thai don hang vua duoc cap nhat boi phien khac.',
          );
        const targetStatus = input.targetStatus;
        if (expectedCurrentStatus === targetStatus)
          throw new AppError(
            400,
            'ORDER_TRANSITION_INVALID',
            'Khong the chuyen don hang sang cung trang thai hien tai.',
          );
        if (
          !(transitionMap[expectedCurrentStatus] as readonly OrderStatus[]).includes(targetStatus)
        )
          throw new AppError(
            400,
            'ORDER_TRANSITION_INVALID',
            'Chuyen trang thai don hang khong hop le.',
          );
        if (targetStatus === 'CANCELLED' && (!input.note || input.note.trim().length < 5))
          throw new AppError(
            400,
            'ORDER_CANCELLATION_REASON_REQUIRED',
            'Can nhap ly do huy don hang toi thieu 5 ky tu.',
          );

        const actor = await tx.user.findUnique({
          where: { id: principal.userId },
          select: { id: true, email: true, fullName: true },
        });
        if (!actor) throw new AppError(401, 'AUTH_UNAUTHORIZED', 'Can dang nhap.');

        const updateResult = await tx.order.updateMany({
          where: { id: order.id, status: expectedCurrentStatus },
          data: {
            status: targetStatus,
            ...(targetStatus === 'COMPLETED' && order.paymentMethod === 'COD'
              ? { paymentStatus: 'PAID' }
              : {}),
          },
        });
        if (updateResult.count !== 1)
          throw new AppError(
            409,
            'ORDER_STATUS_CONFLICT',
            'Trang thai don hang vua duoc cap nhat boi phien khac.',
          );

        if (targetStatus === 'CANCELLED') {
          const inventoryMovements = new InventoryMovementService(tx);
          for (const item of order.items) {
            await inventoryMovements.restoreForOrderCancellation({
              variantId: item.variantId,
              quantity: item.quantity,
              orderNumber,
              actor: { userId: actor.id, fullName: actor.fullName, email: actor.email },
            });
          }
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: expectedCurrentStatus,
            toStatus: targetStatus,
            note: input.note ?? null,
            changedByUserId: actor.id,
            changedByEmailSnapshot: actor.email,
            changedByNameSnapshot: actor.fullName,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: 'ORDER_STATUS_TRANSITIONED',
            entityType: 'Order',
            entityId: order.id.toString(),
            metadataJson: JSON.stringify({
              orderNumber,
              fromStatus: expectedCurrentStatus,
              toStatus: targetStatus,
            }),
          },
        });

        const updated = await tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: adminOrderInclude,
        });
        return adminDetailDto(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
