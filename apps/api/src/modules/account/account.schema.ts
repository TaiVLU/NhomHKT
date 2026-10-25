import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .transform((value, context) => {
    const normalized = value.startsWith('0') ? `+84${value.slice(1)}` : value;
    if (!/^\+84\d{9,10}$/.test(normalized))
      context.addIssue({ code: 'custom', message: 'Số điện thoại không hợp lệ' });
    return normalized;
  });
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const profilePatchSchema = z
  .strictObject({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: phone.optional(),
    birthday: z.iso.date().nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Empty patch')
  .refine(
    (value) => !value.birthday || new Date(`${value.birthday}T00:00:00.000Z`) <= new Date(),
    'Birthday cannot be in the future',
  );

export const addressSchema = z.strictObject({
  recipientName: z.string().trim().min(2).max(120),
  phone,
  line1: z.string().trim().min(3).max(255),
  ward: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120),
  postalCode: optionalText(20),
  isDefault: z.boolean().optional(),
});
export const addressPatchSchema = addressSchema
  .omit({ isDefault: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Empty patch');
export const addressIdSchema = z.string().regex(/^[1-9]\d*$/);

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type AddressPatchInput = z.infer<typeof addressPatchSchema>;
