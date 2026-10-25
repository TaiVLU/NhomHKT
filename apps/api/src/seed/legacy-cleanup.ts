import type { Prisma, PrismaClient } from '@prisma/client';

export const qaFixtureProductPrefixes = [
  'cart-test-',
  'checkout-',
  'inventory-',
  'm3-ui-smoke-',
  'm6-e2e-',
] as const;

export const qaFixtureCategoryPrefixes = [
  'cart-category-',
  'checkout-',
  'm3-ui-',
  'm6-e2e-category-',
] as const;

export const qaFixtureAuthorPrefixes = ['m3-ui-author', 'm6-e2e-author-'] as const;

export const qaFixturePublisherPrefixes = ['m3-ui-publisher', 'm6-e2e-publisher-'] as const;

// Retained for compatibility with the M6 seed contract tests. Runtime cleanup also
// covers newer timestamped fixtures through the bounded prefixes above.
export const legacyInvalidActiveProductSlugs = [
  'm3-ui-smoke-book',
  'cart-test-book-1784451312649',
  'checkout-success-book-1784456785161-0',
  'checkout-price-book-1784456785161-1',
  'checkout-idempotent-book-1784456785161-2',
  'checkout-scoped-customer-b-1784456785161-3',
  'checkout-scoped-customer-c-1784456785161-4',
  'checkout-disabled-variant-1784471455666-6',
  'checkout-scarce-book-1784471455666-7',
  'inventory-book-1784475420033',
] as const;

const supersededCategorySlugs = [
  'm6-demo-tong-hop',
  'm6-demo-van-hoc',
  'm6-demo-kinh-doanh',
  'm6-demo-khoa-hoc',
  'm6-demo-thieu-nhi',
  'm6-demo-inactive',
  'm6-demo-deleted',
  'van-hoc-kinh-dien',
  'tu-duy-song',
  'kinh-doanh',
  'khoa-hoc-pho-thong',
  'uncategorized',
] as const;

const supersededAuthorSlugs = [
  'm6-demo-george-orwell',
  'm6-demo-jane-austen',
  'm6-demo-james-clear',
  'm6-demo-carl-sagan',
  'm6-demo-mary-shelley',
  'm6-demo-nguyen-nhat-anh',
  'm6-demo-tran-dang-khoa',
  'george-orwell',
  'jane-austen',
  'herman-melville',
  'marcus-aurelius',
  'yuval-noah-harari',
  'james-clear',
  'peter-thiel',
  'eric-ries',
  'carl-sagan',
  'stephen-hawking',
  'antoine-de-saint-exupery',
  'j-k-rowling',
  'homer',
  'plato',
  'mary-shelley',
  'sun-tzu',
] as const;

const supersededPublisherSlugs = [
  'm6-demo-hktstore-select',
  'm6-demo-penguin-classics',
  'm6-demo-science-house',
  'penguin-classics',
  'vintage-books',
  'avery',
  'crown-business',
  'bantam-books',
  'hktstore-select',
] as const;

export interface LegacyCleanupResult {
  readonly matched: number;
  readonly remediated: number;
  readonly qaProductsMatched: number;
  readonly qaProductsDeactivated: number;
  readonly supersededDemoProductsMatched: number;
  readonly supersededDemoProductsDeactivated: number;
  readonly categoriesDeactivated: number;
  readonly authorsDeactivated: number;
  readonly publishersDeactivated: number;
}

const startsWithAny = (prefixes: readonly string[]): Prisma.StringFilter[] =>
  prefixes.map((prefix) => ({ startsWith: prefix }));

const deactivateProducts = async (
  prisma: PrismaClient,
  where: Prisma.ProductWhereInput,
): Promise<{ matched: number; changed: number }> => {
  const rows = await prisma.product.findMany({
    where,
    select: { id: true, publicationState: true, isActive: true, primaryCategoryId: true },
  });
  if (rows.length === 0) return { matched: 0, changed: 0 };
  const activeIds = rows
    .filter(
      (row) => row.publicationState === 'ACTIVE' || row.isActive || row.primaryCategoryId !== null,
    )
    .map((row) => row.id);
  if (activeIds.length === 0) return { matched: rows.length, changed: 0 };
  const result = await prisma.product.updateMany({
    where: { id: { in: activeIds } },
    data: { publicationState: 'DRAFT', isActive: false, primaryCategoryId: null },
  });
  return { matched: rows.length, changed: result.count };
};

export const cleanupLegacyInvalidActiveProducts = async (
  prisma: PrismaClient,
): Promise<LegacyCleanupResult> => {
  const qaProducts = await deactivateProducts(prisma, {
    OR: [
      ...startsWithAny(qaFixtureProductPrefixes).map((slug) => ({ slug })),
      { name: { startsWith: 'Cart Test ' } },
      { name: { startsWith: 'Checkout ' } },
      { name: { startsWith: 'M6 E2E ' } },
      {
        categories: {
          some: {
            category: { OR: startsWithAny(qaFixtureCategoryPrefixes).map((slug) => ({ slug })) },
          },
        },
      },
    ],
  });
  const supersededDemoProducts = await deactivateProducts(prisma, {
    variants: { some: { sku: { startsWith: 'M5A-' } } },
  });

  const categories = await prisma.category.updateMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: [...supersededCategorySlugs] } },
        ...startsWithAny(qaFixtureCategoryPrefixes).map((slug) => ({ slug })),
      ],
    },
    data: { isActive: false },
  });
  const authors = await prisma.author.updateMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: [...supersededAuthorSlugs] } },
        ...startsWithAny(qaFixtureAuthorPrefixes).map((slug) => ({ slug })),
      ],
    },
    data: { isActive: false },
  });
  const publishers = await prisma.publisher.updateMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: [...supersededPublisherSlugs] } },
        ...startsWithAny(qaFixturePublisherPrefixes).map((slug) => ({ slug })),
      ],
    },
    data: { isActive: false },
  });

  return {
    matched: qaProducts.matched + supersededDemoProducts.matched,
    remediated: qaProducts.changed + supersededDemoProducts.changed,
    qaProductsMatched: qaProducts.matched,
    qaProductsDeactivated: qaProducts.changed,
    supersededDemoProductsMatched: supersededDemoProducts.matched,
    supersededDemoProductsDeactivated: supersededDemoProducts.changed,
    categoriesDeactivated: categories.count,
    authorsDeactivated: authors.count,
    publishersDeactivated: publishers.count,
  };
};
