import { describe, expect, it } from 'vitest';
import {
  assertLocalCleanupAllowed,
  databaseTargetFromUrl,
  seedRuntimeFromEnvironment,
} from '../src/seed/environment-safety.js';
import { demoProducts, isActiveMirrorForSeed } from '../src/seed/demo-data.js';
import { legacyInvalidActiveProductSlugs } from '../src/seed/legacy-cleanup.js';
import { serializeAuthorNamesSnapshot } from '../src/seed/order-snapshot.js';

describe('M6 seed data contracts', () => {
  it('uses deterministic product slugs and variant SKUs', () => {
    expect(new Set(demoProducts.map((product) => product.slug)).size).toBe(demoProducts.length);
    const skus = demoProducts.flatMap((product) => product.variants.map((variant) => variant.sku));
    expect(new Set(skus).size).toBe(skus.length);
    expect(demoProducts.every((product) => !/\d{10,}/.test(product.slug))).toBe(true);
  });

  it('keeps publicationState as lifecycle source of truth for isActive mirror', () => {
    expect(isActiveMirrorForSeed('ACTIVE')).toBe(true);
    expect(isActiveMirrorForSeed('DRAFT')).toBe(false);
    expect(isActiveMirrorForSeed('INACTIVE')).toBe(false);
    expect(isActiveMirrorForSeed('ARCHIVED')).toBe(false);
  });

  it('builds valid ACTIVE demo products with assigned primary categories', () => {
    const activeProducts = demoProducts.filter((product) => product.publicationState === 'ACTIVE');
    expect(activeProducts.length).toBeGreaterThanOrEqual(6);
    for (const product of activeProducts) {
      expect(product.primaryCategorySlug).toBeTruthy();
      expect(product.categorySlugs).toContain(product.primaryCategorySlug);
    }
  });

  it('keeps non-ACTIVE demo products from requiring public primary category state', () => {
    const draftProducts = demoProducts.filter((product) => product.publicationState === 'DRAFT');
    expect(draftProducts.length).toBeGreaterThanOrEqual(2);
    expect(draftProducts.every((product) => product.primaryCategorySlug === null)).toBe(true);
  });

  it('validates seed price and stock dataset relationships', () => {
    for (const variant of demoProducts.flatMap((product) => product.variants)) {
      expect(variant.listPrice).toBeGreaterThanOrEqual(0);
      expect(variant.salePrice).toBeGreaterThanOrEqual(0);
      expect(variant.salePrice).toBeLessThanOrEqual(variant.listPrice);
      expect(variant.onHandQuantity).toBeGreaterThanOrEqual(0);
      expect(variant.reservedQuantity).toBeGreaterThanOrEqual(0);
      expect(variant.reservedQuantity).toBeLessThanOrEqual(variant.onHandQuantity);
    }
  });

  it('serializes author snapshot semantics deterministically', () => {
    expect(serializeAuthorNamesSnapshot(null)).toBeNull();
    expect(serializeAuthorNamesSnapshot([])).toBe('[]');
    expect(serializeAuthorNamesSnapshot(['B', 'A'])).toBe('["A","B"]');
  });

  it('matches only explicitly scoped legacy cleanup slugs', () => {
    expect(legacyInvalidActiveProductSlugs).toContain('m3-ui-smoke-book');
    expect(legacyInvalidActiveProductSlugs).toContain('inventory-book-1784475420033');
    expect(legacyInvalidActiveProductSlugs).not.toContain('m6-demo-regular-in-stock');
  });

  it('guards cleanup against production and unknown database targets', () => {
    const production = seedRuntimeFromEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'sqlserver://localhost:1433;database=hktstore_dev',
    });
    expect(() => assertLocalCleanupAllowed(production, ['--confirm-local-cleanup'])).toThrow(
      /production/,
    );

    const unknown = seedRuntimeFromEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: 'sqlserver://db.example.com:1433;database=hktstore_dev',
    });
    expect(() => assertLocalCleanupAllowed(unknown, ['--confirm-local-cleanup'])).toThrow(
      /not recognized/,
    );
  });

  it('recognizes local HKT Store database targets', () => {
    expect(
      databaseTargetFromUrl('sqlserver://127.0.0.1:1433;database=hktstore_dev').safeForLocalMutation,
    ).toBe(true);
  });
});