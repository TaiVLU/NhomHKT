'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductDetail, ProductVariant } from '../../services/catalog-client';
import { formatPrice } from '../../services/catalog-client';
import { AddToCartButton } from '../cart/add-to-cart-button';
import { ProductImage } from './product-image';

const coverTypeLabel = (coverType: string | null): string | null => {
  if (!coverType) return null;
  const normalized = coverType.trim().toLowerCase();
  const labels: Record<string, string> = {
    paperback: 'Bìa mềm',
    softcover: 'Bìa mềm',
    hardcover: 'Bìa cứng',
    hardback: 'Bìa cứng',
  };
  return labels[normalized] ?? coverType;
};

const variantLabel = (variant: ProductVariant): string =>
  [variant.name, coverTypeLabel(variant.coverType), variant.sku].filter(Boolean).join(' - ');

const availabilityText = (variant: ProductVariant | undefined): string => {
  if (!variant) return 'Sản phẩm hiện không khả dụng';
  if (!variant.availability.inStock) return 'Tạm hết hàng';
  return variant.availability.lowStock ? 'Sắp hết hàng' : 'Còn hàng';
};

export function ProductDetailExperience({ product }: { product: ProductDetail }) {
  const sellableVariants = product.variants.filter((variant) => variant.availability.inStock);
  const initialVariant = sellableVariants[0] ?? product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id ?? '');
  const [selectedImageId, setSelectedImageId] = useState(
    product.images.find((image) => image.url === product.primaryImage?.url)?.id ??
      product.images[0]?.id ??
      'fallback',
  );
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const visibleImages = useMemo(() => {
    const candidates = product.images.length
      ? product.images
      : [
          {
            id: 'fallback',
            url: product.primaryImage?.url ?? null,
            altText: product.name,
            productVariantId: null,
          },
        ];
    return candidates.filter(
      (image, index) =>
        candidates.findIndex(
          (candidate) => candidate.id === image.id || candidate.url === image.url,
        ) === index,
    );
  }, [product.images, product.name, product.primaryImage?.url]);
  const selectedImage =
    visibleImages.find((image) => image.id === selectedImageId) ??
    visibleImages.find((image) => image.productVariantId === selectedVariantId) ??
    visibleImages[0];
  const hasMultipleVariants = product.variants.length > 1;
  const canAdd = Boolean(selectedVariant?.availability.inStock);
  const maxQuantity = Math.max(1, selectedVariant?.availability.availableQuantity ?? 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const variant = params.get('variant');
    if (variant && product.variants.some((item) => item.id === variant))
      setSelectedVariantId(variant);
  }, [product.variants]);

  useEffect(() => {
    setSelectedImageId(
      visibleImages.find((image) => image.url === product.primaryImage?.url)?.id ??
        visibleImages[0]?.id ??
        'fallback',
    );
  }, [product.primaryImage?.url, product.slug, visibleImages]);

  useEffect(() => {
    if (quantity > maxQuantity) setQuantity(maxQuantity);
  }, [maxQuantity, quantity]);

  const metadata = useMemo(
    () =>
      [
        selectedVariant ? ['SKU', selectedVariant.sku] : null,
        selectedVariant?.isbn ? ['ISBN', selectedVariant.isbn] : null,
        selectedVariant?.coverType
          ? ['Định dạng', coverTypeLabel(selectedVariant.coverType)]
          : null,
        product.publisher ? ['Nhà xuất bản', product.publisher.name] : null,
        product.categories.length
          ? ['Danh mục', product.categories.map((c) => c.name).join(', ')]
          : null,
        product.language ? ['Ngôn ngữ', product.language] : null,
        product.pageCount ? ['Số trang', String(product.pageCount)] : null,
        product.dimensions ? ['Kích thước', product.dimensions] : null,
        product.releaseDate ? ['Ngày phát hành', product.releaseDate] : null,
      ].filter((item): item is [string, string] => Boolean(item)),
    [product, selectedVariant],
  );

  const chooseVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(1);
    const params = new URLSearchParams(window.location.search);
    params.set('variant', variant.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const moveImage = (direction: -1 | 1) => {
    if (visibleImages.length < 2) return;
    const currentIndex = Math.max(
      0,
      visibleImages.findIndex((image) => image.id === selectedImage?.id),
    );
    const nextIndex = (currentIndex + direction + visibleImages.length) % visibleImages.length;
    setSelectedImageId(visibleImages[nextIndex]!.id);
  };

  return (
    <section className="product-detail">
      <div
        className="product-gallery"
        aria-label="Thư viện ảnh sản phẩm"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') moveImage(-1);
          if (event.key === 'ArrowRight') moveImage(1);
        }}
      >
        <div className="product-image detail-image" aria-live="polite">
          <ProductImage
            src={selectedImage?.url}
            alt={selectedImage?.altText || product.name}
            loading="eager"
            fetchPriority="high"
          />
          {visibleImages.length > 1 && (
            <div className="gallery-navigation" aria-label="Điều hướng ảnh sản phẩm">
              <button type="button" aria-label="Ảnh trước" onClick={() => moveImage(-1)}>
                <span aria-hidden="true">‹</span>
              </button>
              <span aria-live="polite">
                {visibleImages.findIndex((image) => image.id === selectedImage?.id) + 1}/
                {visibleImages.length}
              </span>
              <button type="button" aria-label="Ảnh tiếp theo" onClick={() => moveImage(1)}>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
        {visibleImages.length > 1 && (
          <div className="gallery-strip" aria-label="Chọn ảnh sản phẩm">
            {visibleImages.map((image, index) => (
              <button
                className="gallery-thumb"
                type="button"
                key={image.id}
                aria-label={`Xem ảnh ${index + 1} của ${product.name}`}
                aria-pressed={selectedImage?.id === image.id}
                aria-current={selectedImage?.id === image.id ? 'true' : undefined}
                onClick={() => setSelectedImageId(image.id)}
              >
                <ProductImage src={image.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="product-info" aria-label="Thông tin mua sách">
        <p className="eyebrow">{product.categories[0]?.name ?? 'Sách HKTStore'}</p>
        <h1>{product.name}</h1>
        <p className="product-author">
          {product.authors.map((author) => author.name).join(', ') || 'Đang cập nhật tác giả'}
        </p>
        <div className="detail-price" aria-live="polite">
          <strong>{formatPrice(selectedVariant?.salePrice ?? product.minPrice)}</strong>
          {selectedVariant && selectedVariant.listPrice > selectedVariant.salePrice && (
            <span>{formatPrice(selectedVariant.listPrice)}</span>
          )}
        </div>

        {hasMultipleVariants ? (
          <fieldset className="variant-selector">
            <legend>Chọn phiên bản</legend>
            {product.variants.map((variant) => {
              const disabled = !variant.availability.inStock;
              return (
                <label
                  className="variant-option"
                  data-selected={variant.id === selectedVariantId}
                  data-disabled={disabled}
                  key={variant.id}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={variant.id === selectedVariantId}
                    disabled={disabled}
                    onChange={() => chooseVariant(variant)}
                  />
                  <span>
                    <strong>{variantLabel(variant)}</strong>
                    <small>
                      {formatPrice(variant.salePrice)} - {availabilityText(variant)}
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          selectedVariant && (
            <p className="variant-single">
              Phiên bản: <strong>{variantLabel(selectedVariant)}</strong>
            </p>
          )
        )}

        <p className={canAdd ? 'stock-text' : 'stock-text out'}>
          {availabilityText(selectedVariant)}
        </p>
        <label className="quantity-selector">
          <span>Số lượng</span>
          <div>
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((v) => Math.max(1, v - 1))}
            >
              -
            </button>
            <input
              inputMode="numeric"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Math.min(maxQuantity, Number(event.target.value) || 1)))
              }
            />
            <button
              type="button"
              disabled={quantity >= maxQuantity || !canAdd}
              onClick={() => setQuantity((v) => Math.min(maxQuantity, v + 1))}
            >
              +
            </button>
          </div>
        </label>
        {selectedVariant ? (
          <AddToCartButton
            variantId={selectedVariant.id}
            productName={product.name}
            productSlug={product.slug}
            availableQuantity={selectedVariant.availability.availableQuantity}
            quantity={quantity}
            disabled={!canAdd}
          />
        ) : (
          <button className="add-to-cart-button" type="button" disabled>
            Sản phẩm hiện không khả dụng
          </button>
        )}
        {product.shortDescription && <p className="lead-copy">{product.shortDescription}</p>}
        <dl className="product-facts">
          {metadata.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
