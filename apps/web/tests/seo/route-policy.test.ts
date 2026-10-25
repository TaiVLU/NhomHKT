import type { Metadata } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateMetadata as generateAdminMetadata } from '../../app/admin/layout';
import { generateMetadata as generateRegisterMetadata } from '../../app/dang-ky/layout';
import { generateMetadata as generateCategoryListMetadata } from '../../app/danh-muc/page';
import { generateMetadata as generateCategoryMetadata } from '../../app/danh-muc/[slug]/page';
import { generateMetadata as generateCartMetadata } from '../../app/gio-hang/page';
import { generateMetadata as generateHomeMetadata } from '../../app/page';
import { generateMetadata as generatePromotionMetadata } from '../../app/khuyen-mai/page';
import { generateMetadata as generateNotFoundMetadata } from '../../app/not-found';
import { generateMetadata as generateBookMetadata } from '../../app/sach/[slug]/page';
import { generateMetadata as generateCatalogMetadata } from '../../app/san-pham/page';
import { generateMetadata as generateAccountMetadata } from '../../app/tai-khoan/layout';
import { generateMetadata as generateCheckoutMetadata } from '../../app/thanh-toan/page';
import { generateMetadata as generateCheckoutSuccessMetadata } from '../../app/thanh-toan/thanh-cong/page';
import { generateMetadata as generateForgotPasswordMetadata } from '../../app/quen-mat-khau/layout';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo';
import { buildSitemap } from '../../lib/seo/sitemap';
import {
  expectMetadataConsistency,
  productionSEOConfig,
  stubProductionSEOEnvironment,
} from './helpers';

const catalogMocks = vi.hoisted(() => ({
  getCategory: vi.fn(),
  getProduct: vi.fn(),
}));

const product = {
  id: 'book-1',
  name: 'Atomic Habits',
  slug: 'atomic-habits',
  shortDescription: 'Small habits, large outcomes.',
  description: 'Details',
  primaryImage: {
    url: '/covers/atomic-habits.webp',
    altText: 'Atomic Habits cover',
  },
  authors: [{ name: 'James Clear', slug: 'james-clear' }],
  minPrice: 205000,
  maxPrice: 245000,
  isNew: true,
  isFeatured: true,
  availability: { availableQuantity: 18, inStock: true, lowStock: false },
  variants: [],
  images: [],
  categories: [{ name: 'Tu duy song', slug: 'tu-duy-song' }],
  publisher: { name: 'Avery', slug: 'avery' },
  seoTitle: null,
  seoDescription: null,
  relatedProducts: [],
};

vi.mock('../../services/catalog-client', () => ({
  categoryUrl: (slug: string) => `/danh-muc/${slug}`,
  formatPrice: (value: number) => `${value} d`,
  getAuthors: vi.fn(() => Promise.resolve([])),
  getCategories: vi.fn(() => Promise.resolve([])),
  getCategory: catalogMocks.getCategory,
  getProduct: catalogMocks.getProduct,
  getProducts: vi.fn(() =>
    Promise.resolve({ data: [], meta: { page: 1, pageSize: 24, total: 0 } }),
  ),
  getPublishers: vi.fn(() => Promise.resolve([])),
  productUrl: (slug: string) => `/sach/${slug}`,
  siteUrl: () => 'https://hktstore.vn',
}));

vi.mock('../../features/cart/cart-page', () => ({
  CartPage: () => null,
}));

const expectRobots = (
  metadata: Metadata,
  robots: { readonly index: boolean; readonly follow: boolean; readonly noarchive?: boolean },
) => {
  expect(metadata).toMatchObject({ robots });
};

const routeClassMetadata = (path: string, title: string): Metadata => {
  const descriptor: SEODescriptor = {
    type: 'page',
    title,
    description: `${title} HKTStore.`,
    canonicalPath: path,
    published: true,
    indexable: false,
    follow: false,
  };
  const assets = buildSEOAssets(descriptor, productionSEOConfig());
  if (!assets.ok) throw new Error(`Expected ${path} route class descriptor to be valid.`);
  return toNextMetadata(assets.value.metadata);
};

