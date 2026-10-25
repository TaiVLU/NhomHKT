import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import CategoryPage, { generateMetadata } from './page';

const mocks = vi.hoisted(() => ({
  getCategory: vi.fn(),
  getProducts: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('../../../services/catalog-client', () => ({
  categoryUrl: (slug: string) => `/danh-muc/${slug}`,
  formatPrice: (value: number) => `${value} d`,
  getCategory: mocks.getCategory,
  getProducts: mocks.getProducts,
  productUrl: (slug: string) => `/sach/${slug}`,
  siteUrl: () => 'http://localhost:3000',
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

describe('CategoryPage metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProducts.mockResolvedValue({
      data: [
        {
          id: 'p1',
          name: 'Atomic Habits',
          slug: 'atomic-habits',
          shortDescription: null,
          primaryImage: null,
          authors: [{ name: 'James Clear', slug: 'james-clear' }],
          minPrice: 205000,
          maxPrice: 205000,
          isNew: true,
          isFeatured: true,
          availability: { availableQuantity: 3, inStock: true, lowStock: false },
        },
      ],
      meta: { page: 1, pageSize: 24, total: 1 },
    });
  });

  it('renders a valid category detail without invoking notFound', async () => {
    mocks.getCategory.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Children',
      slug: 'thieu-nhi',
      description: null,
    });

    const { getByRole } = render(
      await CategoryPage({ params: Promise.resolve({ slug: 'thieu-nhi' }) }),
    );
    expect(getByRole('heading', { level: 1, name: 'Children' })).toBeInTheDocument();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('keeps a genuine missing category on the Next not-found path', async () => {
    mocks.getCategory.mockResolvedValueOnce(null);
    mocks.notFound.mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      CategoryPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it('does not convert category upstream failures into not-found', async () => {
    mocks.getCategory.mockRejectedValueOnce(new Error('catalog unavailable'));

    await expect(CategoryPage({ params: Promise.resolve({ slug: 'thieu-nhi' }) })).rejects.toThrow(
      'catalog unavailable',
    );
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('does not hide metadata upstream failures behind missing metadata', async () => {
    mocks.getCategory.mockRejectedValueOnce(new Error('catalog unavailable'));

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: 'thieu-nhi' }) }),
    ).rejects.toThrow('catalog unavailable');
  });

  it('generates category metadata with fallback description through the SEO platform', async () => {
    mocks.getCategory.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Văn học Việt Nam',
      slug: 'van-hoc-viet-nam',
      description: null,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'van-hoc-viet-nam' }),
    });

    expect(metadata).toMatchObject({
      title: 'Văn học Việt Nam | RoSach',
      description: 'Sách thuộc danh mục Văn học Việt Nam tại RoSach.',
      alternates: { canonical: 'http://localhost:3000/danh-muc/van-hoc-viet-nam' },
      openGraph: {
        title: 'Văn học Việt Nam | RoSach',
        description: 'Sách thuộc danh mục Văn học Việt Nam tại RoSach.',
        url: 'http://localhost:3000/danh-muc/van-hoc-viet-nam',
      },
      twitter: {
        title: 'Văn học Việt Nam | RoSach',
        description: 'Sách thuộc danh mục Văn học Việt Nam tại RoSach.',
      },
    });
  });

  it('marks missing category metadata noindex and nofollow without changing canonical path', async () => {
    mocks.getCategory.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'khong-ton-tai' }),
    });

    expect(metadata).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/danh-muc/khong-ton-tai' },
      robots: { index: false, follow: false },
    });
  });

  it('renders BreadcrumbList and collection graph for category detail', async () => {
    mocks.getCategory.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'VÄƒn há»c Viá»‡t Nam',
      slug: 'van-hoc-viet-nam',
      description: null,
    });

    const { container } = render(
      await CategoryPage({ params: Promise.resolve({ slug: 'van-hoc-viet-nam' }) }),
    );
    const jsonLd = container.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const graph = JSON.parse(jsonLd) as {
      '@graph': Array<{
        '@type': string;
        url?: string;
        itemListElement?: Array<{ item?: string; url?: string; name: string; position: number }>;
      }>;
    };

    expect(graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList')).toMatchObject({
      url: 'http://localhost:3000/danh-muc/van-hoc-viet-nam',
      itemListElement: [
        { position: 1, name: 'Trang chá»§', item: 'http://localhost:3000' },
        { position: 2, name: 'Danh má»¥c', item: 'http://localhost:3000/danh-muc' },
        {
          position: 3,
          name: 'VÄƒn há»c Viá»‡t Nam',
          item: 'http://localhost:3000/danh-muc/van-hoc-viet-nam',
        },
      ],
    });
    expect(graph['@graph'].find((node) => node['@type'] === 'CollectionPage')).toMatchObject({
      url: 'http://localhost:3000/danh-muc/van-hoc-viet-nam',
    });
    expect(graph['@graph'].find((node) => node['@type'] === 'ItemList')).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Atomic Habits', url: 'http://localhost:3000/sach/atomic-habits' },
      ],
    });
  });
});
