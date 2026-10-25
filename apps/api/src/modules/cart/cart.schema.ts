import { z } from 'zod';

export const cartItemIdSchema = z.string().regex(/^[1-9]\d*$/);

export const addCartItemSchema = z.strictObject({
  variantId: cartItemIdSchema,
  quantity: z.number().int().min(1).max(999),
});

export const updateCartItemSchema = z.strictObject({
  quantity: z.number().int().min(1).max(999),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
