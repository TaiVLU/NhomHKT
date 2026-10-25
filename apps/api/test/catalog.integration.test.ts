import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/database/prisma.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';

const service = new CatalogService(prisma);
const suffix = Date.now().toString();
const ids: bigint[] = [];
const categoryIds: bigint[] = [];
describe('Catalog SQL Server integration', () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    for (const [index, price] of [300000, 100000, 200000].entries()) {
      const category = await prisma.category.create({
        data: {
          name: `M3 Sort Category ${suffix} ${index}`,
          slug: `m3-sort-category-${suffix}-${index}`,
          isActive: true,
          sortOrder: index,
        },
      });
      categoryIds.push(category.id);
      const p = await prisma.product.create({
        data: {
          name: `M3 Sort ${suffix} ${index}`,
          slug: `m3-sort-${suffix}-${index}`,
          isActive: true,
          publicationState: 'ACTIVE',
          primaryCategoryId: category.id,
          categories: { create: { categoryId: category.id } },
        },
      });
      ids.push(p.id);
      await prisma.slugReservation.create({
        data: { resourceType: 'PRODUCT', slug: p.slug, resourceId: p.id },
      });
      const variant = await prisma.productVariant.create({
        data: {
          productId: p.id,
          sku: `M3_${suffix}_${index}`,
          name: 'Bản chuẩn',
          costPrice: price / 2,
          listPrice: price,
          salePrice: price,
          isActive: true,
        },
      });
      await prisma.inventory.create({
        data: {
          productVariantId: variant.id,
          onHandQuantity: index === 1 ? 0 : index === 2 ? 2 : 10,
          reservedQuantity: 0,
          lowStockThreshold: 3,
        },
      });
    }
    await prisma.productVariant.create({
      data: {
        productId: ids[0]!,
        sku: `M3_${suffix}_INACTIVE`,
        name: 'Inactive',
        costPrice: 1,
        listPrice: 1,
        salePrice: 1,
        isActive: false,
      },
    });
  });
  afterAll(async () => {
    await prisma.productImage.deleteMany({ where: { productId: { in: ids } } });
    await prisma.productAuthor.deleteMany({ where: { productId: { in: ids } } });
    await prisma.productCategory.deleteMany({ where: { productId: { in: ids } } });
    await prisma.inventory.deleteMany({ where: { productVariant: { productId: { in: ids } } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    await prisma.slugReservation.deleteMany({
      where: { resourceType: 'PRODUCT', resourceId: { in: ids } },
    });
  });
  it('sorts globally before pagination and ignores inactive variants', async () => {
    const asc = await service.publicProducts({
      sort: 'price_asc',
      page: 1,
      pageSize: 1,
      q: `M3 Sort ${suffix}`,
    });
    const desc = await service.publicProducts({
      sort: 'price_desc',
      page: 1,
      pageSize: 1,
      q: `M3 Sort ${suffix}`,
    });
    expect(asc.data[0]?.id).toBe(ids[1]?.toString());
    expect(desc.data[0]?.id).toBe(ids[0]?.toString());
  });
  it('uses stable Product ID tie breaker', async () => {
    await prisma.productVariant.updateMany({
      where: { productId: { in: ids } },
      data: { salePrice: 200000, listPrice: 200000 },
    });
    const result = await service.publicProducts({
      sort: 'price_asc',
      page: 1,
      pageSize: 3,
      q: `M3 Sort ${suffix}`,
    });
    expect(result.data.map((p) => BigInt(p.id))).toEqual([...ids].sort((a, b) => (a < b ? -1 : 1)));
  });
  it('direct detail separates Admin and Staff costPrice', async () => {
    const admin = await service.adminProduct(ids[0]!.toString(), {
      userId: 1n,
      role: 'ADMIN',
      familyId: 'x',
    });
    const staff = await service.adminProduct(ids[0]!.toString(), {
      userId: 1n,
      role: 'STAFF',
      familyId: 'x',
    });
    expect(admin.variants[0]).toHaveProperty('costPrice');
    expect(staff.variants[0]).not.toHaveProperty('costPrice');
  });
  it('searches by SKU and returns public availability without internal inventory fields', async () => {
    const result = await service.publicProducts({
      sort: 'name_asc',
      page: 1,
      pageSize: 5,
      q: `M3_${suffix}_2`,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.variants[0]?.sku).toBe(`M3_${suffix}_2`);
    expect(result.data[0]?.availability).toMatchObject({
      availableQuantity: 2,
      inStock: true,
      lowStock: true,
    });
    expect(result.data[0]?.variants[0]).not.toHaveProperty('costPrice');
    expect(result.data[0]?.variants[0]).not.toHaveProperty('reservedQuantity');
  });
  it('filters by stock state', async () => {
    const inStock = await service.publicProducts({
      sort: 'price-asc'.replace('-', '_'),
      page: 1,
      pageSize: 5,
      q: `M3 Sort ${suffix}`,
      inStock: 'true',
    });
    const outOfStock = await service.publicProducts({
      sort: 'price_desc',
      page: 1,
      pageSize: 5,
      q: `M3 Sort ${suffix}`,
      inStock: 'false',
    });
    expect(inStock.data.map((item) => item.id)).not.toContain(ids[1]?.toString());
    expect(outOfStock.data.map((item) => item.id)).toEqual([ids[1]?.toString()]);
  });
});
