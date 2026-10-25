import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthPrincipal } from '../../middlewares/authenticate.js';
import { AppError } from '../../shared/errors/app-error.js';
import { InventoryMovementService } from './inventory-movement.service.js';
import type { InventoryAdjustmentInput, InventoryAdjustmentType } from './inventory.schema.js';

const toBigIntId = (value: string, code = 'VALIDATION_ERROR'): bigint => {
  try {
    return BigInt(value);
  } catch {
    throw new AppError(400, code, 'ID không hợp lệ.');
  }
};

const deltaFor = (type: InventoryAdjustmentType, quantity: number): number =>
  type === 'MANUAL_DECREASE' ? -quantity : quantity;

const ledgerDto = (entry: {
  id: bigint;
  inventoryId: bigint;
  adjustmentType: string;
  quantityDelta: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason: string;
  actorNameSnapshot: string | null;
  actorEmailSnapshot: string | null;
  createdAt: Date;
}) => ({
  id: entry.id.toString(),
  inventoryId: entry.inventoryId.toString(),
  variantId: entry.inventoryId.toString(),
  adjustmentType: entry.adjustmentType,
  quantityDelta: entry.quantityDelta,
  beforeQuantity: entry.beforeQuantity,
  afterQuantity: entry.afterQuantity,
  reason: entry.reason,
  actorName: entry.actorNameSnapshot,
  actorEmail: entry.actorEmailSnapshot,
  createdAt: entry.createdAt.toISOString(),
});

export class InventoryService {
  constructor(private readonly prisma: PrismaClient) {}

  async detail(variantIdValue: string) {
    const variantId = toBigIntId(variantIdValue, 'INVENTORY_VARIANT_NOT_FOUND');
    const inventory = await this.prisma.inventory.findUnique({
      where: { productVariantId: variantId },
      include: {
        productVariant: { include: { product: true } },
        ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!inventory)
      throw new AppError(404, 'INVENTORY_NOT_FOUND', 'Không tìm thấy tồn kho cho phiên bản này.');
    return {
      variantId: inventory.productVariantId.toString(),
      sku: inventory.productVariant.sku,
      variantName: inventory.productVariant.name,
      productName: inventory.productVariant.product.name,
      onHandQuantity: inventory.onHandQuantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: Math.max(0, inventory.onHandQuantity - inventory.reservedQuantity),
      updatedAt: inventory.updatedAt.toISOString(),
      ledger: inventory.ledgerEntries.map(ledgerDto),
    };
  }

  async adjust(input: InventoryAdjustmentInput, principal: AuthPrincipal) {
    const variantId = toBigIntId(input.variantId, 'INVENTORY_VARIANT_NOT_FOUND');
    const reason = input.reason.trim();
    return this.prisma.$transaction(
      async (tx) => {
        const quantityDelta = deltaFor(input.type, input.quantity);
        const actor = await tx.user.findUnique({
          where: { id: principal.userId },
          select: { id: true, fullName: true, email: true },
        });
        if (!actor) throw new AppError(401, 'AUTH_UNAUTHORIZED', 'Cần đăng nhập.');

        const result = await new InventoryMovementService(tx).adjust({
          variantId,
          type: input.type,
          quantityDelta,
          reason,
          expectedOnHandQuantity: input.expectedOnHandQuantity,
          actor: { userId: actor.id, fullName: actor.fullName, email: actor.email },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: 'INVENTORY_ADJUSTED',
            entityType: 'Inventory',
            entityId: result.movement.productVariantId.toString(),
            metadataJson: JSON.stringify({
              variantId: result.movement.productVariantId.toString(),
              sku: result.inventory.productVariant.sku,
              adjustmentType: input.type,
              quantityDelta,
              beforeQuantity: result.movement.beforeQuantity,
              afterQuantity: result.movement.afterQuantity,
            }),
          },
        });

        return {
          inventory: await this.detailInTransaction(tx, result.movement.productVariantId),
          ledgerEntry: ledgerDto(result.ledger),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private async detailInTransaction(tx: Prisma.TransactionClient, variantId: bigint) {
    const inventory = await tx.inventory.findUniqueOrThrow({
      where: { productVariantId: variantId },
      include: {
        productVariant: { include: { product: true } },
        ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    return {
      variantId: inventory.productVariantId.toString(),
      sku: inventory.productVariant.sku,
      variantName: inventory.productVariant.name,
      productName: inventory.productVariant.product.name,
      onHandQuantity: inventory.onHandQuantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: Math.max(0, inventory.onHandQuantity - inventory.reservedQuantity),
      updatedAt: inventory.updatedAt.toISOString(),
      ledger: inventory.ledgerEntries.map(ledgerDto),
    };
  }
}
