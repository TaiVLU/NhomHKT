import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/database/prisma.js';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { FakeProductImageAdapter } from '../src/modules/catalog/product-image.service.js';
import { createHealthService } from '../src/modules/health/health.service.js';
import type { Environment } from '../src/config/environment.js';
const suffix = Date.now().toString(),
  password = 'SmokePass123',
  env: Environment = {
    NODE_ENV: 'test',
    API_HOST: '127.0.0.1',
    API_PORT: 4000,
    WEB_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
    JWT_SECRET: 'j'.repeat(32),
    JWT_ISSUER: 'hktstore-api',
    JWT_AUDIENCE: 'hktstore-web',
    OTP_PEPPER: 'o'.repeat(32),
    MAIL_MODE: 'fake',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_FROM: 'noreply@test.local',
    PRODUCT_IMAGE_ADAPTER: 'fake',
  };
const auth = new AuthService(prisma, env, new FakeMailer()),
  images = new FakeProductImageAdapter(),
  catalog = new CatalogService(prisma, images),
  app = createApp({
    environment: env,
    healthService: createHealthService(prisma),
    authService: auth,
    catalogService: catalog,
    productImageAdapter: images,
  });
let adminId: bigint,
  staffId: bigint,
  productId = '',
  variantId = '',
  categoryId = '',
  authorId = '',
  publisherId = '',
  slug = '';
let adminToken = '',
  staffToken = '';
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const bodyOf = <T>(response: request.Response): { data: T } =>
  JSON.parse(response.text) as { data: T };
