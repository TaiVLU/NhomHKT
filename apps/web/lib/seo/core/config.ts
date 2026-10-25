import { seoError, seoIssue, seoOk, type SEOIssue, type SEOResult } from './result';

export type SEOEnvironmentName = 'development' | 'test' | 'production';

export interface SEOIndexingPolicy {
  enabled: boolean;
  defaultFollow: boolean;
}

export interface SEOConfig {
  siteName: string;
  brandName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultLocale: string;
  defaultLanguage: string;
  defaultOpenGraphImagePath: string;
  themeColor: string;
  origin: string;
  environment: SEOEnvironmentName;
  indexing: SEOIndexingPolicy;
  titleTemplate: string;
  descriptionFallbackTemplate: string;
}

export const DEFAULT_SEO_CONFIG: Omit<SEOConfig, 'origin' | 'environment' | 'indexing'> = {
  siteName: 'HKT Store',
  brandName: 'HKT Store',
  defaultTitle: 'HKT Store',
  defaultDescription: 'HKT Store - Sách chuẩn, gu chất',
  defaultLocale: 'vi_VN',
  defaultLanguage: 'vi',
  defaultOpenGraphImagePath: '/social-preview.png',
  themeColor: '#7a263a',
  titleTemplate: '%s | HKT Store',
  descriptionFallbackTemplate: 'Khám phá %s tại HKT Store',
};

export interface SEOConfigInput {
  siteName?: string;
  brandName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultLocale?: string;
  defaultLanguage?: string;
  defaultOpenGraphImagePath?: string;
  themeColor?: string;
  origin?: string;
  environment?: string;
  indexingEnabled?: boolean;
  titleTemplate?: string;
  descriptionFallbackTemplate?: string;
}

const PRODUCTION_BUILD_PHASE = 'phase-production-build';
const BUILD_FALLBACK_ORIGIN = 'https://hktstore.invalid';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export const normalizeOrigin = (origin: string): SEOResult<string> => {
  try {
    const url = new URL(origin.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      return seoError([
        seoIssue('SEO_ORIGIN_PROTOCOL_INVALID', 'SEO origin must use http or https.', 'origin'),
      ]);
    }
    if (url.pathname !== '/' || url.search || url.hash) {
      return seoError([
        seoIssue(
          'SEO_ORIGIN_PATH_INVALID',
          'SEO origin must not include a path, query, or hash.',
          'origin',
        ),
      ]);
    }
    return seoOk(url.origin.replace(/\/$/, ''));
  } catch {
    return seoError([seoIssue('SEO_ORIGIN_INVALID', 'SEO origin must be a valid URL.', 'origin')]);
  }
};

export const isLocalOrigin = (origin: string): boolean => {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

const normalizeEnvironment = (environment: string | undefined): SEOEnvironmentName => {
  if (environment === 'production' || environment === 'test') return environment;
  return 'development';
};

export const createSEOConfig = (input: SEOConfigInput = {}): SEOResult<SEOConfig> => {
  const environment = normalizeEnvironment(input.environment);
  const configuredOrigin = input.origin?.trim();
  const issues: SEOIssue[] = [];

  if (environment === 'production' && !configuredOrigin) {
    return seoError([
      seoIssue(
        'SEO_PRODUCTION_ORIGIN_REQUIRED',
        'Production SEO config requires an explicit public origin.',
        'origin',
      ),
    ]);
  }

  const origin = normalizeOrigin(configuredOrigin || 'http://localhost:3000');
  if (!origin.ok) return origin;

  if (environment === 'production' && isLocalOrigin(origin.value)) {
    return seoError([
      seoIssue(
        'SEO_PRODUCTION_ORIGIN_LOCALHOST',
        'Production SEO config must not use a localhost origin.',
        'origin',
      ),
    ]);
  }

  const safeIndexing =
    input.indexingEnabled ?? (environment === 'production' && !isLocalOrigin(origin.value));

  return seoOk(
    {
      ...DEFAULT_SEO_CONFIG,
      ...(input.siteName ? { siteName: input.siteName.trim() } : {}),
      ...(input.brandName ? { brandName: input.brandName.trim() } : {}),
      ...(input.defaultTitle ? { defaultTitle: input.defaultTitle.trim() } : {}),
      ...(input.defaultDescription ? { defaultDescription: input.defaultDescription.trim() } : {}),
      ...(input.defaultLocale ? { defaultLocale: input.defaultLocale.trim() } : {}),
      ...(input.defaultLanguage ? { defaultLanguage: input.defaultLanguage.trim() } : {}),
      ...(input.defaultOpenGraphImagePath
        ? { defaultOpenGraphImagePath: input.defaultOpenGraphImagePath.trim() }
        : {}),
      ...(input.themeColor ? { themeColor: input.themeColor.trim() } : {}),
      ...(input.titleTemplate ? { titleTemplate: input.titleTemplate.trim() } : {}),
      ...(input.descriptionFallbackTemplate
        ? { descriptionFallbackTemplate: input.descriptionFallbackTemplate.trim() }
        : {}),
      origin: origin.value,
      environment,
      indexing: { enabled: safeIndexing, defaultFollow: true },
    },
    issues,
  );
};

export const seoConfigFromEnvironment = (
  env: Record<string, string | undefined> = process.env,
): SEOResult<SEOConfig> => {
  const input: SEOConfigInput = {};
  if (env.NEXT_PUBLIC_SITE_URL) input.origin = env.NEXT_PUBLIC_SITE_URL;
  if (env.NODE_ENV) input.environment = env.NODE_ENV;
  return createSEOConfig(input);
};

export const seoRuntimeConfigFromEnvironment = (
  env: Record<string, string | undefined> = process.env,
): SEOResult<SEOConfig> => {
  const input: SEOConfigInput = { indexingEnabled: true };
  if (env.NEXT_PUBLIC_SITE_URL) input.origin = env.NEXT_PUBLIC_SITE_URL;
  if (env.NODE_ENV) input.environment = env.NODE_ENV;
  if (
    env.NODE_ENV === 'production' &&
    env.NEXT_PHASE === PRODUCTION_BUILD_PHASE &&
    !env.NEXT_PUBLIC_SITE_URL
  ) {
    input.origin = BUILD_FALLBACK_ORIGIN;
    input.indexingEnabled = false;
  }
  return createSEOConfig(input);
};