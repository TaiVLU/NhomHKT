import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  approvedPublicCategoryNames,
  demoCategories,
  demoProducts,
} from '../src/seed/demo-data.js';
import {
  qaFixtureAuthorPrefixes,
  qaFixtureCategoryPrefixes,
  qaFixtureProductPrefixes,
  qaFixturePublisherPrefixes,
} from '../src/seed/legacy-cleanup.js';

const publicProducts = demoProducts.filter((product) => product.publicationState === 'ACTIVE');
const publicCategories = demoCategories.filter(
  (category) => category.isActive && !category.deletedAt,
);

describe('public demo catalog data hygiene', () => {
  it('keeps one bounded 24-book catalog with the approved Vietnamese taxonomy', () => {
    expect(publicProducts).toHaveLength(24);
    expect(publicCategories.map((category) => category.name)).toEqual([
      ...approvedPublicCategoryNames,
    ]);
    expect(new Set(publicProducts.map((product) => product.slug)).size).toBe(24);
  });

  it('gives every public book meaningful content, an owned image, and a sellable variant', () => {
    for (const product of publicProducts) {
      expect(product.shortDescription.length).toBeGreaterThanOrEqual(80);
      expect(product.shortDescription.length).toBeLessThanOrEqual(160);
      expect(product.description.length).toBeGreaterThanOrEqual(400);
      expect(product.description.length).toBeLessThanOrEqual(900);
      expect(product.description.split(/\n\n/u)).toHaveLength(3);
      const images = product.images ?? [];
      expect(images).toHaveLength(4);
      expect(images.filter((image) => image.isPrimary)).toHaveLength(1);
      expect(images.map((image) => image.sortOrder)).toEqual([0, 1, 2, 3]);
      expect(new Set(images.map((image) => image.altText)).size).toBe(4);
      for (const image of images) {
        expect(image.path).toMatch(
          new RegExp(
            `^/product-images/${product.slug}/(?:cover|back-cover|preview-0[12])\\.png$`,
            'u',
          ),
        );
        expect(existsSync(resolve(process.cwd(), '../web/public', image.path.slice(1)))).toBe(true);
      }
      expect(product.primaryCategorySlug).toBeTruthy();
      expect(product.authorSlugs.length).toBeGreaterThan(0);
      expect(product.publisherSlug).toBeTruthy();
      expect(product.language).toBe('Tiếng Việt');
      expect(product.pageCount).toBeGreaterThan(100);
      expect(product.variants.some((variant) => variant.isActive)).toBe(true);
      expect(product.variants.every((variant) => variant.salePrice <= variant.listPrice)).toBe(
        true,
      );
    }
  });

  it('does not mix known QA naming conventions into official public seed records', () => {
    for (const product of publicProducts) {
      const normalized = `${product.slug} ${product.name}`.toLowerCase();
      expect(qaFixtureProductPrefixes.some((prefix) => normalized.includes(prefix))).toBe(false);
      expect(normalized).not.toMatch(/\b(?:cart|checkout|fixture|test|e2e)\b/u);
    }
    for (const category of publicCategories) {
      expect(qaFixtureCategoryPrefixes.some((prefix) => category.slug.startsWith(prefix))).toBe(
        false,
      );
      expect(category.slug).not.toMatch(/^m6-demo-/u);
    }
    for (const prefix of qaFixtureAuthorPrefixes) {
      expect(
        publicProducts.some((product) =>
          product.authorSlugs.some((slug) => slug.startsWith(prefix)),
        ),
      ).toBe(false);
    }
    for (const prefix of qaFixturePublisherPrefixes) {
      expect(publicProducts.some((product) => product.publisherSlug?.startsWith(prefix))).toBe(
        false,
      );
    }
  });
});
