import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import { prisma } from '../src/database/prisma.js';
import { AccountService } from '../src/modules/account/account.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { CartService } from '../src/modules/cart/cart.service.js';
import { createHealthService } from '../src/modules/health/health.service.js';

const suffix = Date.now().toString();
const password = 'Cart12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'c'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'd'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'no-reply@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const cart = new CartService(prisma);
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  accountService: new AccountService(prisma),
  cartService: cart,
});

let customerA: bigint,
  customerB: bigint,
  staff: bigint,
  categoryId: bigint,
  productId: bigint,
  variantId: bigint,
  tokenA = '',
  tokenB = '',
  staffToken = '',
  cartItemId = '';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;

describe('M5C cart SQL Server integration', () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(password);
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: `cta${suffix}`.slice(0, 15),
          fullName: 'Cart Customer A',
          email: `cta${suffix}@m5c.local`,
          phone: `+8490${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `ctb${suffix}`.slice(0, 15),
          fullName: 'Cart Customer B',
          email: `ctb${suffix}@m5c.local`,
          phone: `+8491${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `cts${suffix}`.slice(0, 15),
          fullName: 'Cart Staff',
          email: `cts${suffix}@m5c.local`,
          phone: `+8492${suffix.slice(-7)}`,
          passwordHash,
          role: 'STAFF',
        },
      }),
    ]);
    customerA = users[0].id;
    customerB = users[1].id;
    staff = users[2].id;
    const category = await prisma.category.create({
      data: { name: `Cart Category ${suffix}`, slug: `cart-category-${suffix}`, isActive: true },
    });
    categoryId = category.id;
    const product = await prisma.product.create({
      data: {
        name: 'Cart Test Book',
        slug: `cart-test-book-${suffix}`,
        isActive: true,
        publicationState: 'ACTIVE',
        primaryCategoryId: category.id,
        categories: { create: { categoryId: category.id } },
        variants: {
          create: {
            sku: `CART-${suffix}`.slice(0, 64),
            name: 'Paperback',
            costPrice: 50000,
            listPrice: 100000,
            salePrice: 80000,
            isActive: true,
            inventory: { create: { onHandQuantity: 5, reservedQuantity: 1 } },
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0]!.id;
    tokenA = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: users[0].email, password }),
    ).accessToken;
    tokenB = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: users[1].email, password }),
    ).accessToken;
    staffToken = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: users[2].username, password }),
    ).accessToken;
  });

  afterAll(async () => {
    await prisma.product.updateMany({
      where: { id: productId },
      data: { publicationState: 'DRAFT', isActive: false, primaryCategoryId: null },
    });
    await prisma.category.updateMany({ where: { id: categoryId }, data: { isActive: false } });
    await prisma.cartItem.deleteMany({
      where: { OR: [{ cart: { customerId: { in: [customerA, customerB] } } }, { variantId }] },
    });
    await prisma.cart.deleteMany({ where: { customerId: { in: [customerA, customerB] } } });
    await prisma.productCategory.deleteMany({ where: { productId } });
    await prisma.inventoryLedger.deleteMany({ where: { inventoryId: variantId } });
    await prisma.inventory.deleteMany({ where: { productVariantId: variantId } });
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [customerA, customerB, staff] } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorUserId: { in: [customerA, customerB, staff] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [customerA, customerB, staff] } } });
  });

  it('creates one active cart and merges duplicate variant additions', async () => {
    const first = await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenA))
      .send({ variantId: variantId.toString(), quantity: 2 });
    expect(first.status).toBe(201);
    expect(
      dataOf<{ items: Array<{ unitPrice: number; quantity: number; subtotal: number }> }>(first)
        .items[0],
    ).toMatchObject({
      quantity: 2,
      unitPrice: 80000,
      subtotal: 160000,
    });
    cartItemId = dataOf<{ items: Array<{ id: string }> }>(first).items[0]!.id;
    const second = await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenA))
      .send({ variantId: variantId.toString(), quantity: 2 });
    expect(second.status).toBe(201);
    const cartDto = dataOf<{
      cartId: string;
      totalQuantity: number;
      subtotal: number;
      items: unknown[];
    }>(second);
    expect(cartDto.items).toHaveLength(1);
    expect(cartDto.totalQuantity).toBe(4);
    expect(cartDto.subtotal).toBe(320000);
    expect(await prisma.cart.count({ where: { customerId: customerA } })).toBe(1);
  });

  it('rejects stock overflow and updates item quantity within stock', async () => {
    expect(
      (
        await request(app)
          .post('/api/v1/cart/items')
          .set(bearer(tokenA))
          .send({ variantId: variantId.toString(), quantity: 1 })
      ).status,
    ).toBe(400);
    const updated = await request(app)
      .patch(`/api/v1/cart/items/${cartItemId}`)
      .set(bearer(tokenA))
      .send({ quantity: 3 });
    expect(updated.status).toBe(200);
    expect(dataOf<{ totalQuantity: number }>(updated).totalQuantity).toBe(3);
  });

  it('enforces authentication, customer role, and cart ownership', async () => {
    expect((await request(app).get('/api/v1/cart')).status).toBe(401);
    expect((await request(app).get('/api/v1/cart').set(bearer(staffToken))).status).toBe(403);
    const otherDelete = await request(app)
      .delete(`/api/v1/cart/items/${cartItemId}`)
      .set(bearer(tokenB));
    expect(otherDelete.status).toBe(200);
    expect(dataOf<{ items: unknown[] }>(otherDelete).items).toHaveLength(0);
    expect(
      dataOf<{ items: unknown[] }>(await request(app).get('/api/v1/cart').set(bearer(tokenA)))
        .items,
    ).toHaveLength(1);
  });

  it('removes items and clears cart without deleting the cart', async () => {
    expect(
      (await request(app).delete(`/api/v1/cart/items/${cartItemId}`).set(bearer(tokenA))).status,
    ).toBe(200);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenA))
      .send({ variantId: variantId.toString(), quantity: 1 });
    const beforeClear = await prisma.cart.findUniqueOrThrow({ where: { customerId: customerA } });
    const cleared = await request(app).delete('/api/v1/cart').set(bearer(tokenA));
    expect(cleared.status).toBe(200);
    expect(
      dataOf<{ items: unknown[]; totalQuantity: number; subtotal: number }>(cleared),
    ).toMatchObject({
      items: [],
      totalQuantity: 0,
      subtotal: 0,
    });
    expect(await prisma.cart.findUnique({ where: { id: beforeClear.id } })).toBeTruthy();
  });

  it('keeps cart non-reserving while validating available quantity', async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { customerId: customerB } } });
    const before = await prisma.inventory.findUniqueOrThrow({
      where: { productVariantId: variantId },
    });

    const response = await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: variantId.toString(), quantity: 1 });

    expect(response.status).toBe(201);
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }),
    ).toMatchObject({
      onHandQuantity: before.onHandQuantity,
      reservedQuantity: before.reservedQuantity,
    });
    expect(await prisma.inventoryLedger.count({ where: { inventoryId: variantId } })).toBe(0);
  });
});
