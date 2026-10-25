import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import {
  assertActivePrimaryCategory,
  isPurchasablePublicationState,
} from '../catalog/catalog-policy.js';
import {
  CatalogReadModelService,
  type CatalogVariantCurrentFact,
} from '../catalog/catalog-read-model.js';
import { InventoryMovementService } from '../inventory/inventory-movement.service.js';
import { buildCheckoutOrderItemSnapshot } from './checkout-snapshot.js';
import type { CheckoutInput } from './checkout.schema.js';
import { checkoutRequestHash } from './checkout.schema.js';

const decimalNumber = (value: Prisma.Decimal.Value): number => Number(new Prisma.Decimal(value));

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
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const orderDto = (order: OrderWithItems) => {
  const items = order.items.map((item) => {
    const unitPrice = decimalNumber(item.unitEffectivePrice ?? item.unitPrice);
    return {
      id: item.id.toString(),
      variantId: item.variantId.toString(),
      productId: item.variant.productId.toString(),
      sku: item.skuSnapshot ?? item.variant.sku,
      productName: item.productTitleSnapshot ?? item.variant.product.name,
      productSlug: item.productSlugSnapshot ?? item.variant.product.slug,
      variantName: item.variantNameSnapshot ?? item.variant.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: decimalNumber(item.lineTotal ?? new Prisma.Decimal(unitPrice).mul(item.quantity)),
    };
  });
  return {
    orderNumber: order.orderNumber,
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
    createdAt: order.createdAt.toISOString(),
  };
};

