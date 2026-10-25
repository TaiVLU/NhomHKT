import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProductDetail } from '../../services/catalog-client';
import { ProductDetailExperience } from './product-detail-experience';

vi.mock('../cart/add-to-cart-button', () => ({
  AddToCartButton: () => <button type="button">Thêm vào giỏ</button>,
}));

const product = (imageCount = 4): ProductDetail => ({
  id: '1',
  name: 'Sách thử thư viện ảnh',
  slug: 'sach-thu-thu-vien-anh',
  shortDescription: 'Mô tả ngắn dành cho sản phẩm thử nghiệm.',
  description: 'Mô tả đầy đủ.',
  releaseDate: null,
  pageCount: 240,
  language: 'Tiếng Việt',
  dimensions: null,
  weightGrams: null,
  primaryImage: { url: '/product-images/demo/1.png', altText: 'Bìa trước' },
  images: Array.from({ length: imageCount }, (_, index) => ({
    id: `image-${index + 1}`,
    url: `/product-images/demo/${index + 1}.png`,
    altText: `Ảnh sản phẩm ${index + 1}`,
    productVariantId: null,
  })),
  authors: [{ name: 'Tác giả thử', slug: 'tac-gia-thu' }],
  publisher: { name: 'Nhà xuất bản thử', slug: 'nha-xuat-ban-thu' },
  categories: [{ name: 'Văn học', slug: 'van-hoc' }],
  minPrice: 120000,
  maxPrice: 120000,
  isNew: false,
  isFeatured: false,
  availability: { availableQuantity: 5, inStock: true, lowStock: false },
  variants: [
    {
      id: 'variant-1',
      sku: 'DEMO-1',
      isbn: null,
      name: 'Bản tiêu chuẩn',
      coverType: 'paperback',
      listPrice: 120000,
      salePrice: 120000,
      availability: { availableQuantity: 5, inStock: true, lowStock: false },
    },
  ],
  seoTitle: null,
  seoDescription: null,
  relatedProducts: [],
});

describe('ProductDetailExperience gallery', () => {
  afterEach(cleanup);

  it('switches ordered images with thumbnails, controls, and arrow keys', () => {
    render(<ProductDetailExperience product={product()} />);
    const gallery = screen.getByLabelText('Thư viện ảnh sản phẩm');
    expect(screen.getAllByRole('button', { name: /Xem ảnh/u })).toHaveLength(4);
    expect(screen.getByText('1/4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }));
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ảnh sản phẩm 2' })).toBeInTheDocument();

    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('1/4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xem ảnh 4/u }));
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('prioritizes only the main detail image while keeping thumbnails lazy', () => {
    const { container } = render(<ProductDetailExperience product={product()} />);
    const mainImage = container.querySelector('.detail-image img');
    expect(mainImage).not.toBeNull();
    expect(mainImage).toHaveAttribute('loading', 'eager');
    expect(mainImage).toHaveAttribute('fetchpriority', 'high');

    const thumbnails = container.querySelectorAll('.gallery-strip img');
    expect(thumbnails).toHaveLength(4);
    for (const thumbnail of thumbnails) {
      expect(thumbnail).toHaveAttribute('loading', 'lazy');
      expect(thumbnail).not.toHaveAttribute('fetchpriority', 'high');
    }
  });

  it('keeps the single-image case simple without inactive navigation controls', () => {
    render(<ProductDetailExperience product={product(1)} />);
    expect(screen.queryByRole('button', { name: 'Ảnh trước' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Chọn ảnh sản phẩm')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ảnh sản phẩm 1' })).toBeInTheDocument();
  });
});
