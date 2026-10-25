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

process.stdout.write(
  'The M5A catalog seed is retired; applying the canonical public demo catalog instead.\n',
);

const prisma = new PrismaClient();
try {
  await runDemoSeed(prisma);
  process.stdout.write('Canonical HKT Store demo seed complete.\n');
} finally {
  await prisma.$disconnect();
}