import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import {
  demoPrivilegedUserEnvironmentSchema,
  seedDemoPrivilegedUsers,
} from '../src/seed/demo-privileged-users.js';

const validEnvironment = {
  NODE_ENV: 'test',
  M3_DEMO_ADMIN_USERNAME: 'hktstore_admin',
  M3_DEMO_ADMIN_EMAIL: 'admin.hktstore@gmail.com',
  M3_DEMO_ADMIN_PASSWORD: 'LocalAdmin123',
  M3_DEMO_STAFF_USERNAME: 'hktstore_staff',
  M3_DEMO_STAFF_EMAIL: 'staff.hktstore@gmail.com',
  M3_DEMO_STAFF_PASSWORD: 'LocalStaff123',
} as const;

interface RecordedUserUpsert {
  where: { id: bigint };
  update: { email: string; passwordHash: string; role: string; status: string };
}

describe('local privileged demo users', () => {
  it('requires distinct valid emails and current password strength', () => {
    expect(demoPrivilegedUserEnvironmentSchema.parse(validEnvironment)).toMatchObject({
      M3_DEMO_ADMIN_EMAIL: 'admin.hktstore@gmail.com',
      M3_DEMO_STAFF_EMAIL: 'staff.hktstore@gmail.com',
    });
    expect(() =>
      demoPrivilegedUserEnvironmentSchema.parse({
        ...validEnvironment,
        M3_DEMO_STAFF_EMAIL: validEnvironment.M3_DEMO_ADMIN_EMAIL,
      }),
    ).toThrow();
    expect(() =>
      demoPrivilegedUserEnvironmentSchema.parse({
        ...validEnvironment,
        M3_DEMO_ADMIN_EMAIL: 'not-an-email',
      }),
    ).toThrow();
    expect(() =>
      demoPrivilegedUserEnvironmentSchema.parse({
        ...validEnvironment,
        M3_DEMO_ADMIN_PASSWORD: 'letters-only',
      }),
    ).toThrow();
  });

  it('updates matched identities in place with active Admin and Staff roles', async () => {
    const ids = [101n, 102n];
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ id: ids[0] }])
      .mockResolvedValueOnce([{ id: ids[1] }]);
    const recorded: RecordedUserUpsert[] = [];
    const upsert = vi.fn((input: RecordedUserUpsert) => {
      recorded.push(input);
      return Promise.resolve({});
    });
    const prisma = { user: { findMany, upsert } } as unknown as PrismaClient;

    await seedDemoPrivilegedUsers(
      prisma,
      demoPrivilegedUserEnvironmentSchema.parse(validEnvironment),
    );

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      where: { id: ids[0] },
      update: {
        email: validEnvironment.M3_DEMO_ADMIN_EMAIL,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    expect(upsert.mock.calls[1]?.[0]).toMatchObject({
      where: { id: ids[1] },
      update: {
        email: validEnvironment.M3_DEMO_STAFF_EMAIL,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });
    expect(recorded[0]?.update.passwordHash).not.toBe('LocalAdmin123');
    expect(recorded[1]?.update.passwordHash).not.toBe('LocalStaff123');
  });

  it('refuses a split identity instead of deleting or merging referenced users', async () => {
    const upsert = vi.fn();
    const prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([{ id: 1n }, { id: 2n }]),
        upsert,
      },
    } as unknown as PrismaClient;
    await expect(
      seedDemoPrivilegedUsers(prisma, demoPrivilegedUserEnvironmentSchema.parse(validEnvironment)),
    ).rejects.toThrow('identify different existing users');
    expect(upsert).not.toHaveBeenCalled();
  });
});