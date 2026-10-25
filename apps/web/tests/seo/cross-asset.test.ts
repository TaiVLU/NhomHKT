import { describe, expect, it } from 'vitest';
import { buildSEOAssets, type SEODescriptor } from '../../lib/seo';
import { buildSitemap } from '../../lib/seo/sitemap';
import { expectAbsolutePublicUrl, productionSEOConfig } from './helpers';

const publicDescriptors: readonly SEODescriptor[] = [
  {
    type: 'home',
    title: 'HKTStore',
    description: 'HKTStore bookstore.',
    canonicalPath: '/',
    published: true,
    indexable: true,
  },
  {
    type: 'catalog',
    title: 'Sach',
    description: 'Browse books at HKTStore.',
    canonicalPath: '/san-pham',
    published: true,
    indexable: true,
  },
  {
    type: 'category',
    title: 'Danh muc sach',
    description: 'Browse categories at HKTStore.',
    canonicalPath: '/danh-muc',
    published: true,
    indexable: true,
  },
  {
    type: 'page',
    title: 'Khuyen mai',
    description: 'Promotion updates at HKTStore.',
    canonicalPath: '/khuyen-mai',
    published: true,
    indexable: true,
  },
  {
    type: 'book',
    title: 'Atomic Habits',
    description: 'Small habits, large outcomes.',
    canonicalPath: '/sach/atomic-habits',
    published: true,
    indexable: true,
  },
  {
    type: 'category',
    title: 'Van hoc',
    description: 'Books in Van hoc.',
    canonicalPath: '/danh-muc/van-hoc',
    published: true,
    indexable: true,
  },
];

const noindexDescriptors: readonly SEODescriptor[] = [
  {
    type: 'catalog',
    title: 'Sach',
    description: 'Filtered catalog state.',
    canonicalPath: '/san-pham',
    published: true,
    indexable: false,
    follow: true,
  },
  {
    type: 'page',
    title: 'Tai khoan',
    description: 'Account area.',
    canonicalPath: '/tai-khoan',
    published: true,
    indexable: false,
    follow: false,
  },
  {
    type: 'page',
    title: 'Admin',
    description: 'Internal admin area.',
    canonicalPath: '/admin',
    published: true,
    indexable: false,
    follow: false,
    noarchive: true,
  },
  {
    type: 'page',
    title: 'Khong tim thay trang',
    description: 'Missing page.',
    canonicalPath: '/404',
    published: false,
    indexable: false,
    follow: false,
  },
];

describe('SEO cross-asset invariants', () => {
  it('keeps canonical, Open Graph, Twitter, and sitemap assets aligned per descriptor', () => {
    const config = productionSEOConfig();

    for (const descriptor of publicDescriptors) {
      const result = buildSEOAssets(descriptor, config);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      const { metadata, sitemapEntry } = result.value;
      expect(metadata.openGraph.url).toBe(metadata.alternates.canonical);
      expect(metadata.openGraph.title).toBe(metadata.title);
      expect(metadata.openGraph.description).toBe(metadata.description);
      expect(metadata.twitter.title).toBe(metadata.title);
      expect(metadata.twitter.description).toBe(metadata.description);
      expect(metadata.twitter.images).toEqual(metadata.openGraph.images.map((image) => image.url));
      expect(sitemapEntry?.url).toBe(metadata.alternates.canonical);
      expectAbsolutePublicUrl(metadata.alternates.canonical);
    }
  });

  it('keeps noindex descriptors out of sitemap assets', () => {
    const config = productionSEOConfig();

    for (const descriptor of noindexDescriptors) {
      const result = buildSEOAssets(descriptor, config);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      expect(result.value.metadata.robots.index).toBe(false);
      expect(result.value.sitemapEntry).toBeNull();
    }
  });

  it('keeps generated sitemap URLs absolute, clean, canonical, and on the configured origin', async () => {
    const result = await buildSitemap({
      config: productionSEOConfig(),
      providers: [
        {
          name: 'cross-asset',
          getEntries: () => [
            { url: '/', priority: 1 },
            { url: '/san-pham', priority: 0.9 },
            { url: '/danh-muc', priority: 0.8 },
            { url: '/khuyen-mai', priority: 0.7 },
            { url: '/danh-muc/van-hoc', priority: 0.7 },
            { url: '/sach/atomic-habits', priority: 0.6 },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const canonicalUrls = publicDescriptors.map((descriptor) => {
      const assets = buildSEOAssets(descriptor, productionSEOConfig());
      if (!assets.ok) throw new Error('Expected descriptor to build SEO assets.');
      return assets.value.metadata.alternates.canonical;
    });
    expect(result.value.map((entry) => entry.url)).toEqual([...canonicalUrls].sort());
    for (const entry of result.value) expectAbsolutePublicUrl(entry.url);
  });
});
