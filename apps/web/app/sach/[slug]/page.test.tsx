import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import ProductPage, { generateMetadata } from './page';

const mocks = vi.hoisted(() => ({
  getProduct: vi.fn(),
  notFound: vi.fn(),
}));

const product = {
  id: '1',
  name: 'Atomic Habits',
  slug: 'atomic-habits',
  shortDescription: 'Small habits, large outcomes',
  description: '### Details',
  releaseDate: '2018-10-16',
  pageCount: 320,
  language: 'en',
  dimensions: null,
  weightGrams: null,
  primaryImage: {
    url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    altText: 'Atomic Habits cover',
  },
  authors: [{ name: 'James Clear', slug: 'james-clear' }],
  minPrice: 205000,
  maxPrice: 245000,
  isNew: true,
  isFeatured: true,
  availability: { availableQuantity: 18, inStock: true, lowStock: false },
  variants: [
    {
      id: '11',
      sku: 'M5A-ATOMIC-HABITS',
      isbn: '9780735211292',
      name: 'Ban tieu chuan',
      coverType: 'paperback',
      listPrice: 245000,
      salePrice: 205000,
      availability: { availableQuantity: 18, inStock: true, lowStock: false },
    },
  ],
  images: [
    {
      id: '21',
      url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
      altText: 'Atomic Habits cover',
      productVariantId: null,
    },
  ],
  categories: [{ name: 'Tu duy song', slug: 'tu-duy-song' }],
  publisher: { name: 'Avery', slug: 'avery' },
  seoTitle: 'Atomic Habits | HKT Store',
  seoDescription: 'Atomic Habits in HKT Store',
  relatedProducts: [],
};

vi.mock('../../../services/catalog-client', () => ({
  getProduct: mocks.getProduct,
  formatPrice: (value: number) => `${value} d`,
  productUrl: (slug: string) => `/sach/${slug}`,
  siteUrl: () => 'http://localhost:3000',
}));
vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
}));
vi.mock('../../../features/cart/add-to-cart-button', () => ({
  AddToCartButton: () => <button type="button">Add to cart</button>,
}));

describe('ProductPage', () => {
  it('keeps a genuine missing slug on the Next not-found path', async () => {
    mocks.getProduct.mockResolvedValueOnce(null);
    mocks.notFound.mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      ProductPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it('does not classify an upstream catalog failure as a missing slug', async () => {
    mocks.notFound.mockClear();
    mocks.getProduct.mockRejectedValueOnce(new Error('catalog unavailable'));

    await expect(
      ProductPage({ params: Promise.resolve({ slug: 'atomic-habits' }) }),
    ).rejects.toThrow('catalog unavailable');
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('does not hide metadata upstream failures behind missing metadata', async () => {
    mocks.getProduct.mockRejectedValueOnce(new Error('catalog unavailable'));

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'atomic-habits' }) }),
    ).rejects.toThrow('catalog unavailable');
  });

  it('generates book metadata through the SEO platform', async () => {
    mocks.getProduct.mockResolvedValueOnce(product);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'atomic-habits' }),
    });
    expect(metadata).toMatchObject({
      title: 'Atomic Habits | HKT Store',
      description: 'Atomic Habits in HKT Store',
      alternates: { canonical: 'http://localhost:3000/sach/atomic-habits' },
      openGraph: {
        title: 'Atomic Habits | HKT Store',
        description: 'Atomic Habits in HKT Store',
        url: 'http://localhost:3000/sach/atomic-habits',
        images: [
          {
            url: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
            alt: 'Atomic Habits | HKT Store',
          },
        ],
      },
      twitter: {
        title: 'Atomic Habits | HKT Store',
        description: 'Atomic Habits in HKT Store',
        images: ['https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'],
      },
    });
  });

  it('marks missing book metadata noindex and nofollow without changing canonical path', async () => {
    mocks.getProduct.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'khong-ton-tai' }),
    });

    expect(metadata).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/sach/khong-ton-tai' },
      robots: { index: false, follow: false },
    });
  });

  it('renders Product, Book, and Offer structured data through the SEO platform', async () => {
    mocks.getProduct.mockResolvedValueOnce(product);

    const { container } = render(
      await ProductPage({ params: Promise.resolve({ slug: 'atomic-habits' }) }),
    );
    expect(screen.getByRole('heading', { name: 'Atomic Habits' })).toBeInTheDocument();
    expect(screen.getByText('M5A-ATOMIC-HABITS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();

    const jsonLd = container.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const graph = JSON.parse(jsonLd) as {
      '@context': string;
      '@graph': Array<{
        '@type': string;
        '@id': string;
        name?: string;
        url?: string;
        image?: string[];
        offers?: { '@id': string };
        workExample?: { '@id': string };
        price?: number;
        priceCurrency?: string;
        availability?: string;
        isbn?: string;
        author?: Array<{ name: string }>;
        publisher?: { name: string };
        itemListElement?: Array<{ item: string; name: string; position: number }>;
      }>;
    };
    const productNode = graph['@graph'].find((node) => node['@type'] === 'Product');
    const bookNode = graph['@graph'].find((node) => node['@type'] === 'Book');
    const offerNode = graph['@graph'].find((node) => node['@type'] === 'Offer');
    const breadcrumbNode = graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList');

    expect(graph['@context']).toBe('https://schema.org');
    expect(productNode).toMatchObject({
      name: 'Atomic Habits | HKT Store',
      url: 'http://localhost:3000/sach/atomic-habits',
      image: ['https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'],
      offers: { '@id': 'http://localhost:3000/sach/atomic-habits#offer' },
      isbn: '9780735211292',
    });
    expect(bookNode).toMatchObject({
      name: 'Atomic Habits | HKT Store',
      url: 'http://localhost:3000/sach/atomic-habits',
      workExample: { '@id': 'http://localhost:3000/sach/atomic-habits#product' },
      offers: { '@id': 'http://localhost:3000/sach/atomic-habits#offer' },
      isbn: '9780735211292',
      author: [{ name: 'James Clear' }],
      publisher: { name: 'Avery' },
    });
    expect(offerNode).toMatchObject({
      url: 'http://localhost:3000/sach/atomic-habits',
      price: 205000,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
    });
    expect(breadcrumbNode).toMatchObject({
      url: 'http://localhost:3000/sach/atomic-habits',
      itemListElement: [
        { position: 1, name: 'Trang chủ', item: 'http://localhost:3000' },
        { position: 2, name: 'Sách', item: 'http://localhost:3000/san-pham' },
        {
          position: 3,
          name: 'Atomic Habits',
          item: 'http://localhost:3000/sach/atomic-habits',
        },
      ],
    });
    expect(new Set(graph['@graph'].map((node) => node['@id'])).size).toBe(graph['@graph'].length);
    expect(jsonLd).not.toContain('aggregateRating');
    expect(jsonLd).not.toContain('review');
  });

  it('keeps the product page free of manual structured data generation', () => {
    const source = readFileSync('app/sach/[slug]/page.tsx', 'utf8');

    expect(source).not.toContain('schema.org');
    expect(source).not.toContain('JSON.stringify');
    expect(source).not.toContain('application/ld+json');
    expect(source).not.toContain('@type');
    expect(source).toContain('StructuredDataRenderer');
  });
});