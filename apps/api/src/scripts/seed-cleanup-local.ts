import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  assertLocalCleanupAllowed,
  printSeedRuntime,
  seedRuntimeFromEnvironment,
} from '../seed/environment-safety.js';
import { cleanupLegacyInvalidActiveProducts } from '../seed/legacy-cleanup.js';

const runtime = seedRuntimeFromEnvironment();
printSeedRuntime(runtime);
assertLocalCleanupAllowed(runtime, process.argv.slice(2));

const prisma = new PrismaClient();
try {
  const result = await cleanupLegacyInvalidActiveProducts(prisma);
  process.stdout.write(JSON.stringify(result, null, 2));
  process.stdout.write('\n');
} finally {
  await prisma.$disconnect();
}
