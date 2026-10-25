import { z } from 'zod';

const password = z
  .string()
  .min(8)
  .max(64)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Tối đa 72 UTF-8 bytes')
  .refine((value) => /[A-Za-zÀ-ỹ]/u.test(value) && /\d/u.test(value), 'Mật khẩu phải có chữ và số');
const username = z
  .string()
  .trim()
  .min(5)
  .max(15)
  .regex(/^[a-zA-Z0-9_]+$/)
  .transform((value) => value.toLowerCase());
const email = z
  .email()
  .trim()
  .transform((value) => value.toLowerCase());
const phone = z
  .string()
  .trim()
  .transform((value, context) => {
    const normalized = value.startsWith('0') ? `+84${value.slice(1)}` : value;
    if (!/^\+84\d{9,10}$/.test(normalized))
      context.addIssue({ code: 'custom', message: 'Số điện thoại không hợp lệ' });
    return normalized;
  });

export const registerSchema = z.strictObject({
  username: username.optional(),
  fullName: z.string().trim().min(2).max(120),
  email,
  phone,
  password,
});
export const loginSchema = z
  .strictObject({
    username: username.optional(),
    email: email.optional(),
    password: z.string().min(1).max(72),
  })
  .refine((value) => Boolean(value.username ?? value.email), 'Username or email is required');
export const forgotPasswordSchema = z.strictObject({ email });
export const verifyOtpSchema = z.strictObject({ email, otp: z.string().regex(/^\d{6}$/) });
export const resetPasswordSchema = z.strictObject({
  resetToken: z.string().min(40),
  newPassword: password,
});
export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(72),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
