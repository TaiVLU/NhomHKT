import { describe, expect, it } from 'vitest';
import { buildSEOAssets, type SEODescriptor } from '../../lib/seo';
import { buildSitemap } from '../../lib/seo/sitemap';
import { productionOrigin, productionSEOConfig } from './helpers';

const productDescriptor = (): SEODescriptor => ({
  type: 'book',
  title: 'Atomic Habits',
  description: 'Small habits, large outcomes.',
  canonicalPath: '/sach/atomic-habits',
  imagePath: '/covers/atomic-habits.webp',
  published: true,
  indexable: true,
  structuredData: {
    enabled: true,
    site: { name: 'HKTStore', url: productionOrigin },
    breadcrumb: {
      items: [
        { name: 'Home', url: productionOrigin },
        { name: 'Books', url: `${productionOrigin}/san-pham` },
        { name: 'Atomic Habits', url: `${productionOrigin}/sach/atomic-habits` },
      ],
    },
    productBook: {
      authors: [{ name: 'James Clear' }],
      publisher: { name: 'Avery' },
      primaryImage: `${productionOrigin}/covers/atomic-habits.webp`,
      variants: [{ sku: 'ATOMIC-HABITS', isbn: '9780735211292', salePrice: 205000, inStock: true }],
    },
  },
});

describe('structured data SEO regression', () => {
  it('certifies product structured data against metadata and canonical assets', () => {
    const result = buildSEOAssets(productDescriptor(), productionSEOConfig());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const canonical = result.value.metadata.alternates.canonical;
    const graph = JSON.parse(result.value.structuredDataJson ?? '') as {
      '@graph': Array<{
        '@type': string;
        '@id': string;
        url?: string;
        image?: string[];
        itemListElement?: Array<{ item: string }>;
      }>;
    };
    const product = graph['@graph'].find((node) => node['@type'] === 'Product');
    const book = graph['@graph'].find((node) => node['@type'] === 'Book');
    const offer = graph['@graph'].find((node) => node['@type'] === 'Offer');
    const breadcrumb = graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    const organization = graph['@graph'].find((node) => node['@type'] === 'Organization');
    const website = graph['@graph'].find((node) => node['@type'] === 'WebSite');

    expect(product?.url).toBe(canonical);
    expect(book?.url).toBe(canonical);
    expect(offer?.url).toBe(canonical);
    expect(product?.image?.[0]).toBe(result.value.metadata.openGraph.images[0]?.url);
    expect(product?.image?.[0]).toBe(result.value.metadata.twitter.images[0]);
    expect(breadcrumb?.itemListElement?.at(-1)?.item).toBe(canonical);
    expect(organization?.url).toBe(website?.url);
    expect(new Set(graph['@graph'].map((node) => node['@id'])).size).toBe(graph['@graph'].length);
  });

  it('certifies collection structured data against sitemap canonical eligibility', async () => {
    const descriptor: SEODescriptor = {
      type: 'category',
      title: 'Van hoc',
      description: 'Books in Van hoc.',
      canonicalPath: '/danh-muc/van-hoc',
      published: true,
      indexable: true,
      structuredData: {
        enabled: true,
        collection: {
          items: [
            { name: 'Atomic Habits', url: `${productionOrigin}/sach/atomic-habits` },
            { name: 'Deep Work', url: `${productionOrigin}/sach/deep-work` },
          ],
        },
      },
    };
    const assets = buildSEOAssets(descriptor, productionSEOConfig());
    const sitemap = await buildSitemap({
      config: productionSEOConfig(),
      providers: [
        {
          name: 'structured-data-regression',
          getEntries: () => [{ url: '/danh-muc/van-hoc' }],
        },
      ],
    });

    expect(assets.ok).toBe(true);
    expect(sitemap.ok).toBe(true);
    if (!assets.ok || !sitemap.ok) return;
    const canonical = assets.value.metadata.alternates.canonical;
    const graph = JSON.parse(assets.value.structuredDataJson ?? '') as {
      '@graph': Array<{ '@type': string; url?: string }>;
    };
    expect(sitemap.value.map((entry) => entry.url)).toEqual([canonical]);
    expect(graph['@graph'].find((node) => node['@type'] === 'CollectionPage')?.url).toBe(canonical);
    expect(graph['@graph'].find((node) => node['@type'] === 'ItemList')?.url).toBe(canonical);
  });
});
