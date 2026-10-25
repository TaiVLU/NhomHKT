import { describe, expect, it } from 'vitest';
import {
  normalizeIsbn,
  normalizeWhitespace,
  parseId,
  slugify,
} from '../src/modules/catalog/catalog.utils.js';
import { listQuerySchema, variantSchema } from '../src/modules/catalog/catalog.schema.js';
import {
  assertActivePrimaryCategory,
  availableQuantity,
  effectiveVariantPrice,
  hasSalePrice,
  publicationStateFromLegacy,
  resolveCreatePublicationState,
  stockStatus,
  variantUnavailableReason,
} from '../src/modules/catalog/catalog-policy.js';
import { FakeProductImageAdapter } from '../src/modules/catalog/product-image.service.js';

describe('catalog rules', () => {
  it('normalizes Vietnamese slug and whitespace', () => {
    expect(slugify('   Cửa Hàng HKT   ')).toBe('cua-hang-hkt');
    expect(normalizeWhitespace('a   b')).toBe('a b');
  });
  it('normalizes valid ISBN-10 and ISBN-13', () => {
    expect(normalizeIsbn('0-306-40615-2')).toBe('0306406152');
    expect(normalizeIsbn('978 0 306 40615 7')).toBe('9780306406157');
  });
  it('rejects invalid ISBN', () => {
    expect(() => normalizeIsbn('9780306406158')).toThrow();
  });
  it('keeps BIGINT identifiers outside JS safe range exact', () => {
    expect(parseId('9007199254740993123')).toBe(9007199254740993123n);
  });
  it('normalizes SKU and validates prices', () => {
    expect(
      variantSchema.parse({
        sku: ' book_01 ',
        name: 'Bìa mềm',
        costPrice: 1,
        listPrice: 2,
        salePrice: 2,
      }).sku,
    ).toBe('BOOK_01');
    expect(() =>
      variantSchema.parse({ sku: 'BAD SKU', name: 'x', costPrice: 3, listPrice: 2, salePrice: 2 }),
    ).toThrow();
  });
  it('accepts canonical public list query aliases', () => {
    expect(listQuerySchema.parse({ sort: 'price-asc', inStock: 'true' }).sort).toBe('price_asc');
    expect(() => listQuerySchema.parse({ minPrice: '200', maxPrice: '100' })).toThrow();
  });
  it('uses a fake Cloudinary adapter in automated tests', async () => {
    const asset = await new FakeProductImageAdapter().upload(Buffer.from('x'), 'image/webp');
    expect(asset.publicId).toMatch(/^hktstore\/products\//);
    expect(asset.url).toMatch(/^https:\/\/example\.invalid\//);
  });
  it('maps legacy lifecycle state with archived taking precedence', () => {
    expect(publicationStateFromLegacy({ deletedAt: new Date(), isActive: true })).toBe('ARCHIVED');
    expect(publicationStateFromLegacy({ deletedAt: null, isActive: true })).toBe('ACTIVE');
    expect(publicationStateFromLegacy({ deletedAt: null, isActive: false })).toBe('INACTIVE');
    expect(resolveCreatePublicationState({})).toBe('DRAFT');
    expect(resolveCreatePublicationState({ isActive: false })).toBe('DRAFT');
    expect(resolveCreatePublicationState({ isActive: true })).toBe('DRAFT');
    expect(resolveCreatePublicationState({ publicationState: 'ACTIVE', isActive: false })).toBe(
      'ACTIVE',
    );
  });
  it('requires ACTIVE products to have one active assigned primary category', () => {
    expect(() =>
      assertActivePrimaryCategory({
        publicationState: 'ACTIVE',
        primaryCategoryId: null,
        categoryIds: [],
      }),
    ).toThrow();
    expect(() =>
      assertActivePrimaryCategory({
        publicationState: 'ACTIVE',
        primaryCategoryId: 1n,
        categoryIds: [2n],
      }),
    ).toThrow();
    expect(() =>
      assertActivePrimaryCategory({
        publicationState: 'ACTIVE',
        primaryCategoryId: 1n,
        categoryIds: [1n],
        primaryCategory: { isActive: false, deletedAt: null },
      }),
    ).toThrow();
    expect(() =>
      assertActivePrimaryCategory({
        publicationState: 'INACTIVE',
        primaryCategoryId: null,
        categoryIds: [],
      }),
    ).not.toThrow();
  });
  it('centralizes effective price, sale presence, and stock availability', () => {
    expect(effectiveVariantPrice({ salePrice: 0 }).toNumber()).toBe(0);
    expect(hasSalePrice({ listPrice: 100000, salePrice: 80000 })).toBe(true);
    expect(hasSalePrice({ listPrice: 100000, salePrice: 100000 })).toBe(false);
    expect(availableQuantity({ onHandQuantity: 5, reservedQuantity: 2 })).toBe(3);
    expect(
      stockStatus({ onHandQuantity: 2, reservedQuantity: 2, lowStockThreshold: 5 }),
    ).toMatchObject({
      availableQuantity: 0,
      inStock: false,
      lowStock: false,
    });
  });
  it('distinguishes visibility from purchasability unavailable reasons', () => {
    expect(
      variantUnavailableReason({
        productPublic: false,
        variantActive: true,
        availableQuantity: 3,
      }),
    ).toBe('CATALOG_PRODUCT_NOT_PURCHASABLE');
    expect(
      variantUnavailableReason({
        productPublic: true,
        variantActive: false,
        availableQuantity: 3,
      }),
    ).toBe('CATALOG_VARIANT_INACTIVE');
    expect(
      variantUnavailableReason({
        productPublic: true,
        variantActive: true,
        availableQuantity: 0,
      }),
    ).toBe('INVENTORY_OUT_OF_STOCK');
  });
});