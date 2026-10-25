import { describe, expect, it } from 'vitest';
import {
  hashOpaqueToken,
  hashOtp,
  hashPassword,
  safeHashEqual,
  verifyPassword,
} from '../src/modules/auth/auth.crypto.js';
import { loginSchema, registerSchema } from '../src/modules/auth/auth.schema.js';
import { hasPermission } from '../src/modules/rbac/permissions.js';

describe('auth security primitives', () => {
  it('hashes passwords with bcrypt and never SHA-256', async () => {
    const hash = await hashPassword('HKTStore123');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyPassword('HKTStore123', hash)).toBe(true);
  });
  it('uses deterministic 64-char token/OTP hashes and constant-time comparison', () => {
    expect(hashOpaqueToken('token')).toHaveLength(64);
    const left = hashOtp('123456', 'p'.repeat(32));
    expect(safeHashEqual(left, hashOtp('123456', 'p'.repeat(32)))).toBe(true);
    expect(safeHashEqual(left, hashOtp('654321', 'p'.repeat(32)))).toBe(false);
  });
  it('normalizes identity and rejects role/mass assignment', () => {
    const valid = registerSchema.parse({
      username: ' User_1 ',
      fullName: 'Nguyễn Văn A',
      email: 'A@EXAMPLE.COM',
      phone: '0901234567',
      password: 'abc12345',
    });
    expect(valid).toMatchObject({
      username: 'user_1',
      email: 'a@example.com',
      phone: '+84901234567',
    });
    expect(registerSchema.parse({ ...valid, username: undefined })).not.toHaveProperty('role');
    expect(() => registerSchema.parse({ ...valid, role: 'ADMIN' })).toThrow();
  });
  it('enforces bcrypt byte limit and static RBAC', () => {
    expect(() =>
      registerSchema.parse({
        username: 'user_2',
        fullName: 'A B',
        email: 'b@example.com',
        phone: '0911234567',
        password: `${'á'.repeat(40)}1a`,
      }),
    ).toThrow();
    expect(hasPermission('STAFF', 'ARTICLE_MEDIA_UPLOAD')).toBe(true);
    expect(hasPermission('STAFF', 'PRODUCT_MANAGE')).toBe(false);
  });
  it('accepts normalized email or username login identifiers without changing auth semantics', () => {
    expect(loginSchema.parse({ email: 'ADMIN@EXAMPLE.COM', password: 'Secret123' })).toEqual({
      email: 'admin@example.com',
      password: 'Secret123',
    });
    expect(loginSchema.parse({ username: ' Admin_1 ', password: 'Secret123' })).toEqual({
      username: 'admin_1',
      password: 'Secret123',
    });
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'Secret123' })).toThrow();
  });
});