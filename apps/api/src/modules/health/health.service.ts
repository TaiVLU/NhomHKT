import type { PrismaClient } from '@prisma/client';

export interface HealthData {
  status: 'ok' | 'degraded';
  api: 'up';
  environment: 'valid';
  database: { status: 'up' | 'down'; error?: string };
  timestamp: string;
}

export interface HealthService {
  check(): Promise<HealthData>;
}

const safeDatabaseError = (error: unknown): string => {
  if (error instanceof Error) return error.name;
  return 'UnknownDatabaseError';
};

export const createHealthService = (database: PrismaClient): HealthService => ({
  async check() {
    try {
      await database.$queryRaw`SELECT 1 AS healthy`;
      return {
        status: 'ok',
        api: 'up',
        environment: 'valid',
        database: { status: 'up' },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'degraded',
        api: 'up',
        environment: 'valid',
        database: { status: 'down', error: safeDatabaseError(error) },
        timestamp: new Date().toISOString(),
      };
    }
  },
});
