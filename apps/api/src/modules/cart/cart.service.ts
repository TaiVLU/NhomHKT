import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import {
  assertActivePrimaryCategory,
  availableQuantity,
  isPurchasablePublicationState,
  variantUnavailableReason,
} from '../catalog/catalog-policy.js';
import { CatalogReadModelService } from '../catalog/catalog-read-model.js';
import type { AddCartItemInput, UpdateCartItemInput } from './cart.schema.js';

const parseId = (value: string): bigint => {
  if (!/^[1-9]\d*$/.test(value)) throw new AppError(400, 'VALIDATION_ERROR', 'ID không hợp lệ.');
  return BigInt(value);
};

const decimalNumber = (value: Prisma.Decimal.Value): number => Number(new Prisma.Decimal(value));

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          inventory: true,
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

const cartDto = async (cart: CartWithItems, prisma: PrismaClient | Prisma.TransactionClient) => {
  const readModel = new CatalogReadModelService(prisma);
  const currentFacts = new Map(
    (await Promise.all(cart.items.map((item) => readModel.variantCurrentFact(item.variantId))))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => [item.id, item]),
  );
  const items = cart.items.map((item) => {
    const current = currentFacts.get(item.variantId.toString());
    const unitPrice = current?.effectivePrice ?? decimalNumber(item.unitPrice);
    const priceChanged =
      current !== undefined && !new Prisma.Decimal(item.unitPrice).equals(current.effectivePrice);
    const unavailableReason =
      current?.unavailableReason ??
      variantUnavailableReason({
        productPublic: false,
        variantActive: false,
        availableQuantity: 0,
      });
    const subtotal = item.quantity * unitPrice;
    return {
      id: item.id.toString(),
      variantId: item.variantId.toString(),
      productId: current?.productId ?? item.variant.productId.toString(),
      sku: current?.sku ?? item.variant.sku,
      variantName: current?.name ?? item.variant.name,
      productName: current?.product.title ?? item.variant.product.name,
      productSlug: current?.product.slug ?? item.variant.product.slug,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      availableQuantity:
        current?.availability.availableQuantity ?? availableQuantity(item.variant.inventory),
      effectivePrice: unitPrice,
      lineStatus: unavailableReason || priceChanged ? 'UNAVAILABLE' : 'AVAILABLE',
      unavailableReason: priceChanged ? 'CHECKOUT_PRICE_CHANGED' : unavailableReason,
    };
  });
  return {
    cartId: cart.id.toString(),
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.subtotal, 0),
  };
};

export class CartService {
  constructor(private readonly prisma: PrismaClient) {}

  private async getOrCreateCart(tx: Prisma.TransactionClient, customerId: bigint) {
    return tx.cart.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
    });
  }

  private async loadCart(customerId: bigint) {
    const cart = await this.prisma.cart.findUnique({
      where: { customerId },
      include: cartInclude,
    });
    return cart
      ? cartDto(cart, this.prisma)
      : cartDto(await this.emptyCart(customerId), this.prisma);
  }

  private async emptyCart(customerId: bigint) {
    const cart = await this.prisma.cart.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
      include: cartInclude,
    });
    return cart;
  }

  private async validateVariant(tx: Prisma.TransactionClient, variantId: bigint) {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      include: {
        inventory: true,
        product: {
          include: { primaryCategory: true, categories: { include: { category: true } } },
        },
      },
    });
    if (!variant || !variant.isActive || !isPurchasablePublicationState(variant.product))
      throw new AppError(400, 'CART_VARIANT_UNAVAILABLE', 'Sản phẩm không khả dụng.');
    assertActivePrimaryCategory({
      publicationState: 'ACTIVE',
      primaryCategoryId: variant.product.primaryCategoryId,
      categoryIds: variant.product.categories.map((category) => category.categoryId),
      primaryCategory: variant.product.primaryCategory,
    });
    const available = availableQuantity(variant.inventory);
    if (available < 1) throw new AppError(400, 'CART_STOCK_UNAVAILABLE', 'Sản phẩm đã hết hàng.');
    return { variant, available };
  }

  async get(customerId: bigint) {
    return this.loadCart(customerId);
  }

  async addItem(customerId: bigint, input: AddCartItemInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const cart = await this.getOrCreateCart(tx, customerId);
        const { variant, available } = await this.validateVariant(tx, parseId(input.variantId));
        const current = await tx.cartItem.findUnique({
          where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
        });
        const nextQuantity = (current?.quantity ?? 0) + input.quantity;
        if (nextQuantity > available)
          throw new AppError(400, 'CART_QUANTITY_EXCEEDS_STOCK', 'Số lượng vượt quá tồn kho.');
        if (current) {
          await tx.cartItem.update({
            where: { id: current.id },
            data: { quantity: nextQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              variantId: variant.id,
              quantity: input.quantity,
              unitPrice: new Prisma.Decimal(variant.salePrice),
            },
          });
        }
        const updated = await tx.cart.findUniqueOrThrow({
          where: { id: cart.id },
          include: cartInclude,
        });
        return cartDto(updated, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateItem(customerId: bigint, itemIdValue: string, input: UpdateCartItemInput) {
    const itemId = parseId(itemIdValue);
    return this.prisma.$transaction(
      async (tx) => {
        const cart = await this.getOrCreateCart(tx, customerId);
        const current = await tx.cartItem.findFirst({
          where: { id: itemId, cartId: cart.id },
          include: { variant: { include: { inventory: true, product: true } } },
        });
        if (!current)
          throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ.');
        const { available } = await this.validateVariant(tx, current.variantId);
        if (input.quantity > available)
          throw new AppError(400, 'CART_QUANTITY_EXCEEDS_STOCK', 'Số lượng vượt quá tồn kho.');
        await tx.cartItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
        const updated = await tx.cart.findUniqueOrThrow({
          where: { id: cart.id },
          include: cartInclude,
        });
        return cartDto(updated, tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async removeItem(customerId: bigint, itemIdValue: string) {
    const itemId = parseId(itemIdValue);
    const cart = await this.prisma.cart.findUnique({ where: { customerId } });
    if (!cart) return this.get(customerId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.get(customerId);
  }

  async clear(customerId: bigint) {
    const cart = await this.emptyCart(customerId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.get(customerId);
  }
}
