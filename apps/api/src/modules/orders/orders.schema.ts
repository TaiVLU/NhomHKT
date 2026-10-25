import { z } from 'zod';

export const orderNumberSchema = z.string().trim().min(4).max(32);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

export const orderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const adminOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalText(120),
    orderStatus: optionalText(40),
    paymentStatus: optionalText(20),
    paymentMethod: optionalText(20),
    dateFrom: dateOnly,
    dateTo: dateOnly,
    sort: z.enum(['newest', 'oldest', 'totalAsc', 'totalDesc']).default('newest'),
  })
  .strict()
  .refine(
    (value) =>
      !value.dateFrom ||
      !value.dateTo ||
      new Date(`${value.dateFrom}T00:00:00.000+07:00`) <=
        new Date(`${value.dateTo}T00:00:00.000+07:00`),
    'dateFrom must be before or equal to dateTo',
  );

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

export const orderStatuses = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PACKING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;

export const orderTransitionSchema = z.strictObject({
  targetStatus: z.enum(orderStatuses),
  expectedCurrentStatus: z.enum(orderStatuses).optional(),
  note: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || undefined)
    .optional(),
});

export type OrderStatus = (typeof orderStatuses)[number];
export type OrderTransitionInput = z.infer<typeof orderTransitionSchema>;
