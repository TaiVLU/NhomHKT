import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductCard } from './product-card';
import type { ProductCard as ProductCardData } from '../../services/catalog-client';

const product = (overrides: Partial<ProductCardData> = {}): ProductCardData => ({
  id: '9007199254740993',
  name: 'Sach thu',
  slug: 'sach-thu',
  shortDescription: null,
  primaryImage: null,
  authors: [],
  minPrice: 100000,
  maxPrice: 100000,
  isNew: false,
  isFeatured: false,
  availability: { availableQuantity: 0, inStock: false, lowStock: false },
  ...overrides,
});

describe('ProductCard', () => {
  afterEach(cleanup);

  it('renders fallback, stock badge, and canonical detail link', () => {
    render(<ProductCard product={product()} />);
    expect(screen.getByText('Sach thu')).toBeInTheDocument();
    expect(screen.getByRole('img').getAttribute('src')).toContain('/book-placeholder.svg');
    expect(screen.getAllByText('Hết hàng')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Xem chi tiết/i })).toHaveAttribute(
      'href',
      '/sach/sach-thu',
    );
  });

  it('falls back when a remote image fails', () => {
    render(
      <ProductCard
        product={product({
          id: '2',
          name: 'Anh loi',
          slug: 'anh-loi',
          primaryImage: { url: 'https://cdn.local/broken.jpg', altText: 'Bia loi' },
          minPrice: 90000,
          maxPrice: 90000,
          availability: { availableQuantity: 5, inStock: true, lowStock: false },
        })}
      />,
    );
    const image = screen.getByRole('img', { name: 'Bia loi' });
    fireEvent.error(image);
    expect(image.getAttribute('src')).toContain('/book-placeholder.svg');
  });

  it('falls back when Open Library returns an unusable one-pixel cover', async () => {
    render(
      <ProductCard
        product={product({
          id: '4',
          name: 'Anh mot diem anh',
          slug: 'anh-mot-diem-anh',
          primaryImage: {
            url: 'https://covers.openlibrary.org/b/isbn/9790000000001-L.jpg',
            altText: 'Bia mot diem anh',
          },
          availability: { availableQuantity: 5, inStock: true, lowStock: false },
        })}
      />,
    );
    const image = screen.getByRole('img', { name: 'Bia mot diem anh' });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1 });
    fireEvent.load(image);
    await waitFor(() => {
      expect(image.getAttribute('src')).toContain('/book-placeholder.svg');
    });
    expect(
      screen.getByRole('img', { name: 'Bìa mặc định cho Bia mot diem anh' }),
    ).toBeInTheDocument();
  });

  it('treats local fake upload URLs as unusable and renders the placeholder immediately', () => {
    render(
      <ProductCard
        product={product({
          id: '3',
          name: 'Anh fake local',
          slug: 'anh-fake-local',
          primaryImage: { url: 'https://example.test/local.webp', altText: 'Bia fake' },
          availability: { availableQuantity: 5, inStock: true, lowStock: false },
        })}
      />,
    );
    expect(screen.getByRole('img').getAttribute('src')).toContain('/book-placeholder.svg');
  });

  it('shows multi-variant starting price without fake rating or cart actions', () => {
    render(<ProductCard product={product({ minPrice: 80000, maxPrice: 100000 })} />);
    expect(screen.getByText(/Từ/)).toBeInTheDocument();
    expect(screen.getByText('Nhiều phiên bản')).toBeInTheDocument();
    expect(screen.queryByText(/rating|gio hang|them vao/i)).not.toBeInTheDocument();
  });
});
