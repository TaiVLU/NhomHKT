import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import {
  checkoutRequestHash,
  checkoutSchema,
  idempotencyKeySchema,
} from '../src/modules/checkout/checkout.schema.js';
import { buildCheckoutOrderItemSnapshot } from '../src/modules/checkout/checkout-snapshot.js';
import { hasPermission } from '../src/modules/rbac/permissions.js';

describe('M5D checkout validation and RBAC', () => {
  it('accepts only stable customer checkout selections', () => {
    expect(
      checkoutSchema.parse({
        shippingAddressId: '1',
        paymentMethod: 'COD',
        deliveryNote: 'Giao giờ hành chính',
      }),
    ).toMatchObject({ shippingAddressId: '1', paymentMethod: 'COD' });
    expect(() => checkoutSchema.parse({ shippingAddressId: '0', paymentMethod: 'COD' })).toThrow();
    expect(() =>
      checkoutSchema.parse({ shippingAddressId: '1', paymentMethod: 'BANK_TRANSFER' }),
    ).toThrow();
    expect(() =>
      checkoutSchema.parse({ shippingAddressId: '1', paymentMethod: 'COD', grandTotal: 1 }),
    ).toThrow();
  });

  it('validates and hashes idempotency keys deterministically', () => {
    expect(idempotencyKeySchema.parse('checkout-key-123')).toBe('checkout-key-123');
    expect(() => idempotencyKeySchema.parse('short')).toThrow();
    expect(checkoutRequestHash({ shippingAddressId: '1', paymentMethod: 'COD' })).toBe(
      checkoutRequestHash({ shippingAddressId: '1', paymentMethod: 'COD' }),
    );
    expect(checkoutRequestHash({ shippingAddressId: '1', paymentMethod: 'COD' })).not.toBe(
      checkoutRequestHash({ shippingAddressId: '2', paymentMethod: 'COD' }),
    );
  });

  it('limits checkout access to customers', () => {
    expect(hasPermission('CUSTOMER', 'CHECKOUT_SELF')).toBe(true);
    expect(hasPermission('STAFF', 'CHECKOUT_SELF')).toBe(false);
    expect(hasPermission('ADMIN', 'CHECKOUT_SELF')).toBe(false);
  });

  it('builds complete immutable order item snapshots deterministically', () => {
    const snapshot = buildCheckoutOrderItemSnapshot({
      variantId: 10n,
      quantity: 3,
      current: {
        id: '10',
        productId: '20',
        name: 'Paperback',
        sku: 'SKU-1',
        isbn: '9780306406157',
        coverType: 'paperback',
        isActive: true,
        listPrice: 120000,
        salePrice: 90000,
        effectivePrice: 90000,
        availability: {
          onHandQuantity: 5,
          reservedQuantity: 0,
          availableQuantity: 5,
          inStock: true,
          lowStock: false,
        },
        purchasable: true,
        unavailableReason: null,
        product: {
          id: '20',
          title: 'Snapshot Book',
          slug: 'snapshot-book',
          shortDescription: null,
          description: null,
          releaseDate: null,
          pageCount: null,
          language: 'vi',
          dimensions: null,
          weightGrams: null,
          isNew: false,
          isFeatured: false,
          publicationState: 'ACTIVE',
          visible: true,
          purchasable: true,
          publisher: { id: '30', name: 'Publisher', slug: 'publisher' },
          primaryCategory: { id: '40', name: 'Van hoc', slug: 'van-hoc' },
          images: [
            {
              id: '50',
              url: 'https://cdn.test/cover.webp',
              altText: 'Cover',
              isPrimary: true,
              sortOrder: 0,
              productVariantId: '10',
            },
          ],
          authors: [
            { id: '2', name: 'Author B', slug: 'b', sortOrder: 1 },
            { id: '1', name: 'Author A', slug: 'a', sortOrder: 0 },
          ],
          categories: [{ id: '40', name: 'Van hoc', slug: 'van-hoc' }],
          variants: [],
          primaryImage: {
            id: '50',
            url: 'https://cdn.test/cover.webp',
            altText: 'Cover',
            isPrimary: true,
            sortOrder: 0,
            productVariantId: '10',
          },
          seoTitle: null,
          seoDescription: null,
          minPrice: 90000,
          maxPrice: 90000,
          availability: { availableQuantity: 5, inStock: true, lowStock: false },
        },
      },
    });
    expect(snapshot).toMatchObject({
      quantity: 3,
      productTitleSnapshot: 'Snapshot Book',
      productSlugSnapshot: 'snapshot-book',
      variantNameSnapshot: 'Paperback',
      skuSnapshot: 'SKU-1',
      isbnSnapshot: '9780306406157',
      languageSnapshot: 'vi',
      coverImageUrlSnapshot: 'https://cdn.test/cover.webp',
      primaryCategoryNameSnapshot: 'Van hoc',
      authorNamesSnapshot: JSON.stringify(['Author A', 'Author B']),
      publisherNameSnapshot: 'Publisher',
    });
    expect((snapshot.unitListPrice as Prisma.Decimal).toNumber()).toBe(120000);
    expect((snapshot.unitSalePrice as Prisma.Decimal).toNumber()).toBe(90000);
    expect((snapshot.unitEffectivePrice as Prisma.Decimal).toNumber()).toBe(90000);
    expect((snapshot.lineTotal as Prisma.Decimal).toNumber()).toBe(270000);
  });
});
