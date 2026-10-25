import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '../../app/robots';
import { buildSEOAssets } from '../../lib/seo/metadata';
import { buildSitemap, type SitemapProvider } from '../../lib/seo/sitemap';
import { seoRuntimeConfigFromEnvironment, type SEODescriptor } from '../../lib/seo';

const descriptor: SEODescriptor = {
  type: 'home',
  title: 'HKTStore',
  description: 'HKTStore bookstore.',
  canonicalPath: '/',
  published: true,
  indexable: true,
};

const provider: SitemapProvider = {
  name: 'environment-regression',
  getEntries: () => [{ url: '/', priority: 1 }],
};

const stubSEOEnvironment = (values: {
  readonly NODE_ENV: 'development' | 'test' | 'production';
  readonly NEXT_PUBLIC_SITE_URL?: string;
}) => {
  vi.stubEnv('NODE_ENV', values.NODE_ENV);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', values.NEXT_PUBLIC_SITE_URL ?? '');
};

describe('SEO environment regression safety', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed in production when public origin is missing', async () => {
    stubSEOEnvironment({ NODE_ENV: 'production' });

    expect(buildSEOAssets(descriptor)).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_REQUIRED', severity: 'BLOCKER' }],
    });
    await expect(buildSitemap({ providers: [provider] })).resolves.toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_REQUIRED', severity: 'BLOCKER' }],
    });
    expect(() => robots()).toThrow('Invalid robots SEO configuration.');
  });

  it('fails closed in production when public origin is invalid or localhost', async () => {
    stubSEOEnvironment({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    });

    expect(buildSEOAssets(descriptor)).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_LOCALHOST', severity: 'BLOCKER' }],
    });
    await expect(buildSitemap({ providers: [provider] })).resolves.toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_LOCALHOST', severity: 'BLOCKER' }],
    });
    expect(() => robots()).toThrow('Invalid robots SEO configuration.');
  });

  it('uses one production origin for metadata, sitemap, and robots', async () => {
    stubSEOEnvironment({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://hktstore.vn/',
    });

    const metadata = buildSEOAssets(descriptor);
    const sitemap = await buildSitemap({ providers: [provider] });
    const robotsPolicy = robots();

    expect(metadata.ok).toBe(true);
    expect(sitemap.ok).toBe(true);
    if (!metadata.ok || !sitemap.ok) return;

    expect(metadata.value.metadata.alternates.canonical).toBe('https://hktstore.vn/');
    expect(metadata.value.metadata.openGraph.url).toBe('https://hktstore.vn/');
    expect(sitemap.value.map((entry) => entry.url)).toEqual(['https://hktstore.vn/']);
    expect(robotsPolicy.sitemap).toBe('https://hktstore.vn/sitemap.xml');
    const seoUrls = [
      metadata.value.metadata.alternates.canonical,
      metadata.value.metadata.openGraph.url,
      ...sitemap.value.map((entry) => entry.url),
      ...(Array.isArray(robotsPolicy.sitemap) ? robotsPolicy.sitemap : [robotsPolicy.sitemap]),
    ].filter((url): url is string => typeof url === 'string');
    expect(seoUrls.some((url) => url.includes('localhost'))).toBe(false);
  });

  it('keeps development without a public origin usable on localhost', async () => {
    stubSEOEnvironment({ NODE_ENV: 'development' });

    const metadata = buildSEOAssets(descriptor);
    const sitemap = await buildSitemap({ providers: [provider] });
    const robotsPolicy = robots();

    expect(metadata.ok).toBe(true);
    expect(sitemap.ok).toBe(true);
    if (!metadata.ok || !sitemap.ok) return;

    expect(metadata.value.metadata.alternates.canonical).toBe('http://localhost:3000/');
    expect(metadata.value.metadata.robots).toEqual({ index: true, follow: true });
    expect(sitemap.value).toEqual([{ url: 'http://localhost:3000/', priority: 1 }]);
    expect(robotsPolicy.sitemap).toBe('http://localhost:3000/sitemap.xml');
  });

  it('keeps test configuration deterministic without a public origin', () => {
    stubSEOEnvironment({ NODE_ENV: 'test' });

    expect(seoRuntimeConfigFromEnvironment()).toMatchObject({
      ok: true,
      value: {
        origin: 'http://localhost:3000',
        environment: 'test',
        indexing: { enabled: true, defaultFollow: true },
      },
    });
  });

  it('uses a non-local noindex fallback during local production builds without a public origin', async () => {
    stubSEOEnvironment({ NODE_ENV: 'production' });
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');

    expect(seoRuntimeConfigFromEnvironment()).toMatchObject({
      ok: true,
      value: {
        origin: 'https://hktstore.invalid',
        environment: 'production',
        indexing: { enabled: false, defaultFollow: true },
      },
    });
    expect(buildSEOAssets(descriptor)).toMatchObject({
      ok: true,
      value: {
        metadata: {
          alternates: { canonical: 'https://hktstore.invalid/' },
          robots: { index: false, follow: true },
        },
        sitemapEntry: null,
      },
    });
    await expect(buildSitemap({ providers: [provider] })).resolves.toEqual({
      ok: true,
      value: [],
      issues: [],
    });
    expect(robots().sitemap).toBeUndefined();
  });
});
