import { Prisma } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/database/prisma.js';
import { CatalogReadModelService } from '../src/modules/catalog/catalog-read-model.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { FakeProductImageAdapter } from '../src/modules/catalog/product-image.service.js';
import { cleanupLegacyInvalidActiveProducts } from '../src/seed/legacy-cleanup.js';
import { runDemoSeed } from '../src/seed/demo-seed.js';
import {
  demoAdmin,
  demoCustomer,
  demoOrderNumbers,
  demoProducts,
  demoStaff,
} from '../src/seed/demo-data.js';
import { validateSeedData } from '../src/seed/validation.js';

const invalidSlug = 'm6-seed-test-invalid-active-product';
const legacySlug = 'cart-test-book-1784451312649';
const qaAuthorSlug = 'm6-e2e-author-seed-validation';
const qaPublisherSlug = 'm6-e2e-publisher-seed-validation';

const deleteProductGraphBySlugs = async (slugs: readonly string[]) => {
  const products = await prisma.product.findMany({
    where: { slug: { in: [...slugs] } },
    select: { id: true },
  });
  const ids = products.map((product) => product.id);
  if (ids.length === 0) return;
  await prisma.productImage.deleteMany({ where: { productId: { in: ids } } });
  await prisma.productAuthor.deleteMany({ where: { productId: { in: ids } } });
  await prisma.productCategory.deleteMany({ where: { productId: { in: ids } } });
  await prisma.inventory.deleteMany({ where: { productVariant: { productId: { in: ids } } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
};

describe('M6 demo seed integration', () => {
  afterAll(async () => {
    await deleteProductGraphBySlugs([invalidSlug]);
    await prisma.author.deleteMany({ where: { slug: qaAuthorSlug } });
    await prisma.publisher.deleteMany({ where: { slug: qaPublisherSlug } });
  });

  it('runs idempotently and validates clean data', { timeout: 60000 }, async () => {
    await cleanupLegacyInvalidActiveProducts(prisma);
    await runDemoSeed(prisma);
    const firstCounts = {
      products: await prisma.product.count({
        where: { slug: { in: demoProducts.map((product) => product.slug) } },
      }),
      orders: await prisma.order.count({ where: { orderNumber: { in: [...demoOrderNumbers] } } }),
      demoUsers: await prisma.user.count({
        where: {
          username: { in: [demoCustomer.username, demoStaff.username, demoAdmin.username] },
        },
      }),
      seedLedgerRows: await prisma.inventoryLedger.count({
        where: { reason: { contains: 'Local demo' } },
      }),
    };

    await runDemoSeed(prisma);
    const secondCounts = {
      products: await prisma.product.count({
        where: { slug: { in: demoProducts.map((product) => product.slug) } },
      }),
      orders: await prisma.order.count({ where: { orderNumber: { in: [...demoOrderNumbers] } } }),
      demoUsers: await prisma.user.count({
        where: {
          username: { in: [demoCustomer.username, demoStaff.username, demoAdmin.username] },
        },
      }),
      seedLedgerRows: await prisma.inventoryLedger.count({
        where: { reason: { contains: 'Local demo' } },
      }),
    };

    expect(secondCounts).toEqual(firstCounts);
    expect(secondCounts.products).toBe(demoProducts.length);
    expect(secondCounts.orders).toBe(demoOrderNumbers.length);
    expect(secondCounts.demoUsers).toBe(3);

    const report = await validateSeedData(prisma);
    expect(report.blocking).toBe(false);
  });

  it('provides deterministic local demo accounts for customer, staff, and admin roles', async () => {
    await runDemoSeed(prisma);
    const users = await prisma.user.findMany({
      where: { username: { in: [demoCustomer.username, demoStaff.username, demoAdmin.username] } },
      select: { username: true, role: true, status: true },
      orderBy: { username: 'asc' },
    });
    expect(users).toEqual([
      { username: demoAdmin.username, role: 'ADMIN', status: 'ACTIVE' },
      { username: demoCustomer.username, role: 'CUSTOMER', status: 'ACTIVE' },
      { username: demoStaff.username, role: 'STAFF', status: 'ACTIVE' },
    ]);
    const report = await validateSeedData(prisma);
    expect(
      report.issues.find((item) => item.code === 'DEMO_ACCOUNTS_MISSING_OR_INVALID')?.count,
    ).toBe('0');
  });

  it('hydrates public demo ACTIVE products through CatalogReadModelService', async () => {
    await runDemoSeed(prisma);
    const readModel = new CatalogReadModelService(prisma);
    const publicProduct = await readModel.publicProductBySlug('can-phong-day-anh-sang');
    expect(publicProduct).toMatchObject({
      slug: 'can-phong-day-anh-sang',
      visible: true,
      purchasable: false,
      availability: { inStock: false },
    });
  });

  it('keeps seeded order snapshots stable after current product mutation', async () => {
    await runDemoSeed(prisma);
    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: 'M6-DEMO-PENDING' },
      include: { items: true },
    });
    const before = order.items[0]!.productTitleSnapshot;
    const productSlug = order.items[0]!.productSlugSnapshot;
    await prisma.product.update({
      where: { slug: productSlug! },
      data: { name: 'M6 Mutated Current Product Name' },
    });
    const after = await prisma.orderItem.findUniqueOrThrow({ where: { id: order.items[0]!.id } });
    expect(after.productTitleSnapshot).toBe(before);
    await runDemoSeed(prisma);
  });

  it('validation detects deliberately inserted invalid ACTIVE Product', async () => {
    await deleteProductGraphBySlugs([invalidSlug]);
    await prisma.product.create({
      data: {
        name: 'M6 Invalid Active Product',
        slug: invalidSlug,
        publicationState: 'ACTIVE',
        isActive: true,
      },
    });
    const report = await validateSeedData(prisma);
    expect(report.blocking).toBe(true);
    expect(
      report.issues.find((item) => item.code === 'ACTIVE_PRODUCTS_INVALID_PRIMARY_CATEGORY')?.count,
    ).not.toBe('0');
    await deleteProductGraphBySlugs([invalidSlug]);
  });

  it('scoped cleanup downgrades only known legacy invalid rows', async () => {
    await deleteProductGraphBySlugs([legacySlug]);
    await prisma.product.create({
      data: {
        name: 'Cart Test Book',
        slug: legacySlug,
        publicationState: 'ACTIVE',
        isActive: true,
      },
    });
    const result = await cleanupLegacyInvalidActiveProducts(prisma);
    expect(result.remediated).toBeGreaterThanOrEqual(1);
    const row = await prisma.product.findUniqueOrThrow({ where: { slug: legacySlug } });
    expect(row).toMatchObject({
      publicationState: 'DRAFT',
      isActive: false,
      primaryCategoryId: null,
    });
    await deleteProductGraphBySlugs([legacySlug]);
  });

  it('blocks bounded QA author and publisher leaks, then deactivates them safely', async () => {
    await prisma.author.upsert({
      where: { slug: qaAuthorSlug },
      create: { name: 'M6 E2E Author Seed Validation', slug: qaAuthorSlug },
      update: { isActive: true, deletedAt: null },
    });
    await prisma.publisher.upsert({
      where: { slug: qaPublisherSlug },
      create: { name: 'M6 E2E Publisher Seed Validation', slug: qaPublisherSlug },
      update: { isActive: true, deletedAt: null },
    });
    const invalidReport = await validateSeedData(prisma);
    expect(invalidReport.blocking).toBe(true);
    expect(
      invalidReport.issues.find((item) => item.code === 'PUBLIC_QA_AUTHOR_VISIBLE')?.count,
    ).not.toBe('0');
    expect(
      invalidReport.issues.find((item) => item.code === 'PUBLIC_QA_PUBLISHER_VISIBLE')?.count,
    ).not.toBe('0');

    const catalog = new CatalogService(prisma, new FakeProductImageAdapter());
    expect(
      (await catalog.publicTaxonomy('author')).some((item) => item.slug === qaAuthorSlug),
    ).toBe(false);
    expect(
      (await catalog.publicTaxonomy('publisher')).some((item) => item.slug === qaPublisherSlug),
    ).toBe(false);

    await cleanupLegacyInvalidActiveProducts(prisma);
    expect(await prisma.author.findUniqueOrThrow({ where: { slug: qaAuthorSlug } })).toMatchObject({
      isActive: false,
    });
    expect(
      await prisma.publisher.findUniqueOrThrow({ where: { slug: qaPublisherSlug } }),
    ).toMatchObject({ isActive: false });
  });

  it('stores complete deterministic snapshots for seeded orders', async () => {
    await runDemoSeed(prisma);
    const incomplete = await prisma.orderItem.count({
      where: {
        order: { orderNumber: { in: [...demoOrderNumbers] } },
        OR: [
          { productTitleSnapshot: null },
          { productSlugSnapshot: null },
          { variantNameSnapshot: null },
          { skuSnapshot: null },
          { unitListPrice: null },
          { unitEffectivePrice: null },
          { lineTotal: null },
        ],
      },
    });
    expect(incomplete).toBe(0);
    const malformed = await prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`
        SELECT COUNT_BIG(1) AS [count]
        FROM [dbo].[OrderItem]
        WHERE [orderId] IN (
          SELECT [id] FROM [dbo].[Order] WHERE [orderNumber] IN (${Prisma.join([...demoOrderNumbers])})
        )
          AND [authorNamesSnapshot] IS NOT NULL
          AND NOT (ISJSON([authorNamesSnapshot]) = 1 AND LEFT(LTRIM([authorNamesSnapshot]), 1) = '[')
      `,
    );
    expect(malformed[0]?.count ?? 0n).toBe(0n);
  });

  it('creates deterministic demo inventory ledger history that reconstructs stock', async () => {
    await runDemoSeed(prisma);
    const rows = await prisma.productVariant.findMany({
      where: {
        sku: {
          in: demoProducts.flatMap((product) => product.variants.map((variant) => variant.sku)),
        },
      },
      include: { inventory: { include: { ledgerEntries: true } } },
    });
    expect(rows.length).toBe(demoProducts.flatMap((product) => product.variants).length);
    for (const row of rows) {
      const inventory = row.inventory;
      expect(inventory).not.toBeNull();
      if (!inventory) continue;
      if (inventory.onHandQuantity > 0) expect(inventory.ledgerEntries.length).toBeGreaterThan(0);
      const reconstructed = inventory.ledgerEntries.reduce(
        (total, entry) => total + entry.quantityDelta,
        0,
      );
      expect(reconstructed).toBe(inventory.onHandQuantity);
    }

    const orderLedgerCount = await prisma.inventoryLedger.count({
      where: {
        OR: demoOrderNumbers.map((orderNumber) => ({ reason: { contains: orderNumber } })),
      },
    });
    expect(orderLedgerCount).toBe(demoOrderNumbers.length);

    const report = await validateSeedData(prisma);
    expect(report.blocking).toBe(false);
  });
});
