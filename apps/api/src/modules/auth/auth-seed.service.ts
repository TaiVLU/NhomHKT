import type { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth.crypto.js';
import { registerSchema } from './auth.schema.js';

export interface InitialAdminInput {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export const runInitialAdminSeed = async (
  prisma: PrismaClient,
  raw: InitialAdminInput,
): Promise<'created' | 'existing'> => {
  const input = registerSchema.parse(raw);
  if (!input.username) throw new Error('Initial Admin username is required');
  const matches = await prisma.user.findMany({
    where: { OR: [{ username: input.username }, { email: input.email }, { phone: input.phone }] },
  });
  if (matches.length > 0) {
    if (
      matches.length !== 1 ||
      matches[0]?.username !== input.username ||
      matches[0].email !== input.email ||
      matches[0].phone !== input.phone ||
      matches[0].role !== 'ADMIN'
    )
      throw new Error('Initial Admin identity conflict');
    return 'existing';
  }
  const admin = await prisma.user.create({
    data: {
      username: input.username,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'INITIAL_ADMIN_SEEDED',
      entityType: 'User',
      entityId: admin.id.toString(),
    },
  });
  return 'created';
};
