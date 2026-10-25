import { describe, expect, it } from 'vitest';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo';
import {
  expectAbsolutePublicUrl,
  metadataUrl,
  productionSEOConfig,
  productionOrigin,
} from './helpers';

const descriptors: readonly SEODescriptor[] = [
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
    description: 'Browse books.',
    canonicalPath: '/san-pham',
    published: true,
    indexable: true,
  },
  {
    type: 'book',
    title: 'Atomic Habits',
    description: 'Small habits, large outcomes.',
    canonicalPath: '/sach/atomic-habits',
    imagePath: '/covers/atomic-habits.webp',
    published: true,
    indexable: true,
  },
];

describe('SEO metadata regression consistency', () => {
  it('keeps title, description, canonical, Open Graph, and Twitter metadata internally aligned', () => {
    for (const descriptor of descriptors) {
      const result = buildSEOAssets(descriptor, productionSEOConfig());
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      const metadata = toNextMetadata(result.value.metadata);
      expect(metadata.title).toBe(result.value.metadata.title);
      expect(metadata.description).toBe(result.value.metadata.description);
      expect(metadata.alternates?.canonical).toBe(result.value.metadata.alternates.canonical);
      expect(metadata.openGraph?.url).toBe(result.value.metadata.alternates.canonical);
      expect(metadata.openGraph?.title).toBe(metadata.title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.twitter?.title).toBe(metadata.title);
      expect(metadata.twitter?.description).toBe(metadata.description);
    }
  });

  it('keeps every metadata URL on the configured production origin', () => {
    for (const descriptor of descriptors) {
      const result = buildSEOAssets(descriptor, productionSEOConfig());
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      const metadata = toNextMetadata(result.value.metadata);
      const urls = [
        metadataUrl(metadata.alternates?.canonical),
        metadataUrl(metadata.openGraph?.url),
        ...result.value.metadata.openGraph.images.map((image) => image.url),
        ...result.value.metadata.twitter.images,
      ];

      for (const url of urls) expectAbsolutePublicUrl(url);
    }
  });

  it('keeps metadataBase compatible with absolute production URLs when present', () => {
    const result = buildSEOAssets(descriptors[0]!, productionSEOConfig());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const metadata = toNextMetadata(result.value.metadata);
    if (metadata.metadataBase) expect(new URL(metadata.metadataBase).origin).toBe(productionOrigin);
    expect(metadataUrl(metadata.alternates?.canonical)).toBe(`${productionOrigin}/`);
    expect(metadataUrl(metadata.openGraph?.url)).toBe(`${productionOrigin}/`);
  });
});
