import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { printSeedRuntime, seedRuntimeFromEnvironment } from '../seed/environment-safety.js';
import { printSeedValidationReport, validateSeedData } from '../seed/validation.js';

const runtime = seedRuntimeFromEnvironment();
printSeedRuntime(runtime);

const prisma = new PrismaClient();
try {
  const report = await validateSeedData(prisma);
  printSeedValidationReport(report);
  if (report.blocking) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
