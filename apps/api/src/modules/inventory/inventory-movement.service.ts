import type { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';

export type InventoryMovementType =
  | 'RECEIVE_STOCK'
  | 'MANUAL_INCREASE'
  | 'MANUAL_DECREASE'
  | 'CORRECTION'
  | 'CHECKOUT_CONSUMPTION'
  | 'ORDER_CANCELLATION_RESTORE';

type MovementActor = {
  userId: bigint;
  fullName: string | null;
  email: string;
};

type InventoryMovementResult = {
  productVariantId: bigint;
  beforeQuantity: number;
  afterQuantity: number;
  quantityDelta: number;
};

const stockConflict = (code: string, message: string) => new AppError(409, code, message);

export class InventoryMovementService {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async adjust(input: {
    variantId: bigint;
    type: Extract<
      InventoryMovementType,
      'RECEIVE_STOCK' | 'MANUAL_INCREASE' | 'MANUAL_DECREASE' | 'CORRECTION'
    >;
    quantityDelta: number;
    reason: string;
    expectedOnHandQuantity?: number | undefined;
    actor: MovementActor;
  }) {
    const inventory = await this.tx.inventory.findUnique({
      where: { productVariantId: input.variantId },
      include: { productVariant: { include: { product: true } } },
    });
    if (!inventory)
      throw new AppError(404, 'INVENTORY_NOT_FOUND', 'Không tìm thấy tồn kho cho phiên bản này.');
    if (
      input.expectedOnHandQuantity !== undefined &&
      input.expectedOnHandQuantity !== inventory.onHandQuantity
    )
      throw stockConflict(
        'INVENTORY_ADJUSTMENT_CONFLICT',
        'Tồn kho vừa được cập nhật bởi phiên khác.',
      );

    const afterQuantity = inventory.onHandQuantity + input.quantityDelta;
    if (afterQuantity < 0)
      throw new AppError(400, 'INVENTORY_NEGATIVE_STOCK', 'Điều chỉnh làm tồn kho âm.');
    if (afterQuantity < inventory.reservedQuantity)
      throw new AppError(
        400,
        'INVENTORY_RESERVED_STOCK_CONFLICT',
        'Tồn kho sau điều chỉnh thấp hơn số lượng đang giữ.',
      );

    const update = await this.tx.inventory.updateMany({
      where: {
        productVariantId: input.variantId,
        onHandQuantity: inventory.onHandQuantity,
      },
      data: { onHandQuantity: afterQuantity },
    });
    if (update.count !== 1)
      throw stockConflict(
        'INVENTORY_ADJUSTMENT_CONFLICT',
        'Tồn kho vừa được cập nhật bởi phiên khác.',
      );

    const ledger = await this.createLedger({
      inventoryId: inventory.productVariantId,
      adjustmentType: input.type,
      quantityDelta: input.quantityDelta,
      beforeQuantity: inventory.onHandQuantity,
      afterQuantity,
      reason: input.reason,
      actor: input.actor,
    });

    return {
      movement: {
        productVariantId: inventory.productVariantId,
        beforeQuantity: inventory.onHandQuantity,
        afterQuantity,
        quantityDelta: input.quantityDelta,
      },
      ledger,
      inventory,
    };
  }

  async consumeForCheckout(input: {
    variantId: bigint;
    quantity: number;
    orderNumber: string;
    customerId: bigint;
  }): Promise<InventoryMovementResult> {
    const inventory = await this.tx.inventory.findUnique({
      where: { productVariantId: input.variantId },
    });
    if (!inventory)
      throw new AppError(
        400,
        'CHECKOUT_OUT_OF_STOCK',
        'Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.',
      );

    const afterQuantity = inventory.onHandQuantity - input.quantity;
    if (afterQuantity < inventory.reservedQuantity)
      throw new AppError(
        400,
        'CHECKOUT_OUT_OF_STOCK',
        'Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.',
      );

    const consumed = await this.tx.inventory.updateMany({
      where: {
        productVariantId: input.variantId,
        onHandQuantity: inventory.onHandQuantity,
        reservedQuantity: inventory.reservedQuantity,
      },
      data: { onHandQuantity: afterQuantity },
    });
    if (consumed.count !== 1)
      throw new AppError(
        400,
        'CHECKOUT_OUT_OF_STOCK',
        'Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.',
      );

    await this.createLedger({
      inventoryId: input.variantId,
      adjustmentType: 'CHECKOUT_CONSUMPTION',
      quantityDelta: -input.quantity,
      beforeQuantity: inventory.onHandQuantity,
      afterQuantity,
      reason: `Checkout consumption for order ${input.orderNumber}; customer ${input.customerId.toString()}.`,
    });

    return {
      productVariantId: input.variantId,
      beforeQuantity: inventory.onHandQuantity,
      afterQuantity,
      quantityDelta: -input.quantity,
    };
  }

  async restoreForOrderCancellation(input: {
    variantId: bigint;
    quantity: number;
    orderNumber: string;
    actor: MovementActor;
  }): Promise<InventoryMovementResult> {
    const inventory = await this.tx.inventory.findUnique({
      where: { productVariantId: input.variantId },
    });
    if (!inventory)
      throw stockConflict(
        'ORDER_INVENTORY_RESTORE_FAILED',
        'Khong the hoan kho cho mot san pham trong don hang.',
      );

    const afterQuantity = inventory.onHandQuantity + input.quantity;
    const restored = await this.tx.inventory.updateMany({
      where: {
        productVariantId: input.variantId,
        onHandQuantity: inventory.onHandQuantity,
      },
      data: { onHandQuantity: afterQuantity },
    });
    if (restored.count !== 1)
      throw stockConflict(
        'ORDER_INVENTORY_RESTORE_FAILED',
        'Khong the hoan kho cho mot san pham trong don hang.',
      );

    await this.createLedger({
      inventoryId: input.variantId,
      adjustmentType: 'ORDER_CANCELLATION_RESTORE',
      quantityDelta: input.quantity,
      beforeQuantity: inventory.onHandQuantity,
      afterQuantity,
      reason: `Order cancellation restoration for order ${input.orderNumber}.`,
      actor: input.actor,
    });

    return {
      productVariantId: input.variantId,
      beforeQuantity: inventory.onHandQuantity,
      afterQuantity,
      quantityDelta: input.quantity,
    };
  }

  private createLedger(input: {
    inventoryId: bigint;
    adjustmentType: InventoryMovementType;
    quantityDelta: number;
    beforeQuantity: number;
    afterQuantity: number;
    reason: string;
    actor?: MovementActor | undefined;
  }) {
    return this.tx.inventoryLedger.create({
      data: {
        inventoryId: input.inventoryId,
        adjustmentType: input.adjustmentType,
        quantityDelta: input.quantityDelta,
        beforeQuantity: input.beforeQuantity,
        afterQuantity: input.afterQuantity,
        reason: input.reason,
        ...(input.actor
          ? {
              actorUserId: input.actor.userId,
              actorNameSnapshot: input.actor.fullName,
              actorEmailSnapshot: input.actor.email,
            }
          : {}),
      },
    });
  }
}
