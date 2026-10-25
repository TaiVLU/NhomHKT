import { seoRuntimeConfigFromEnvironment, type SEOConfig } from '../core/config';
import { seoError, seoIssue, seoOk, type SEOIssue, type SEOResult } from '../core/result';
import { resolveAbsoluteUrl } from '../core/url-resolver';
import { validateSitemapEntries } from './validation';
import { createBookSitemapProvider } from './providers/book-provider';
import { createCategorySitemapProvider } from './providers/category-provider';
import { createPromotionSitemapProvider } from './providers/promotion-provider';
import { createStaticSitemapProvider } from './providers/static-provider';
import type { NormalizedSitemapEntry, SitemapEntry, SitemapProvider } from './types';

export interface BuildSitemapOptions {
  readonly config?: SEOConfig;
  readonly providers?: readonly SitemapProvider[];
}

const defaultConfig = (): SEOResult<SEOConfig> => seoRuntimeConfigFromEnvironment();

const normalizeLastModified = (value: SitemapEntry['lastModified']): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

export const normalizeSitemapEntry = (
  entry: SitemapEntry,
  config: SEOConfig,
): SEOResult<NormalizedSitemapEntry> => {
  const url = resolveAbsoluteUrl(config, entry.url, 'sitemap.url');
  if (!url.ok) return url;

  const lastModified = normalizeLastModified(entry.lastModified);
  const normalized: NormalizedSitemapEntry = {
    url: url.value,
    ...(entry.changeFrequency ? { changeFrequency: entry.changeFrequency } : {}),
    ...(entry.priority !== undefined ? { priority: entry.priority } : {}),
    ...(lastModified ? { lastModified } : {}),
  };
  return seoOk(normalized);
};

const dedupeByUrl = (
  entries: readonly NormalizedSitemapEntry[],
): readonly NormalizedSitemapEntry[] => {
  const byUrl = new Map<string, NormalizedSitemapEntry>();
  for (const entry of entries) {
    if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
  }
  return [...byUrl.values()];
};

const sortEntries = (
  entries: readonly NormalizedSitemapEntry[],
): readonly NormalizedSitemapEntry[] =>
  [...entries].sort((left, right) => left.url.localeCompare(right.url));

export const defaultSitemapProviders = (): readonly SitemapProvider[] => [
  createStaticSitemapProvider(),
  createPromotionSitemapProvider(),
  createCategorySitemapProvider(),
  createBookSitemapProvider(),
];

export const buildSitemap = async (
  options: BuildSitemapOptions = {},
): Promise<SEOResult<readonly NormalizedSitemapEntry[]>> => {
  const config = options.config ? seoOk(options.config) : defaultConfig();
  if (!config.ok) return config;
  if (!config.value.indexing.enabled) return seoOk([]);

  const providers = options.providers ?? defaultSitemapProviders();
  const issues: SEOIssue[] = [];
  const providerResults = await Promise.allSettled(
    providers.map((provider) => Promise.resolve(provider.getEntries())),
  );
  const rawEntries = providerResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    issues.push(
      seoIssue(
        'SEO_SITEMAP_PROVIDER_FAILED',
        `Sitemap provider ${providers[index]?.name ?? 'unknown'} failed.`,
        'provider',
        'MAJOR',
      ),
    );
    return [];
  });
  const normalized: NormalizedSitemapEntry[] = [];

  for (const entry of rawEntries) {
    const result = normalizeSitemapEntry(entry, config.value);
    if (!result.ok) {
      return seoError([
        seoIssue('SEO_SITEMAP_NORMALIZATION_FAILED', 'Sitemap normalization failed.', 'sitemap'),
        ...result.issues,
      ]);
    }
    normalized.push(result.value);
  }

  const validation = validateSitemapEntries(normalized, {
    allowLocalhost: config.value.environment !== 'production',
  });
  if (!validation.ok) return seoError([...issues, ...validation.issues]);

  const deduped = dedupeByUrl(validation.value);
  const sorted = sortEntries(deduped);
  return seoOk(sorted, [...issues, ...validation.issues]);
};
