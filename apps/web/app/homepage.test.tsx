import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import HomePage, { generateMetadata } from './page';

const book = {
  id: '1',
  name: 'Sach noi bat',
  slug: 'sach-noi-bat',
  shortDescription: null,
  primaryImage: null,
  authors: [{ name: 'Tac gia', slug: 'tac-gia' }],
  minPrice: 99000,
  maxPrice: 99000,
  isNew: true,
  isFeatured: true,
  availability: { availableQuantity: 5, inStock: true, lowStock: false },
};

vi.mock('../services/catalog-client', () => ({
  getProducts: vi.fn(() =>
    Promise.resolve({ data: [book], meta: { page: 1, pageSize: 8, total: 1 } }),
  ),
  getCategories: vi.fn(() => Promise.resolve([{ id: '2', name: 'Van hoc', slug: 'van-hoc' }])),
  formatPrice: (value: number) => `${value} d`,
  productUrl: (slug: string) => `/sach/${slug}`,
  categoryUrl: (slug: string) => `/danh-muc/${slug}`,
  siteUrl: () => 'http://localhost:3000',
}));

describe('Homepage', () => {
  it('generates home metadata through the SEO platform', () => {
    const metadata = generateMetadata();
    expect(metadata).toMatchObject({
      title: 'HKT Store',
      description: 'HKT Store - Sách chuẩn, gu chất cho độc giả Việt',
      alternates: { canonical: 'http://localhost:3000/' },
      openGraph: {
        title: 'HKT Store',
        description: 'HKT Store - Sách chuẩn, gu chất cho độc giả Việt',
        url: 'http://localhost:3000/',
      },
      twitter: {
        title: 'HKT Store',
        description: 'HKT Store - Sách chuẩn, gu chất cho độc giả Việt',
      },
    });
  });

  it('renders real bookstore sections without the M1 placeholder', async () => {
    const { container } = render(await HomePage());
    expect(screen.queryByText('Milestone 1')).not.toBeInTheDocument();
    expect(document.querySelector('#featured-title')).toBeInTheDocument();
    expect(document.querySelector('#new-title')).toBeInTheDocument();
    expect(document.querySelector('#category-title')).toBeInTheDocument();
    expect(screen.getAllByText('Sach noi bat')).toHaveLength(2);

    const jsonLd = container.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    const graph = JSON.parse(jsonLd) as {
      '@graph': Array<{ '@type': string; '@id': string; url?: string }>;
    };
    expect(graph['@graph'].find((node) => node['@type'] === 'Organization')).toMatchObject({
      '@id': 'http://localhost:3000/#organization',
      url: 'http://localhost:3000',
    });
    expect(graph['@graph'].find((node) => node['@type'] === 'WebSite')).toMatchObject({
      '@id': 'http://localhost:3000/#website',
      url: 'http://localhost:3000',
    });
  });

  it('keeps the hero headline on the Vietnamese-safe serif stack without justified spacing', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toContain("--font-serif: Cambria, 'Times New Roman', Georgia");
    expect(css).not.toMatch(/\.hero-section h1\s*{[^}]*text-align:\s*justify/s);
    expect(css).not.toMatch(/\.hero-section h1\s*{[^}]*word-spacing:\s*(?!normal\b|0\b)/s);
  });
});