import { describe, expect, it } from 'vitest';
import { toNextMetadata } from '../adapters/next-metadata-adapter';
import { createSEOConfig, normalizeOrigin } from './config';
import { validateSEOAssetConsistency } from './consistency';
import type { SEOAssets, SEODescriptor } from './descriptor';
import { buildSEOAssets } from './pipeline';
import { hasBlockingSEOIssue, hasSEOQualityGateIssue, seoOk } from './result';
import { normalizePath, resolveAbsoluteUrl } from './url-resolver';
import { validateSEODescriptor } from './validation';

const config = () => {
  const result = createSEOConfig({
    origin: 'https://hktstore.example',
    environment: 'production',
    indexingEnabled: true,
  });
  if (!result.ok) throw new Error('Test SEO config should be valid.');
  return result.value;
};

const descriptor = (overrides: Partial<SEODescriptor> = {}): SEODescriptor => ({
  type: 'book',
  title: 'Clean Architecture',
  description: 'A practical software design book',
  canonicalPath: '/sach/clean-architecture',
  imagePath: '/covers/clean-architecture.webp',
  published: true,
  indexable: true,
  updatedAt: '2026-07-20T00:00:00.000Z',
  ...overrides,
});

describe('SEO core platform', () => {
  it('creates safe environment-aware config and validates origins', () => {
    expect(
      createSEOConfig({ origin: 'https://hktstore.vn/', environment: 'production' }),
    ).toMatchObject({
      ok: true,
      value: { origin: 'https://hktstore.vn', indexing: { enabled: true } },
    });
    expect(createSEOConfig({ environment: 'production' })).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_REQUIRED', severity: 'BLOCKER' }],
    });
    expect(
      createSEOConfig({ origin: 'http://localhost:3000', environment: 'production' }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_ORIGIN_LOCALHOST', severity: 'BLOCKER' }],
    });
    expect(normalizeOrigin('https://hktstore.vn/path')).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_ORIGIN_PATH_INVALID', severity: 'BLOCKER' }],
    });
  });

  it('normalizes and resolves paths deterministically and idempotently', () => {
    expect(normalizePath('/sach//clean-architecture/')).toEqual(seoOk('/sach/clean-architecture'));
    expect(normalizePath('/sach/clean-architecture')).toEqual(seoOk('/sach/clean-architecture'));
    expect(resolveAbsoluteUrl(config(), '/book-placeholder.svg')).toEqual(
      seoOk('https://hktstore.example/book-placeholder.svg'),
    );
    expect(normalizePath('https://evil.example/book')).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PATH_ABSOLUTE_REQUIRED', severity: 'BLOCKER' }],
    });
    expect(normalizePath('/sach/book?q=1')).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PATH_CLEAN_REQUIRED', severity: 'BLOCKER' }],
    });
  });

  it('rejects invalid critical descriptor data', () => {
    expect(validateSEODescriptor(descriptor({ title: '   ' }))).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_TITLE_REQUIRED', severity: 'BLOCKER' }],
    });
    expect(
      validateSEODescriptor(descriptor({ canonicalPath: '//external.example' })),
    ).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PATH_INVALID', severity: 'BLOCKER' }],
    });
    expect(
      validateSEODescriptor(descriptor({ imagePath: 'https://[bad-image-url' })),
    ).toMatchObject({
      ok: true,
      issues: [{ code: 'SEO_IMAGE_URL_INVALID', severity: 'MAJOR' }],
    });
  });

  it('builds all SEO assets from one normalized descriptor deterministically', () => {
    const result = buildSEOAssets(descriptor(), config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.descriptor.title).toBe('Clean Architecture | HKT Store');
    expect(result.value.metadata.alternates.canonical).toBe(
      'https://hktstore.example/sach/clean-architecture',
    );
    expect(result.value.metadata.openGraph.url).toBe(result.value.metadata.alternates.canonical);
    expect(result.value.metadata.twitter.images).toEqual([
      'https://hktstore.example/covers/clean-architecture.webp',
    ]);
    expect(result.value.sitemapEntry).toEqual({
      url: 'https://hktstore.example/sach/clean-architecture',
      lastModified: '2026-07-20T00:00:00.000Z',
    });
    expect(buildSEOAssets(descriptor(), config())).toEqual(result);
  });

  it('preserves Vietnamese descriptor text through asset generation', () => {
    const result = buildSEOAssets(
      descriptor({
        title: 'Dế Mèn Phiêu Lưu Ký',
        description: 'Tác phẩm thiếu nhi kinh điển của văn học Việt Nam',
        canonicalPath: '/sach/de-men-phieu-luu-ky',
      }),
      config(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.metadata.title).toBe('Dế Mèn Phiêu Lưu Ký | HKT Store');
    expect(result.value.metadata.description).toBe(
      'Tác phẩm thiếu nhi kinh điển của văn học Việt Nam',
    );
    expect(result.value.metadata.openGraph.title).toBe(result.value.metadata.title);
  });

  it('uses safe fallbacks without making private or unpublished descriptors indexable', () => {
    const result = buildSEOAssets(
      {
        type: 'book',
        title: 'Clean Architecture',
        canonicalPath: '/sach/clean-architecture',
        published: false,
        indexable: true,
      },
      config(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEO_UNPUBLISHED_INDEXABLE', severity: 'MAJOR' }),
        expect.objectContaining({ code: 'SEO_DESCRIPTION_FALLBACK_APPLIED', severity: 'INFO' }),
        expect.objectContaining({ code: 'SEO_IMAGE_FALLBACK_APPLIED', severity: 'INFO' }),
      ]),
    );
    expect(result.value.metadata.description).toBe('Khám phá Clean Architecture tại HKT Store');
    expect(result.value.metadata.openGraph.images[0]?.url).toBe(
      'https://hktstore.example/social-preview.png',
    );
    expect(result.value.metadata.robots.index).toBe(false);
    expect(result.value.metadata.robots.follow).toBe(true);
    expect(result.value.sitemapEntry).toBeNull();
    expect(hasBlockingSEOIssue(result.issues)).toBe(false);
    expect(hasSEOQualityGateIssue(result.issues)).toBe(true);
  });

  it('supports noindex nofollow and noarchive robots policies', () => {
    const result = buildSEOAssets(
      descriptor({
        type: 'page',
        title: 'Admin',
        canonicalPath: '/admin',
        published: true,
        indexable: false,
        follow: false,
        noarchive: true,
      }),
      config(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.metadata.robots).toEqual({
      index: false,
      follow: false,
      noarchive: true,
    });
    expect(result.value.sitemapEntry).toBeNull();
    expect(toNextMetadata(result.value.metadata)).toMatchObject({
      robots: { index: false, follow: false, noarchive: true },
    });
  });

  it('keeps development and test indexing disabled by default', () => {
    const development = createSEOConfig({
      origin: 'https://dev.hktstore.example',
      environment: 'development',
    });
    const test = createSEOConfig({ origin: 'https://test.hktstore.example', environment: 'test' });
    expect(development).toMatchObject({ ok: true, value: { indexing: { enabled: false } } });
    expect(test).toMatchObject({ ok: true, value: { indexing: { enabled: false } } });
  });

  it('detects asset consistency defects and adapts only at the Next.js boundary', () => {
    const result = buildSEOAssets(descriptor(), config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const broken: SEOAssets = {
      ...result.value,
      metadata: {
        ...result.value.metadata,
        alternates: { canonical: 'https://hktstore.example/other' },
      },
      structuredData: null,
      structuredDataJson: null,
    };
    expect(validateSEOAssetConsistency(broken)).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_CANONICAL_MISMATCH', severity: 'BLOCKER' }],
    });

    expect(toNextMetadata(result.value.metadata)).toMatchObject({
      title: 'Clean Architecture | HKT Store',
      alternates: { canonical: 'https://hktstore.example/sach/clean-architecture' },
      robots: { index: true, follow: true },
      openGraph: { url: 'https://hktstore.example/sach/clean-architecture' },
    });
  });

  it('distinguishes MAJOR consistency issues from BLOCKER asset failures', () => {
    const result = buildSEOAssets(descriptor(), config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const majorOnly: SEOAssets = {
      ...result.value,
      descriptor: {
        ...result.value.descriptor,
        sitemapEligible: false,
      },
      structuredData: result.value.structuredData,
      structuredDataJson: result.value.structuredDataJson,
    };
    const checked = validateSEOAssetConsistency(majorOnly, config());
    expect(checked).toMatchObject({
      ok: true,
      issues: [{ code: 'SEO_SITEMAP_ELIGIBILITY_MISMATCH', severity: 'MAJOR' }],
    });
    expect(hasBlockingSEOIssue(checked.issues)).toBe(false);
    expect(hasSEOQualityGateIssue(checked.issues)).toBe(true);
  });

  it('blocks production assets that leak local-origin URLs', () => {
    const result = buildSEOAssets(descriptor(), config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const localLeak: SEOAssets = {
      ...result.value,
      descriptor: {
        ...result.value.descriptor,
        canonicalUrl: 'http://localhost:3000/sach/clean-architecture',
      },
      metadata: {
        ...result.value.metadata,
        alternates: { canonical: 'http://localhost:3000/sach/clean-architecture' },
        openGraph: {
          ...result.value.metadata.openGraph,
          url: 'http://localhost:3000/sach/clean-architecture',
        },
      },
      structuredData: null,
      structuredDataJson: null,
    };
    expect(validateSEOAssetConsistency(localLeak, config())).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_PRODUCTION_LOCAL_URL_LEAK', severity: 'BLOCKER' }],
    });
  });

  it('blocks asset output for BLOCKER issues', () => {
    const result = buildSEOAssets(descriptor({ title: '' }), config());
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'SEO_TITLE_REQUIRED', severity: 'BLOCKER' }],
    });
    expect(hasBlockingSEOIssue(result.issues)).toBe(true);
  });
});