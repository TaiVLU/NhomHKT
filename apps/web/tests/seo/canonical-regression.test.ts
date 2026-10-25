import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata as generateCatalogMetadata } from '../../app/san-pham/page';
import { expectMetadataConsistency, metadataUrl, stubProductionSEOEnvironment } from './helpers';

vi.mock('../../services/catalog-client', () => ({
  getAuthors: vi.fn(() => Promise.resolve([])),
  getCategories: vi.fn(() => Promise.resolve([])),
  getProducts: vi.fn(() =>
    Promise.resolve({ data: [], meta: { page: 1, pageSize: 24, total: 0 } }),
  ),
  getPublishers: vi.fn(() => Promise.resolve([])),
  productUrl: (slug: string) => `/sach/${slug}`,
}));

const supportedCatalogParameters: readonly [string, string][] = [
  ['q', 'atomic'],
  ['category', 'van-hoc'],
  ['author', 'nam-cao'],
  ['publisher', 'nxb-tre'],
  ['inStock', 'true'],
  ['isNew', 'true'],
  ['isFeatured', 'true'],
  ['minPrice', '100000'],
  ['maxPrice', '300000'],
  ['sort', 'price-asc'],
  ['page', '2'],
  ['pageSize', '48'],
];

describe('SEO canonical regression policy', () => {
  beforeEach(() => {
    stubProductionSEOEnvironment();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(supportedCatalogParameters)(
    'canonicalizes catalog parameter %s to the clean catalog URL',
    async (key, value) => {
      const metadata = await generateCatalogMetadata({
        searchParams: Promise.resolve({ [key]: value }),
      });

      expectMetadataConsistency(metadata, 'https://hktstore.vn/san-pham');
      expect(metadata.robots).toMatchObject({ index: false, follow: true });
      expect(metadataUrl(metadata.alternates?.canonical)).not.toContain('?');
      expect(metadataUrl(metadata.openGraph?.url)).not.toContain('?');
    },
  );

  it('does not let combined catalog query parameters become canonical identity', async () => {
    const metadata = await generateCatalogMetadata({
      searchParams: Promise.resolve({
        q: 'atomic',
        category: 'van-hoc',
        author: 'nam-cao',
        publisher: 'nxb-tre',
        inStock: 'true',
        isNew: 'true',
        isFeatured: 'true',
        minPrice: '100000',
        maxPrice: '300000',
        sort: 'price-desc',
        page: '3',
        pageSize: '48',
      }),
    });

    expectMetadataConsistency(metadata, 'https://hktstore.vn/san-pham');
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });

  it('keeps empty and invalid catalog query values on the indexable clean catalog canonical', async () => {
    const metadata = await generateCatalogMetadata({
      searchParams: Promise.resolve({
        q: ' ',
        category: '',
        minPrice: '-1',
        maxPrice: 'abc',
        sort: undefined,
      }),
    });

    expectMetadataConsistency(metadata, 'https://hktstore.vn/san-pham');
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });
});
