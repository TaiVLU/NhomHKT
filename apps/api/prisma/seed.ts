import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { runInitialAdminSeed } from '../src/modules/auth/auth-seed.service.js';

const values = z
  .object({
    INITIAL_ADMIN_USERNAME: z.string(),
    INITIAL_ADMIN_FULL_NAME: z.string(),
    INITIAL_ADMIN_EMAIL: z.string(),
    INITIAL_ADMIN_PHONE: z.string(),
    INITIAL_ADMIN_PASSWORD: z.string(),
  })
  .parse(process.env);
const prisma = new PrismaClient();
try {
  const result = await runInitialAdminSeed(prisma, {
    username: values.INITIAL_ADMIN_USERNAME,
    fullName: values.INITIAL_ADMIN_FULL_NAME,
    email: values.INITIAL_ADMIN_EMAIL,
    phone: values.INITIAL_ADMIN_PHONE,
    password: values.INITIAL_ADMIN_PASSWORD,
  });
  process.stdout.write(
    result === 'created'
      ? 'Initial Admin created.\n'
      : 'Initial Admin already exists; seed is idempotent.\n',
  );
} finally {
  await prisma.$disconnect();
}
