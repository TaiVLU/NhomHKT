import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductsPage, { generateMetadata } from './page';

vi.mock('../../services/catalog-client', () => ({
  siteUrl: () => 'http://localhost:3000',
  productUrl: (slug: string) => `/sach/${slug}`,
  getProducts: vi.fn(() =>
    Promise.resolve({ data: [], meta: { page: 1, pageSize: 20, total: 0 } }),
  ),
  getCategories: vi.fn(() => Promise.resolve([{ id: '1', name: 'Van hoc', slug: 'van-hoc' }])),
  getAuthors: vi.fn(() => Promise.resolve([{ id: '2', name: 'Nam Cao', slug: 'nam-cao' }])),
  getPublishers: vi.fn(() => Promise.resolve([{ id: '3', name: 'NXB Tre', slug: 'nxb-tre' }])),
}));

describe('ProductsPage', () => {
  it('generates indexable base catalog metadata through the SEO platform', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata).toMatchObject({
      title: 'Sách | HKT Store',
      description: 'Tìm kiếm, lọc và sắp xếp catalog sách HKT Store',
      alternates: { canonical: 'http://localhost:3000/san-pham' },
      robots: { index: true, follow: true },
      openGraph: {
        title: 'Sách | HKT Store',
        description: 'Tìm kiếm, lọc và sắp xếp catalog sách HKT Store',
        url: 'http://localhost:3000/san-pham',
      },
      twitter: {
        title: 'Sách | HKT Store',
        description: 'Tìm kiếm, lọc và sắp xếp catalog sách HKT Store',
        images: ['http://localhost:3000/social-preview.png'],
      },
    });
  });

  it('canonicalizes catalog search queries to noindex and follow', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ q: 'atomic' }),
    });
    expect(metadata).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/san-pham' },
      robots: { index: false, follow: true },
      openGraph: { url: 'http://localhost:3000/san-pham' },
      twitter: { title: 'Sách | HKT Store' },
    });
  });

  it('canonicalizes catalog pagination to noindex and follow', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ page: '2' }),
    });
    expect(metadata).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/san-pham' },
      robots: { index: false, follow: true },
    });
  });

  it('keeps empty catalog query values indexable', async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ q: ' ', category: '', sort: undefined }),
    });
    expect(metadata).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/san-pham' },
      robots: { index: true, follow: true },
    });
  });

  it('uses one search flow and exposes desktop/mobile-friendly filters', async () => {
    render(await ProductsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByLabelText('Tìm kiếm và sắp xếp sản phẩm')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tìm sách' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu khoa')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tác giả')).toBeInTheDocument();
    expect(screen.getByLabelText('Nhà xuất bản')).toBeInTheDocument();
    expect(screen.getByText(/0 kết quả/i)).toBeInTheDocument();
  });

  it('renders CollectionPage and ItemList structured data for the stable base catalog', async () => {
    render(await ProductsPage({ searchParams: Promise.resolve({}) }));

    const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const graph = JSON.parse(jsonLd) as {
      '@graph': Array<{ '@type': string; url?: string; name?: string }>;
    };

    expect(graph['@graph'].find((node) => node['@type'] === 'CollectionPage')).toMatchObject({
      name: 'Sách',
      url: 'http://localhost:3000/san-pham',
    });
    expect(graph['@graph'].find((node) => node['@type'] === 'ItemList')).toMatchObject({
      name: 'Sách',
      url: 'http://localhost:3000/san-pham',
    });
  });
});