import { describe, expect, it, vi } from 'vitest';
import { createSEOConfig } from '../core/config';
import { buildSitemap, normalizeSitemapEntry } from './builder';
import { createBookSitemapProvider } from './providers/book-provider';
import { createCategorySitemapProvider } from './providers/category-provider';
import { createPromotionSitemapProvider } from './providers/promotion-provider';
import { createStaticSitemapProvider } from './providers/static-provider';
import { validateSitemapEntries } from './validation';
import type { SitemapProvider } from './types';

const config = () => {
  const result = createSEOConfig({
    origin: 'https://hktstore.example',
    environment: 'production',
    indexingEnabled: true,
  });
  if (!result.ok) throw new Error('Expected test SEO config to be valid.');
  return result.value;
};

describe('sitemap providers', () => {
  it('returns public static entries only', () => {
    expect(createStaticSitemapProvider().getEntries()).toEqual([
      { url: '/', changeFrequency: 'weekly', priority: 1 },
      { url: '/san-pham', changeFrequency: 'daily', priority: 0.9 },
      { url: '/danh-muc', changeFrequency: 'weekly', priority: 0.8 },
    ]);
  });

  it('returns promotion entries separately from static entries', () => {
    expect(createPromotionSitemapProvider().getEntries()).toEqual([
      { url: '/khuyen-mai', changeFrequency: 'weekly', priority: 0.7 },
    ]);
  });

  it('maps categories without knowing other providers', async () => {
    const provider = createCategorySitemapProvider({
      getCategories: vi.fn(() =>
        Promise.resolve([{ id: '1', name: 'Văn học', slug: 'van-hoc', description: null }]),
      ),
    });

    await expect(provider.getEntries()).resolves.toEqual([
      { url: '/danh-muc/van-hoc', changeFrequency: 'weekly', priority: 0.7 },
    ]);
  });

  it('maps books without knowing other providers', async () => {
    const provider = createBookSitemapProvider({
      getProducts: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: '1',
              name: 'Atomic Habits',
              slug: 'atomic-habits',
              shortDescription: null,
              primaryImage: null,
              authors: [],
              minPrice: 100000,
              maxPrice: 100000,
              isNew: false,
              isFeatured: false,
              availability: { availableQuantity: 1, inStock: true, lowStock: false },
            },
          ],
          meta: { page: 1, pageSize: 100, total: 1 },
        }),
      ),
    });

    await expect(provider.getEntries()).resolves.toEqual([
      { url: '/sach/atomic-habits', changeFrequency: 'weekly', priority: 0.6 },
    ]);
  });
});

