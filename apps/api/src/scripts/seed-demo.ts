import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  assertNonProductionSeed,
  printSeedRuntime,
  seedRuntimeFromEnvironment,
} from '../seed/environment-safety.js';
import { runDemoSeed } from '../seed/demo-seed.js';

const runtime = seedRuntimeFromEnvironment();
printSeedRuntime(runtime);
assertNonProductionSeed(runtime);

const prisma = new PrismaClient();
try {
  await runDemoSeed(prisma);
  process.stdout.write('M6 demo seed complete.\n');
} finally {
  await prisma.$disconnect();
}
