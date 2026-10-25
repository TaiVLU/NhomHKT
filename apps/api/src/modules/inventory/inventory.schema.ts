import { z } from 'zod';

export const inventoryAdjustmentTypes = [
  'RECEIVE_STOCK',
  'MANUAL_INCREASE',
  'MANUAL_DECREASE',
  'CORRECTION',
] as const;

export const inventoryAdjustmentSchema = z
  .object({
    variantId: z.string().regex(/^[1-9]\d*$/),
    type: z.enum(inventoryAdjustmentTypes),
    quantity: z.number().int().positive(),
    reason: z.string().trim().min(1).max(500),
    expectedOnHandQuantity: z.number().int().nonnegative().optional(),
  })
  .strict();

export const variantIdSchema = z.string().regex(/^[1-9]\d*$/);

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type InventoryAdjustmentType = (typeof inventoryAdjustmentTypes)[number];
