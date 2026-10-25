import { createHash } from 'node:crypto';
import { z } from 'zod';

export const checkoutPaymentMethods = ['COD'] as const;

export const checkoutSchema = z.strictObject({
  shippingAddressId: z.string().regex(/^[1-9]\d*$/),
  paymentMethod: z.enum(checkoutPaymentMethods),
  deliveryNote: z.string().trim().max(500).nullable().optional(),
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(160)
  .regex(/^[A-Za-z0-9._:-]+$/);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const checkoutRequestHash = (input: CheckoutInput): string =>
  createHash('sha256')
    .update(
      JSON.stringify({
        version: 1,
        shippingAddressId: input.shippingAddressId,
        paymentMethod: input.paymentMethod,
        deliveryNote: input.deliveryNote ?? null,
      }),
    )
    .digest('hex');