describe('Full M3 catalog smoke', () => {
  beforeAll(async () => {
    const hash = await hashPassword(password);
    const admin = await prisma.user.create({
        data: {
          username: `a${suffix}`.slice(0, 15),
          fullName: 'Admin Smoke',
          email: `a${suffix}@smoke.local`,
          phone: `+846${suffix.slice(-8)}`,
          passwordHash: hash,
          role: 'ADMIN',
        },
      }),
      staff = await prisma.user.create({
        data: {
          username: `s${suffix}`.slice(0, 15),
          fullName: 'Staff Smoke',
          email: `s${suffix}@smoke.local`,
          phone: `+847${suffix.slice(-8)}`,
          passwordHash: hash,
          role: 'STAFF',
        },
      });
    adminId = admin.id;
    staffId = staff.id;
  });
  afterAll(async () => {
    if (productId) {
      const id = BigInt(productId);
      await prisma.product.updateMany({
        where: { id },
        data: { publicationState: 'DRAFT', isActive: false, primaryCategoryId: null },
      });
      if (categoryId)
        await prisma.category.updateMany({
          where: { id: BigInt(categoryId) },
          data: { isActive: false },
        });
      if (authorId)
        await prisma.author.updateMany({
          where: { id: BigInt(authorId) },
          data: { isActive: false },
        });
      if (publisherId)
        await prisma.publisher.updateMany({
          where: { id: BigInt(publisherId) },
          data: { isActive: false },
        });
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productAuthor.deleteMany({ where: { productId: id } });
      await prisma.productCategory.deleteMany({ where: { productId: id } });
      await prisma.inventory.deleteMany({ where: { productVariant: { productId: id } } });
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.product.deleteMany({ where: { id } });
    }
    await prisma.slugReservation.deleteMany({
      where: {
        resourceId: {
          in: [
            adminId,
            staffId,
            ...[categoryId, authorId, publisherId, productId].filter(Boolean).map(BigInt),
          ],
        },
      },
    });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [adminId, staffId] } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [adminId, staffId] } } });
    if (categoryId) await prisma.category.delete({ where: { id: BigInt(categoryId) } });
    if (authorId) await prisma.author.delete({ where: { id: BigInt(authorId) } });
    if (publisherId) await prisma.publisher.delete({ where: { id: BigInt(publisherId) } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, staffId] } } });
  });
  it('executes the approved 23-step flow', async () => {
    expect((await request(app).get('/api/v1/health')).status).toBe(200);
    const login = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username: `a${suffix}`.slice(0, 15), password });
    expect(login.status).toBe(200);
    adminToken = bodyOf<{ accessToken: string }>(login).data.accessToken;
    const createTax = async (path: string, name: string) => {
      const r = await request(app)
        .post(`/api/v1/admin/${path}`)
        .set(bearer(adminToken))
        .send({ name });
      expect(r.status).toBe(201);
      return bodyOf<{ id: string }>(r).data.id;
    };
    categoryId = await createTax('categories', 'Smoke Category');
    authorId = await createTax('authors', 'Smoke Author');
    publisherId = await createTax('publishers', 'Smoke Publisher');
    const product = await request(app)
      .post('/api/v1/admin/products')
      .set(bearer(adminToken))
      .send({
        name: `Sách smoke ${suffix}`,
        publisherId,
        primaryCategoryId: categoryId,
        categoryIds: [categoryId],
        authorIds: [authorId],
        description: '# Markdown',
        publicationState: 'ACTIVE',
      });
    expect(product.status).toBe(201);
    const productData = bodyOf<{ id: string; slug: string }>(product).data;
    productId = productData.id;
    slug = productData.slug;
    expect(
      (
        await request(app)
          .patch(`/api/v1/admin/products/${productId}`)
          .set(bearer(adminToken))
          .send({
            shortDescription: 'Đã patch',
            categoryIds: [categoryId],
            authorRelations: [{ authorId, sortOrder: 0 }],
          })
      ).status,
    ).toBe(200);
    const variant = await request(app)
      .post(`/api/v1/admin/products/${productId}/variants`)
      .set(bearer(adminToken))
      .send({
        sku: `SMOKE_${suffix}`,
        isbn: '9780306406157',
        name: 'Bìa mềm',
        costPrice: 50000,
        listPrice: 100000,
        salePrice: 90000,
        isActive: true,
      });
    expect(variant.status).toBe(201);
    variantId = bodyOf<{ id: string }>(variant).data.id;
    const category = await prisma.category.findUniqueOrThrow({
      where: { id: BigInt(categoryId) },
    });
    const listing = await request(app)
      .get('/api/v1/products')
      .query({ q: `Sách smoke ${suffix}` });
    expect(bodyOf<unknown[]>(listing).data).toHaveLength(1);
    expect((await request(app).get(`/api/v1/products/${slug}`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/categories/${category.slug}`)).status).toBe(200);
    expect((await request(app).get('/api/v1/categories/not-a-real-category')).status).toBe(404);
    expect((await request(app).get('/api/v1/products/not-a-real-product')).status).toBe(404);
    expect(
      (await request(app).get('/api/v1/products/search-suggestions').query({ q: 'Sách smoke' }))
        .status,
    ).toBe(200);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nJ8AAAAASUVORK5CYII=',
      'base64',
    );
    const upload = await request(app)
      .post('/api/v1/admin/uploads/images')
      .set(bearer(adminToken))
      .field('uploadPurpose', 'PRODUCT')
      .field('productId', productId)
      .field('isPrimary', 'true')
      .attach('file', png, { filename: 'cover.png', contentType: 'image/png' });
    expect(upload.status).toBe(201);
    expect(
      bodyOf<{ variants: unknown[] }>(
        await request(app).get(`/api/v1/admin/products/${productId}`).set(bearer(adminToken)),
      ).data.variants[0],
    ).toHaveProperty('costPrice');
    const staffLogin = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username: `s${suffix}`.slice(0, 15), password });
    staffToken = bodyOf<{ accessToken: string }>(staffLogin).data.accessToken;
    const staffDetail = await request(app)
      .get(`/api/v1/admin/products/${productId}`)
      .set(bearer(staffToken));
    expect(staffDetail.status).toBe(200);
    expect(bodyOf<{ variants: unknown[] }>(staffDetail).data.variants[0]).not.toHaveProperty(
      'costPrice',
    );
    expect(
      (
        await request(app)
          .patch(`/api/v1/admin/products/${productId}`)
          .set(bearer(staffToken))
          .send({ name: 'No' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/api/v1/admin/uploads/images')
          .set(bearer(staffToken))
          .field('uploadPurpose', 'PRODUCT')
          .field('productId', productId)
          .attach('file', png, { filename: 'x.png', contentType: 'image/png' })
      ).status,
    ).toBe(403);
    await request(app)
      .patch(`/api/v1/admin/products/${productId}/variants/${variantId}`)
      .set(bearer(adminToken))
      .send({ isActive: false });
    expect((await request(app).get(`/api/v1/products/${slug}`)).status).toBe(404);
    expect(
      bodyOf<unknown[]>(
        await request(app)
          .get('/api/v1/products')
          .query({ q: `SĂ¡ch smoke ${suffix}` }),
      ).data,
    ).toHaveLength(0);
    await request(app)
      .patch(`/api/v1/admin/products/${productId}/variants/${variantId}`)
      .set(bearer(adminToken))
      .send({ isActive: true });
    expect((await request(app).get(`/api/v1/products/${slug}`)).status).toBe(200);
    await request(app).delete(`/api/v1/admin/products/${productId}`).set(bearer(adminToken));
    expect((await request(app).get(`/api/v1/products/${slug}`)).status).toBe(404);
  }, 20_000);
});
