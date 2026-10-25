import { describe, expect, it } from 'vitest';
import type { Address, User } from '@prisma/client';
import { addressSchema, profilePatchSchema } from '../src/modules/account/account.schema.js';
import { addressDto, profileDto } from '../src/modules/account/account.service.js';

describe('M4 account validation and safe DTO', () => {
  it('accepts only approved profile fields and rejects future birthday', () => {
    expect(profilePatchSchema.parse({ fullName: ' Nguyễn Văn A ', phone: '0901234567' })).toEqual({
      fullName: 'Nguyễn Văn A',
      phone: '+84901234567',
    });
    expect(() => profilePatchSchema.parse({ email: 'new@example.com' })).toThrow();
    expect(() => profilePatchSchema.parse({ birthday: '2999-01-01' })).toThrow();
  });
  it('validates addresses and serializes BIGINT without sensitive User fields', () => {
    const input = addressSchema.parse({
      recipientName: 'A B',
      phone: '0901234567',
      line1: '1 Main',
      ward: 'W',
      district: 'D',
      province: 'P',
    });
    expect(input.phone).toBe('+84901234567');
    expect(() => addressSchema.parse({ ...input, userId: '1' })).toThrow();
    const now = new Date();
    const user = {
      id: 9007199254740993n,
      username: 'customer',
      fullName: 'A B',
      email: 'a@test.local',
      phone: '+84901234567',
      passwordHash: 'secret',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      birthday: null,
      gender: null,
      cancellationCount: 0,
      riskFlag: false,
      createdAt: now,
      updatedAt: now,
    } satisfies User;
    expect(profileDto(user)).not.toHaveProperty('passwordHash');
    expect(profileDto(user).id).toBe('9007199254740993');
    const address = {
      id: 9n,
      userId: 1n,
      ...input,
      postalCode: null,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } satisfies Address;
    expect(addressDto(address).id).toBe('9');
  });
});