const checkoutCartInclude = {
  items: {
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              publisher: true,
              primaryCategory: true,
              images: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
              authors: {
                include: { author: true },
                orderBy: [{ sortOrder: 'asc' as const }, { authorId: 'asc' as const }],
              },
              categories: { include: { category: true } },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

type CheckoutCart = Prisma.CartGetPayload<{ include: typeof checkoutCartInclude }>;
type CheckoutCartItem = CheckoutCart['items'][number];

const ensureCheckoutableItem = (item: CheckoutCartItem, current: CatalogVariantCurrentFact) => {
  const { variant } = item;
  if (!isPurchasablePublicationState(variant.product)) {
    throw new AppError(400, 'CHECKOUT_PRODUCT_DISABLED', 'Sản phẩm không còn khả dụng.');
  }
  assertActivePrimaryCategory({
    publicationState: 'ACTIVE',
    primaryCategoryId: variant.product.primaryCategoryId,
    categoryIds: variant.product.categories.map((category) => category.categoryId),
    primaryCategory: variant.product.primaryCategory,
  });
  if (!current.isActive) {
    throw new AppError(400, 'CHECKOUT_VARIANT_DISABLED', 'Phiên bản sản phẩm không còn khả dụng.');
  }
  const available = current.availability.availableQuantity;
  if (item.quantity > available) {
    throw new AppError(
      400,
      'CHECKOUT_OUT_OF_STOCK',
      'Số lượng trong giỏ vượt quá tồn kho hiện tại.',
    );
  }
  if (!new Prisma.Decimal(item.unitPrice).equals(current.effectivePrice)) {
    throw new AppError(
      409,
      'CHECKOUT_PRICE_CHANGED',
      'Giá sản phẩm đã thay đổi. Vui lòng cập nhật giỏ hàng.',
    );
  }
};

const createOrderNumber = () => {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RS${timestamp}${suffix}`;
};

const isUniqueConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export class CheckoutService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkout(customerId: bigint, input: CheckoutInput, idempotencyKey: string) {
    const requestHash = checkoutRequestHash(input);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.executeCheckout(customerId, input, idempotencyKey, requestHash);
      } catch (error) {
        if (
          attempt < 2 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new AppError(409, 'CHECKOUT_CONFLICT', 'Checkout đang bận. Vui lòng thử lại.');
  }

  private async loadIdempotentOrder(
    tx: Prisma.TransactionClient,
    customerId: bigint,
    idempotencyKey: string,
    requestHash: string,
  ) {
    const existing = await tx.checkoutIdempotency.findUnique({
      where: { customerId_key: { customerId, key: idempotencyKey } },
    });
    if (!existing) return null;
    if (existing.requestHash !== requestHash) {
      throw new AppError(
        409,
        'CHECKOUT_IDEMPOTENCY_CONFLICT',
        'Idempotency-Key đã được dùng cho một yêu cầu checkout khác.',
      );
    }
    if (existing.status !== 'SUCCESS' || !existing.orderId) {
      throw new AppError(
        409,
        'CHECKOUT_IDEMPOTENCY_IN_PROGRESS',
        'Yêu cầu checkout với Idempotency-Key này đang được xử lý.',
      );
    }
    const order = await tx.order.findUniqueOrThrow({
      where: { id: existing.orderId },
      include: orderInclude,
    });
    return orderDto(order);
  }

  private async createIdempotencyRecord(
    tx: Prisma.TransactionClient,
    customerId: bigint,
    idempotencyKey: string,
    requestHash: string,
  ) {
    try {
      await tx.checkoutIdempotency.create({
        data: { customerId, key: idempotencyKey, requestHash, status: 'IN_PROGRESS' },
      });
      return null;
    } catch (error) {
      if (isUniqueConflict(error))
        return this.loadIdempotentOrder(tx, customerId, idempotencyKey, requestHash);
      throw error;
    }
  }

  private async createOrderWithUniqueNumber(
    tx: Prisma.TransactionClient,
    data: Omit<Prisma.OrderCreateInput, 'orderNumber'>,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await tx.order.create({
          data: { ...data, orderNumber: createOrderNumber() },
          include: orderInclude,
        });
      } catch (error) {
        if (isUniqueConflict(error) && attempt < 4) continue;
        throw error;
      }
    }
    throw new AppError(
      409,
      'CHECKOUT_ORDER_NUMBER_CONFLICT',
      'Không thể tạo mã đơn hàng duy nhất.',
    );
  }

  private async executeCheckout(
    customerId: bigint,
    input: CheckoutInput,
    idempotencyKey: string,
    requestHash: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const replay = await this.createIdempotencyRecord(
          tx,
          customerId,
          idempotencyKey,
          requestHash,
        );
        if (replay) return replay;

        const address = await tx.address.findFirst({
          where: { id: BigInt(input.shippingAddressId), userId: customerId, deletedAt: null },
        });
        if (!address)
          throw new AppError(
            404,
            'CHECKOUT_ADDRESS_NOT_FOUND',
            'Không tìm thấy địa chỉ giao hàng thuộc tài khoản này.',
          );

        const cart = await tx.cart.findUnique({
          where: { customerId },
          include: checkoutCartInclude,
        });
        if (!cart) throw new AppError(400, 'CHECKOUT_CART_NOT_FOUND', 'Không tìm thấy giỏ hàng.');
        if (cart.items.length === 0)
          throw new AppError(400, 'CHECKOUT_CART_EMPTY', 'Giỏ hàng đang trống.');

        const readModel = new CatalogReadModelService(tx);
        const currentFacts = new Map<string, CatalogVariantCurrentFact>();
        for (const item of cart.items) {
          const current = await readModel.variantCurrentFact(item.variantId);
          if (!current)
            throw new AppError(400, 'CHECKOUT_PRODUCT_DISABLED', 'Sản phẩm không còn khả dụng.');
          currentFacts.set(item.variantId.toString(), current);
          ensureCheckoutableItem(item, current);
        }

        const subtotal = cart.items.reduce(
          (total, item) => total.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
          new Prisma.Decimal(0),
        );
        const shippingFee = new Prisma.Decimal(0);
        const discount = new Prisma.Decimal(0);
        const grandTotal = subtotal.plus(shippingFee).minus(discount);
        const order = await this.createOrderWithUniqueNumber(tx, {
          customer: { connect: { id: customerId } },
          shippingAddress: { connect: { id: address.id } },
          status: 'PENDING_CONFIRMATION',
          paymentMethod: input.paymentMethod,
          paymentStatus: 'UNPAID',
          shippingRecipientName: address.recipientName,
          shippingPhone: address.phone,
          shippingLine1: address.line1,
          shippingWard: address.ward,
          shippingDistrict: address.district,
          shippingProvince: address.province,
          shippingPostalCode: address.postalCode,
          deliveryNote: input.deliveryNote ?? null,
          subtotal,
          shippingFee,
          discount,
          total: grandTotal,
          grandTotal,
          items: {
            create: cart.items.map((item) =>
              buildCheckoutOrderItemSnapshot({
                variantId: item.variantId,
                quantity: item.quantity,
                current: currentFacts.get(item.variantId.toString())!,
              }),
            ),
          },
        });

        const inventoryMovements = new InventoryMovementService(tx);
        for (const item of cart.items) {
          await inventoryMovements.consumeForCheckout({
            variantId: item.variantId,
            quantity: item.quantity,
            orderNumber: order.orderNumber,
            customerId,
          });
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: order.status,
            note: 'Order created',
          },
        });

        await tx.checkoutIdempotency.update({
          where: { customerId_key: { customerId, key: idempotencyKey } },
          data: {
            status: 'SUCCESS',
            orderId: order.id,
          },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return orderDto(order);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