describe('sitemap builder', () => {
  it('normalizes relative URLs to the configured origin', () => {
    expect(normalizeSitemapEntry({ url: '/san-pham', priority: 0.9 }, config())).toMatchObject({
      ok: true,
      value: { url: 'https://hktstore.example/san-pham', priority: 0.9 },
    });
  });

  it('merges, deduplicates, sorts, and validates provider output', async () => {
    const providers: readonly SitemapProvider[] = [
      {
        name: 'first',
        getEntries: () => [
          { url: '/sach/b', changeFrequency: 'weekly', priority: 0.6 },
          { url: '/sach/a', changeFrequency: 'weekly', priority: 0.6 },
        ],
      },
      {
        name: 'duplicate',
        getEntries: () => [{ url: '/sach/a', changeFrequency: 'daily', priority: 0.5 }],
      },
    ];

    const result = await buildSitemap({ config: config(), providers });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.map((entry) => entry.url)).toEqual([
      'https://hktstore.example/sach/a',
      'https://hktstore.example/sach/b',
    ]);
    expect(result.value[0]).toMatchObject({ changeFrequency: 'weekly', priority: 0.6 });
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEO_SITEMAP_DUPLICATE_URL', severity: 'MAJOR' }),
      ]),
    );
  });

  it('allows empty provider output', async () => {
    const result = await buildSitemap({
      config: config(),
      providers: [{ name: 'empty', getEntries: () => [] }],
    });

    expect(result).toEqual({ ok: true, value: [], issues: [] });
  });

  it('preserves generation and reports provider failures as diagnostics', async () => {
    const result = await buildSitemap({
      config: config(),
      providers: [
        { name: 'broken', getEntries: () => Promise.reject(new Error('catalog unavailable')) },
        { name: 'static', getEntries: () => [{ url: '/san-pham', priority: 0.9 }] },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([{ url: 'https://hktstore.example/san-pham', priority: 0.9 }]);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEO_SITEMAP_PROVIDER_FAILED', severity: 'MAJOR' }),
      ]),
    );
  });

  it('returns builder diagnostics when validation reports non-blocking issues', async () => {
    const result = await buildSitemap({
      config: config(),
      providers: [{ name: 'minor', getEntries: () => [{ url: '/sach/a', priority: 2 }] }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEO_SITEMAP_PRIORITY_INVALID', severity: 'MINOR' }),
        expect.objectContaining({ code: 'SEO_SITEMAP_LAST_MODIFIED_MISSING', severity: 'INFO' }),
      ]),
    );
  });

  it('returns stable public entries from default providers with mocked data', async () => {
    const result = await buildSitemap({
      config: config(),
      providers: [
        createStaticSitemapProvider(),
        createPromotionSitemapProvider(),
        createCategorySitemapProvider({
          getCategories: vi.fn(() =>
            Promise.resolve([{ id: '1', name: 'Văn học', slug: 'van-hoc' }]),
          ),
        }),
        createBookSitemapProvider({
          getProducts: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: '1',
                  name: 'Atomic Habits',
                  slug: 'atomic-habits',
                  shortDescription: null,
                  primaryImage: null,
                  authors: [],
                  minPrice: 100000,
                  maxPrice: 100000,
                  isNew: false,
                  isFeatured: false,
                  availability: { availableQuantity: 1, inStock: true, lowStock: false },
                },
              ],
              meta: { page: 1, pageSize: 100, total: 1 },
            }),
          ),
        }),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((entry) => entry.url)).toEqual([
      'https://hktstore.example/',
      'https://hktstore.example/danh-muc',
      'https://hktstore.example/danh-muc/van-hoc',
      'https://hktstore.example/khuyen-mai',
      'https://hktstore.example/sach/atomic-habits',
      'https://hktstore.example/san-pham',
    ]);
    expect(result.value.map((entry) => entry.url)).not.toEqual(
      expect.arrayContaining([
        'https://hktstore.example/admin',
        'https://hktstore.example/tai-khoan',
        'https://hktstore.example/gio-hang',
        'https://hktstore.example/thanh-toan',
      ]),
    );
  });
});

describe('sitemap validation', () => {
  it('detects duplicate URLs before builder deduplication', () => {
    expect(
      validateSitemapEntries([
        { url: 'https://hktstore.example/sach/a' },
        { url: 'https://hktstore.example/sach/a' },
      ]),
    ).toMatchObject({
      ok: true,
      issues: [
        { code: 'SEO_SITEMAP_LAST_MODIFIED_MISSING', severity: 'INFO' },
        { code: 'SEO_SITEMAP_DUPLICATE_URL', severity: 'MAJOR' },
        { code: 'SEO_SITEMAP_LAST_MODIFIED_MISSING', severity: 'INFO' },
      ],
    });
  });

  it('blocks relative, malformed, localhost, and unsupported protocol URLs', () => {
    const result = validateSitemapEntries([
      { url: '/relative' },
      { url: 'https://[bad-url' },
      { url: 'http://localhost:3000/sach/a' },
      { url: 'ftp://hktstore.example/sach/a' },
    ]);

    expect(result.ok).toBe(false);
    const issueCodes = result.issues.map((issue) => issue.code);
    expect(issueCodes).toContain('SEO_SITEMAP_URL_ABSOLUTE_REQUIRED');
    expect(issueCodes).toContain('SEO_SITEMAP_URL_INVALID');
    expect(issueCodes).toContain('SEO_SITEMAP_LOCALHOST_URL');
    expect(issueCodes).toContain('SEO_SITEMAP_URL_PROTOCOL_INVALID');
  });

  it('reports invalid priority, invalid changeFrequency, and invalid lastModified as minor issues', () => {
    const result = validateSitemapEntries([
      {
        url: 'https://hktstore.example/sach/a',
        priority: 1.2,
        changeFrequency: 'sometimes' as never,
        lastModified: 'not-a-date',
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SEO_SITEMAP_PRIORITY_INVALID', severity: 'MINOR' }),
        expect.objectContaining({
          code: 'SEO_SITEMAP_CHANGE_FREQUENCY_INVALID',
          severity: 'MINOR',
        }),
        expect.objectContaining({
          code: 'SEO_SITEMAP_LAST_MODIFIED_INVALID',
          severity: 'MINOR',
        }),
      ]),
    );
  });

  it('reports missing lastModified as reusable non-blocking diagnostics', () => {
    expect(validateSitemapEntries([{ url: 'https://hktstore.example/' }])).toMatchObject({
      ok: true,
      issues: [{ code: 'SEO_SITEMAP_LAST_MODIFIED_MISSING', severity: 'INFO' }],
    });
  });
});