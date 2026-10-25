import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../modules/auth/auth.crypto.js';

const demoPassword = z
  .string()
  .min(8)
  .max(64)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'maximum 72 UTF-8 bytes')
  .refine(
    (value) => /[A-Za-zÀ-ỹ]/u.test(value) && /\d/u.test(value),
    'must contain letters and digits',
  );

export const demoPrivilegedUserEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test']).default('development'),
    M3_DEMO_ADMIN_USERNAME: z
      .string()
      .trim()
      .min(5)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
    M3_DEMO_ADMIN_EMAIL: z
      .email()
      .trim()
      .transform((value) => value.toLowerCase()),
    M3_DEMO_ADMIN_PASSWORD: demoPassword,
    M3_DEMO_STAFF_USERNAME: z
      .string()
      .trim()
      .min(5)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
    M3_DEMO_STAFF_EMAIL: z
      .email()
      .trim()
      .transform((value) => value.toLowerCase()),
    M3_DEMO_STAFF_PASSWORD: demoPassword,
  })
  .refine((value) => value.M3_DEMO_ADMIN_EMAIL !== value.M3_DEMO_STAFF_EMAIL, {
    path: ['M3_DEMO_STAFF_EMAIL'],
    message: 'Admin and Staff email addresses must differ',
  })
  .refine((value) => value.M3_DEMO_ADMIN_USERNAME !== value.M3_DEMO_STAFF_USERNAME, {
    path: ['M3_DEMO_STAFF_USERNAME'],
    message: 'Admin and Staff usernames must differ',
  });

export type DemoPrivilegedUserEnvironment = z.infer<typeof demoPrivilegedUserEnvironmentSchema>;

const accountSpecs = (input: DemoPrivilegedUserEnvironment) => [
  {
    username: input.M3_DEMO_ADMIN_USERNAME.toLowerCase(),
    email: input.M3_DEMO_ADMIN_EMAIL,
    password: input.M3_DEMO_ADMIN_PASSWORD,
    role: 'ADMIN' as const,
    phone: '+84910000001',
    fullName: 'HKTStore Local Admin',
  },
  {
    username: input.M3_DEMO_STAFF_USERNAME.toLowerCase(),
    email: input.M3_DEMO_STAFF_EMAIL,
    password: input.M3_DEMO_STAFF_PASSWORD,
    role: 'STAFF' as const,
    phone: '+84910000002',
    fullName: 'HKTStore Local Staff',
  },
];

export const seedDemoPrivilegedUsers = async (
  prisma: PrismaClient,
  input: DemoPrivilegedUserEnvironment,
): Promise<void> => {
  for (const account of accountSpecs(input)) {
    const matches = await prisma.user.findMany({
      where: {
        OR: [{ username: account.username }, { email: account.email }, { phone: account.phone }],
      },
      select: { id: true },
    });
    if (matches.length > 1) {
      throw new Error(
        `Demo ${account.role} username, email, and phone identify different existing users.`,
      );
    }

    const passwordHash = await hashPassword(account.password);
    await prisma.user.upsert({
      where: { id: matches[0]?.id ?? 0n },
      create: {
        username: account.username,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        passwordHash,
        role: account.role,
        status: 'ACTIVE',
      },
      update: {
        username: account.username,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        passwordHash,
        role: account.role,
        status: 'ACTIVE',
      },
    });
  }
};
