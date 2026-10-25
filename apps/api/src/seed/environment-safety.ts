export interface DatabaseTarget {
  readonly host: string;
  readonly database: string;
  readonly safeForLocalMutation: boolean;
}

export interface SeedRuntime {
  readonly nodeEnv: string;
  readonly databaseUrl: string;
  readonly target: DatabaseTarget;
}

const localHostPatterns = [/^localhost$/i, /^127\./, /^::1$/];
const safeDatabasePatterns = [/hktstore/i, /local/i, /dev/i, /test/i, /demo/i];

export const databaseTargetFromUrl = (databaseUrl: string): DatabaseTarget => {
  const sqlServerMatch = /^sqlserver:\/\/([^;:/?]+)(?::\d+)?(?:[;/?]|$)/i.exec(databaseUrl);
  let host = sqlServerMatch?.[1] ?? '';
  let parsed: URL | null = null;
  try {
    parsed = new URL(databaseUrl);
    host = parsed.hostname || host;
  } catch {
    if (!host) throw new Error('DATABASE_URL is not a valid SQL Server URL.');
  }
  const semicolonDatabase = /(?:^|;)database=([^;?]+)/i.exec(databaseUrl)?.[1];
  const database =
    parsed?.searchParams.get('database') ??
    parsed?.searchParams.get('initial catalog') ??
    parsed?.searchParams.get('Database') ??
    semicolonDatabase ??
    '';
  const safeForLocalMutation =
    localHostPatterns.some((pattern) => pattern.test(host)) &&
    safeDatabasePatterns.some((pattern) => pattern.test(database));

  return { host, database, safeForLocalMutation };
};

export const seedRuntimeFromEnvironment = (
  source: NodeJS.ProcessEnv = process.env,
): SeedRuntime => {
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for seed scripts.');
  const nodeEnv = source.NODE_ENV ?? 'development';
  return {
    nodeEnv,
    databaseUrl,
    target: databaseTargetFromUrl(databaseUrl),
  };
};

export const printSeedRuntime = (runtime: SeedRuntime): void => {
  process.stdout.write(
    `Seed environment: NODE_ENV=${runtime.nodeEnv}, database=${runtime.target.database || '(unknown)'}, host=${runtime.target.host}\n`,
  );
};

export const assertNonProductionSeed = (runtime: SeedRuntime): void => {
  if (runtime.nodeEnv === 'production') {
    throw new Error('Seed command refused: NODE_ENV=production is not allowed.');
  }
};

export const assertLocalCleanupAllowed = (runtime: SeedRuntime, args: readonly string[]): void => {
  assertNonProductionSeed(runtime);
  if (!runtime.target.safeForLocalMutation) {
    throw new Error(
      'Cleanup refused: database target is not recognized as local/demo/test. Use a local HKTStore database.',
    );
  }
  if (!args.includes('--confirm-local-cleanup')) {
    throw new Error(
      'Cleanup refused: pass --confirm-local-cleanup to mutate scoped legacy residue.',
    );
  }
};
