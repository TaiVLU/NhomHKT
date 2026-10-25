import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/database/prisma.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { FakeProductImageAdapter } from '../src/modules/catalog/product-image.service.js';
import { AppError } from '../src/shared/errors/app-error.js';

const suffix = Date.now().toString(),
  context = { ip: '127.0.0.1', userAgent: 'vitest', requestId: `m3-${suffix}` };
let actorId: bigint,
  productId: bigint,
  variantId: bigint,
  categoryId: bigint,
  replacementCategoryId: bigint,
  authorId: bigint,
  publisherId: bigint;
const service = new CatalogService(prisma, new FakeProductImageAdapter());
const code = (result: PromiseSettledResult<unknown>) =>
  result.status === 'rejected' && result.reason instanceof AppError ? result.reason.code : null;
describe('Catalog SQL Server rollback and concurrency', () => {
  beforeAll(async () => {
    const actor = await prisma.user.create({
      data: {
        username: `m3${suffix}`.slice(0, 15),
        fullName: 'M3 Test',
        email: `m3${suffix}@test.local`,
        phone: `+848${suffix.slice(-8)}`,
        passwordHash: 'test',
        role: 'ADMIN',
      },
    });
    actorId = actor.id;
    const c = await prisma.category.create({ data: { name: 'C', slug: `c-${suffix}` } }),
      c2 = await prisma.category.create({ data: { name: 'C2', slug: `c2-${suffix}` } }),
      a = await prisma.author.create({ data: { name: 'A', slug: `a-${suffix}` } }),
      pub = await prisma.publisher.create({ data: { name: 'P', slug: `p-${suffix}` } });
    categoryId = c.id;
    replacementCategoryId = c2.id;
    authorId = a.id;
    publisherId = pub.id;
    const p = await prisma.product.create({
      data: {
        name: 'Base',
        slug: `base-${suffix}`,
        publisherId,
        shortDescription: 'before',
        publicationState: 'ACTIVE',
        primaryCategoryId: categoryId,
        isActive: true,
        categories: { create: { categoryId } },
        authors: { create: { authorId, sortOrder: 0 } },
      },
    });
    productId = p.id;
    const v = await prisma.productVariant.create({
      data: {
        productId,
        sku: `BASE_${suffix}`,
        name: 'Base',
        isbn: '0306406152',
        costPrice: 1,
        listPrice: 2,
        salePrice: 2,
      },
    });
    variantId = v.id;
  });
  afterAll(async () => {
    await prisma.product.updateMany({
      where: { id: productId },
      data: { publicationState: 'DRAFT', isActive: false, primaryCategoryId: null },
    });
    await prisma.category.updateMany({
      where: { id: { in: [categoryId, replacementCategoryId] } },
      data: { isActive: false },
    });
    await prisma.author.updateMany({ where: { id: authorId }, data: { isActive: false } });
    await prisma.publisher.updateMany({ where: { id: publisherId }, data: { isActive: false } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: actorId } });
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productAuthor.deleteMany({ where: { productId } });
    await prisma.productCategory.deleteMany({ where: { productId } });
    await prisma.inventory.deleteMany({ where: { productVariant: { productId } } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.slugReservation.deleteMany({
      where: { resourceId: { in: [productId, categoryId, authorId, publisherId] } },
    });
    await prisma.category.delete({ where: { id: categoryId } });
    await prisma.category.delete({ where: { id: replacementCategoryId } });
    await prisma.author.delete({ where: { id: authorId } });
    await prisma.publisher.delete({ where: { id: publisherId } });
    await prisma.user.delete({ where: { id: actorId } });
  });
  const principal = () => ({ userId: actorId, role: 'ADMIN' as const, familyId: 'test' });
  it('rolls back scalar, relations and audit when relation is invalid', async () => {
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: { categories: true, authors: true },
    });
    await expect(
      service.patchProduct(
        productId.toString(),
        { shortDescription: 'after', categoryIds: ['999999999999999999'] },
        principal(),
        context,
      ),
    ).rejects.toMatchObject({ code: 'CATALOG_RELATION_INVALID' });
    const after = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: { categories: true, authors: true },
    });
    expect(after.shortDescription).toBe(before.shortDescription);
    expect(after.categories).toEqual(before.categories);
    expect(after.authors).toEqual(before.authors);
    expect(
      await prisma.auditLog.count({
        where: { actorUserId: actorId, action: 'CATALOG_PRODUCT_UPDATED' },
      }),
    ).toBe(0);
  });
  it('prevents deactivating or deleting a category used as ACTIVE primary category', async () => {
    await expect(
      service.patchTaxonomy(
        'category',
        categoryId.toString(),
        { isActive: false },
        principal(),
        context,
      ),
    ).rejects.toMatchObject({ code: 'CATALOG_PRIMARY_CATEGORY_IN_USE' });
    await expect(
      service.softDeleteTaxonomy('category', categoryId.toString(), principal(), context),
    ).rejects.toMatchObject({ code: 'CATALOG_PRIMARY_CATEGORY_IN_USE' });
    const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
    expect(category).toMatchObject({ isActive: true, deletedAt: null });
  });
  it('allows atomic primary category replacement for ACTIVE products', async () => {
    const result = await service.patchProduct(
      productId.toString(),
      {
        publicationState: 'ACTIVE',
        primaryCategoryId: replacementCategoryId.toString(),
        categoryIds: [replacementCategoryId.toString()],
      },
      principal(),
      context,
    );
    expect(result).toMatchObject({ id: productId.toString() });
    await service.patchProduct(
      productId.toString(),
      {
        publicationState: 'ACTIVE',
        primaryCategoryId: categoryId.toString(),
        categoryIds: [categoryId.toString()],
      },
      principal(),
      context,
    );
  });
  it('maps concurrent explicit slug conflict', async () => {
    const slug = `same-${suffix}`;
    const results = await Promise.allSettled([
      service.createProduct(
        { name: 'S1', slug, categoryIds: [], authorIds: [] },
        principal(),
        context,
      ),
      service.createProduct(
        { name: 'S2', slug, categoryIds: [], authorIds: [] },
        principal(),
        context,
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.map(code)).toContain('CATALOG_SLUG_CONFLICT');
    const created = await prisma.product.findMany({ where: { slug } });
    for (const p of created) {
      await prisma.auditLog.deleteMany({ where: { entityId: p.id.toString() } });
      await prisma.product.delete({ where: { id: p.id } });
      await prisma.slugReservation.deleteMany({ where: { resourceId: p.id } });
    }
  });
  it('maps concurrent SKU and ISBN conflicts', async () => {
    const sku = `DUPE_${suffix}`;
    const skuResults = await Promise.allSettled([
      service.createVariant(
        productId.toString(),
        { sku, name: 'x', costPrice: 1, listPrice: 2, salePrice: 2 },
        principal(),
        context,
      ),
      service.createVariant(
        productId.toString(),
        { sku, name: 'x', costPrice: 1, listPrice: 2, salePrice: 2 },
        principal(),
        context,
      ),
    ]);
    expect(skuResults.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(skuResults.map(code)).toContain('CATALOG_SKU_CONFLICT');
    const isbn = '9780306406157';
    const isbnResults = await Promise.allSettled([
      service.createVariant(
        productId.toString(),
        { sku: `I1_${suffix}`, isbn, name: 'x', costPrice: 1, listPrice: 2, salePrice: 2 },
        principal(),
        context,
      ),
      service.createVariant(
        productId.toString(),
        { sku: `I2_${suffix}`, isbn, name: 'x', costPrice: 1, listPrice: 2, salePrice: 2 },
        principal(),
        context,
      ),
    ]);
    expect(isbnResults.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(isbnResults.map(code)).toContain('CATALOG_ISBN_CONFLICT');
  });
  it('enforces Product and Variant primary image uniqueness concurrently', async () => {
    const asset = (id: string) => ({
      url: `https://test/${id}.webp`,
      publicId: `hktstore/products/${id}`,
      mimeType: 'image/webp' as const,
      sizeBytes: 10,
    });
    const input = { productVariantId: null, altText: '', sortOrder: 0, isPrimary: true };
    const productResults = await Promise.allSettled([
      service.attachUploadedAsset(
        productId.toString(),
        asset(`p1-${suffix}`),
        input,
        principal(),
        context,
      ),
      service.attachUploadedAsset(
        productId.toString(),
        asset(`p2-${suffix}`),
        input,
        principal(),
        context,
      ),
    ]);
    expect(productResults.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(productResults.map(code)).toContain('CATALOG_IMAGE_INVALID');
    const variantInput = { ...input, productVariantId: variantId.toString() };
    const variantResults = await Promise.allSettled([
      service.attachUploadedAsset(
        productId.toString(),
        asset(`v1-${suffix}`),
        variantInput,
        principal(),
        context,
      ),
      service.attachUploadedAsset(
        productId.toString(),
        asset(`v2-${suffix}`),
        variantInput,
        principal(),
        context,
      ),
    ]);
    expect(variantResults.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(variantResults.map(code)).toContain('CATALOG_IMAGE_INVALID');
  });
});