describe('SEO route policy matrix', () => {
  beforeEach(() => {
    stubProductionSEOEnvironment();
    catalogMocks.getCategory.mockReset();
    catalogMocks.getProduct.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('marks primary public routes indexable and sitemap-eligible', async () => {
    const publicRoutes = [
      { path: '/', metadata: generateHomeMetadata() },
      {
        path: '/san-pham',
        metadata: await generateCatalogMetadata({ searchParams: Promise.resolve({}) }),
      },
      { path: '/danh-muc', metadata: generateCategoryListMetadata() },
      { path: '/khuyen-mai', metadata: generatePromotionMetadata() },
    ];

    for (const route of publicRoutes) {
      expectMetadataConsistency(route.metadata, `https://hktstore.vn${route.path}`);
      expectRobots(route.metadata, { index: true, follow: true });
    }

    const sitemap = await buildSitemap({
      config: productionSEOConfig(),
      providers: [
        {
          name: 'public-static',
          getEntries: () => publicRoutes.map((route) => ({ url: route.path })),
        },
      ],
    });
    expect(sitemap.ok).toBe(true);
    if (!sitemap.ok) return;
    expect(sitemap.value.map((entry) => entry.url)).toEqual(
      publicRoutes.map((route) => `https://hktstore.vn${route.path}`).sort(),
    );
  });

  it('marks catalog query URLs noindex/follow and canonicalizes them to the clean catalog URL', async () => {
    const metadata = await generateCatalogMetadata({
      searchParams: Promise.resolve({ q: 'atomic', sort: 'price-asc', page: '2' }),
    });

    expectMetadataConsistency(metadata, 'https://hktstore.vn/san-pham');
    expectRobots(metadata, { index: false, follow: true });
  });

  it('marks valid book and category pages indexable with self-canonical URLs', async () => {
    catalogMocks.getProduct.mockResolvedValueOnce(product);
    catalogMocks.getCategory.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Van hoc',
      slug: 'van-hoc',
      description: 'Vietnamese literature.',
    });

    const bookMetadata = await generateBookMetadata({
      params: Promise.resolve({ slug: 'atomic-habits' }),
    });
    const categoryMetadata = await generateCategoryMetadata({
      params: Promise.resolve({ slug: 'van-hoc' }),
    });

    expectMetadataConsistency(bookMetadata, 'https://hktstore.vn/sach/atomic-habits');
    expectRobots(bookMetadata, { index: true, follow: true });
    expectMetadataConsistency(categoryMetadata, 'https://hktstore.vn/danh-muc/van-hoc');
    expectRobots(categoryMetadata, { index: true, follow: true });
  });

  it('marks missing book, missing category, and 404 states noindex/nofollow', async () => {
    catalogMocks.getProduct.mockResolvedValueOnce(null);
    catalogMocks.getCategory.mockResolvedValueOnce(null);

    const missingBook = await generateBookMetadata({
      params: Promise.resolve({ slug: 'khong-ton-tai' }),
    });
    const missingCategory = await generateCategoryMetadata({
      params: Promise.resolve({ slug: 'khong-ton-tai' }),
    });
    const notFound = generateNotFoundMetadata();

    expectMetadataConsistency(missingBook, 'https://hktstore.vn/sach/khong-ton-tai');
    expectRobots(missingBook, { index: false, follow: false });
    expectMetadataConsistency(missingCategory, 'https://hktstore.vn/danh-muc/khong-ton-tai');
    expectRobots(missingCategory, { index: false, follow: false });
    expectMetadataConsistency(notFound, 'https://hktstore.vn/404');
    expectRobots(notFound, { index: false, follow: false });
  });

  it('marks account, auth, checkout, and admin route classes non-indexable', () => {
    const privateRoutes = [
      { path: '/tai-khoan', metadata: generateAccountMetadata() },
      { path: '/dang-nhap', metadata: routeClassMetadata('/dang-nhap', 'Dang nhap') },
      { path: '/dang-ky', metadata: generateRegisterMetadata() },
      { path: '/quen-mat-khau', metadata: generateForgotPasswordMetadata() },
      {
        path: '/dat-lai-mat-khau',
        metadata: routeClassMetadata('/dat-lai-mat-khau', 'Dat lai mat khau'),
      },
      { path: '/gio-hang', metadata: generateCartMetadata() },
      { path: '/thanh-toan', metadata: generateCheckoutMetadata() },
      { path: '/thanh-toan/thanh-cong', metadata: generateCheckoutSuccessMetadata() },
    ];

    for (const route of privateRoutes) {
      expectMetadataConsistency(route.metadata, `https://hktstore.vn${route.path}`);
      expectRobots(route.metadata, { index: false, follow: false });
    }

    const admin = generateAdminMetadata();
    expectMetadataConsistency(admin, 'https://hktstore.vn/admin');
    expectRobots(admin, { index: false, follow: false, noarchive: true });
  });
});
