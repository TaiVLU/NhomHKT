import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  demoPrivilegedUserEnvironmentSchema,
  seedDemoPrivilegedUsers,
} from '../seed/demo-privileged-users.js';

const input = demoPrivilegedUserEnvironmentSchema.parse(process.env);

const prisma = new PrismaClient();
try {
  await seedDemoPrivilegedUsers(prisma, input);
  process.stdout.write('M3 local demo users are ready.\n');
} finally {
  await prisma.$disconnect();
}
