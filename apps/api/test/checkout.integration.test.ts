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
import { CheckoutService } from '../src/modules/checkout/checkout.service.js';
import { createHealthService } from '../src/modules/health/health.service.js';

const suffix = Date.now().toString();
const password = 'Checkout12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'e'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'f'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'no-reply@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  accountService: new AccountService(prisma),
  cartService: new CartService(prisma),
  checkoutService: new CheckoutService(prisma),
});

let customerA: bigint,
  customerB: bigint,
  customerC: bigint,
  staff: bigint,
  addressA: bigint,
  addressB: bigint,
  addressC: bigint,
  tokenA = '',
  tokenB = '',
  tokenC = '',
  staffToken = '';
const productIds: bigint[] = [];
const variantIds: bigint[] = [];
const addressIds: bigint[] = [];
const categoryIds: bigint[] = [];

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const errorCodeOf = (response: request.Response) =>
  (JSON.parse(response.text) as { error: { code: string } }).error.code;
const checkoutBody = (shippingAddressId: bigint, deliveryNote = 'Giao trong giờ hành chính') => ({
  shippingAddressId: shippingAddressId.toString(),
  paymentMethod: 'COD',
  deliveryNote,
});
const checkout = (
  token: string,
  shippingAddressId: bigint,
  key: string,
  body: Record<string, unknown> = checkoutBody(shippingAddressId),
) =>
  request(app).post('/api/v1/checkout').set(bearer(token)).set('Idempotency-Key', key).send(body);

const createAddress = async (userId: bigint, label: string) => {
  const address = await prisma.address.create({
    data: {
      userId,
      recipientName: `${label} Recipient`,
      phone: '+84901234567',
      line1: `${label} Line 1`,
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      postalCode: '700000',
      isDefault: true,
    },
  });
  addressIds.push(address.id);
  return address.id;
};

const createVariant = async (name: string, stock: number, salePrice = 90000) => {
  const category = await prisma.category.create({
    data: {
      name: `${name} Category`,
      slug: `${name.toLowerCase().replace(/\s+/g, '-')}-category-${suffix}-${categoryIds.length}`,
      isActive: true,
    },
  });
  categoryIds.push(category.id);
  const product = await prisma.product.create({
    data: {
      name,
      slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}-${productIds.length}`,
      isActive: true,
      publicationState: 'ACTIVE',
      primaryCategoryId: category.id,
      categories: { create: { categoryId: category.id } },
      variants: {
        create: {
          sku: `${name.replace(/\s+/g, '-').toUpperCase()}-${suffix}`.slice(0, 64),
          name: 'Paperback',
          costPrice: Math.floor(salePrice / 2),
          listPrice: salePrice + 10000,
          salePrice,
          isActive: true,
          inventory: { create: { onHandQuantity: stock, reservedQuantity: 0 } },
        },
      },
    },
    include: { variants: true },
  });
  productIds.push(product.id);
  variantIds.push(product.variants[0]!.id);
  return product.variants[0]!.id;
};

describe('M5D checkout SQL Server integration', () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(password);
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: `cka${suffix}`.slice(0, 15),
          fullName: 'Checkout Customer A',
          email: `cka${suffix}@m5d.local`,
          phone: `+8480${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `ckb${suffix}`.slice(0, 15),
          fullName: 'Checkout Customer B',
          email: `ckb${suffix}@m5d.local`,
          phone: `+8481${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `ckc${suffix}`.slice(0, 15),
          fullName: 'Checkout Customer C',
          email: `ckc${suffix}@m5d.local`,
          phone: `+8482${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `cks${suffix}`.slice(0, 15),
          fullName: 'Checkout Staff',
          email: `cks${suffix}@m5d.local`,
          phone: `+8483${suffix.slice(-7)}`,
          passwordHash,
          role: 'STAFF',
        },
      }),
    ]);
    customerA = users[0].id;
    customerB = users[1].id;
    customerC = users[2].id;
    staff = users[3].id;
    addressA = await createAddress(customerA, 'A');
    addressB = await createAddress(customerB, 'B');
    addressC = await createAddress(customerC, 'C');
    tokenA = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: users[0].email, password }),
    ).accessToken;
    tokenB = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: users[1].email, password }),
    ).accessToken;
    tokenC = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: users[2].email, password }),
    ).accessToken;
    staffToken = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: users[3].username, password }),
    ).accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { publicationState: 'DRAFT', isActive: false, primaryCategoryId: null },
    });
    await prisma.category.updateMany({
      where: { id: { in: categoryIds } },
      data: { isActive: false },
    });
    await prisma.checkoutIdempotency.deleteMany({
      where: { customerId: { in: [customerA, customerB, customerC] } },
    });
    await prisma.orderItem.deleteMany({
      where: {
        OR: [
          { order: { customerId: { in: [customerA, customerB, customerC] } } },
          { variantId: { in: variantIds } },
        ],
      },
    });
    await prisma.orderStatusHistory.deleteMany({
      where: { order: { customerId: { in: [customerA, customerB, customerC] } } },
    });
    await prisma.order.deleteMany({
      where: { customerId: { in: [customerA, customerB, customerC] } },
    });
    await prisma.cartItem.deleteMany({
      where: {
        OR: [
          { cart: { customerId: { in: [customerA, customerB, customerC] } } },
          { variantId: { in: variantIds } },
        ],
      },
    });
    await prisma.cart.deleteMany({
      where: { customerId: { in: [customerA, customerB, customerC] } },
    });
    await prisma.productCategory.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.inventoryLedger.deleteMany({ where: { inventoryId: { in: variantIds } } });
    await prisma.inventory.deleteMany({ where: { productVariantId: { in: variantIds } } });
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    await prisma.address.deleteMany({ where: { id: { in: addressIds } } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [customerA, customerB, customerC, staff] } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorUserId: { in: [customerA, customerB, customerC, staff] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [customerA, customerB, customerC, staff] } },
    });
  }, 30000);

  it('creates an order with immutable address, COD payment, totals, inventory consumption, and cart clear', async () => {
    const variantId = await createVariant('Checkout Success Book', 5, 120000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenA))
      .send({ variantId: variantId.toString(), quantity: 2 });

    const response = await checkout(tokenA, addressA, `success-${suffix}`);
    expect(response.status).toBe(201);
    const order = dataOf<{
      orderNumber: string;
      orderStatus: string;
      paymentMethod: string;
      paymentStatus: string;
      totalQuantity: number;
      subtotal: number;
      shippingFee: number;
      discount: number;
      grandTotal: number;
      shippingAddress: { recipientName: string; line1: string; deliveryNote: string | null };
      items: Array<{ variantId: string; quantity: number; unitPrice: number; subtotal: number }>;
    }>(response);
    expect(order.orderNumber).toMatch(/^RS\d{14}[A-Z0-9]{6}$/);
    expect(order.orderStatus).toBe('PENDING_CONFIRMATION');
    expect(order.paymentMethod).toBe('COD');
    expect(order.paymentStatus).toBe('UNPAID');
    expect(order.totalQuantity).toBe(2);
    expect(order.subtotal).toBe(240000);
    expect(order.shippingFee).toBe(0);
    expect(order.discount).toBe(0);
    expect(order.grandTotal).toBe(240000);
    expect(order.shippingAddress).toMatchObject({
      recipientName: 'A Recipient',
      line1: 'A Line 1',
      deliveryNote: 'Giao trong giờ hành chính',
    });
    expect(order.items[0]).toMatchObject({
      variantId: variantId.toString(),
      quantity: 2,
      unitPrice: 120000,
      subtotal: 240000,
    });
    await prisma.address.update({ where: { id: addressA }, data: { line1: 'A Changed Line' } });
    const persisted = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: order.orderNumber },
    });
    expect(persisted.shippingLine1).toBe('A Line 1');
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }),
    ).toMatchObject({ onHandQuantity: 3 });
    const ledger = await prisma.inventoryLedger.findMany({
      where: { inventoryId: variantId },
      orderBy: { id: 'asc' },
    });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      adjustmentType: 'CHECKOUT_CONSUMPTION',
      quantityDelta: -2,
      beforeQuantity: 5,
      afterQuantity: 3,
    });
    expect(ledger[0]?.reason).toContain(order.orderNumber);
    const orderItem = await prisma.orderItem.findFirstOrThrow({
      where: { order: { orderNumber: order.orderNumber }, variantId },
    });
    expect(orderItem.productTitleSnapshot).toBe('Checkout Success Book');
    expect(orderItem.productSlugSnapshot).toBeTruthy();
    expect(orderItem.variantNameSnapshot).toBe('Paperback');
    expect(orderItem.skuSnapshot).toBeTruthy();
    expect(orderItem.unitListPrice?.toNumber()).toBe(130000);
    expect(orderItem.unitEffectivePrice?.toNumber()).toBe(120000);
    expect(orderItem.lineTotal?.toNumber()).toBe(240000);
    const cart = await prisma.cart.findUniqueOrThrow({
      where: { customerId: customerA },
      include: { items: true },
    });
    expect(cart.items).toHaveLength(0);
  });

  it('rejects invalid auth, idempotency, address, payment, empty cart, and trusted totals', async () => {
    expect((await request(app).post('/api/v1/checkout').send({})).status).toBe(401);
    expect(
      (await request(app).post('/api/v1/checkout').set(bearer(staffToken)).send({})).status,
    ).toBe(403);
    const missingKey = await request(app)
      .post('/api/v1/checkout')
      .set(bearer(tokenB))
      .send(checkoutBody(addressB));
    expect(missingKey.status).toBe(400);
    expect(errorCodeOf(missingKey)).toBe('CHECKOUT_IDEMPOTENCY_KEY_REQUIRED');
    const crossOwner = await checkout(tokenB, addressA, `cross-owner-${suffix}`);
    expect(crossOwner.status).toBe(404);
    expect(errorCodeOf(crossOwner)).toBe('CHECKOUT_ADDRESS_NOT_FOUND');
    const unsupportedPayment = await checkout(tokenB, addressB, `unsupported-${suffix}`, {
      ...checkoutBody(addressB),
      paymentMethod: 'BANK_TRANSFER',
    });
    expect(unsupportedPayment.status).toBe(400);
    const spoofTotals = await checkout(tokenB, addressB, `spoof-${suffix}`, {
      ...checkoutBody(addressB),
      grandTotal: 1,
    });
    expect(spoofTotals.status).toBe(400);
    await request(app).get('/api/v1/cart').set(bearer(tokenB));
    const empty = await checkout(tokenB, addressB, `empty-${suffix}`);
    expect(empty.status).toBe(400);
    expect(errorCodeOf(empty)).toBe('CHECKOUT_CART_EMPTY');
  });

  it('rolls back order creation, stock, cart, and idempotency on price change', async () => {
    const variantId = await createVariant('Checkout Price Book', 4, 70000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: variantId.toString(), quantity: 1 });
    await prisma.productVariant.update({ where: { id: variantId }, data: { salePrice: 75000 } });

    const key = `price-change-${suffix}`;
    const response = await checkout(tokenB, addressB, key);
    expect(response.status).toBe(409);
    expect(errorCodeOf(response)).toBe('CHECKOUT_PRICE_CHANGED');
    expect(await prisma.order.count({ where: { customerId: customerB } })).toBe(0);
    expect(await prisma.checkoutIdempotency.count({ where: { customerId: customerB, key } })).toBe(
      0,
    );
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }),
    ).toMatchObject({ onHandQuantity: 4 });
    expect(await prisma.inventoryLedger.count({ where: { inventoryId: variantId } })).toBe(0);
    expect(
      await prisma.cartItem.count({ where: { cart: { customerId: customerB }, variantId } }),
    ).toBe(1);
  });

  it('rolls back multi-item inventory consumption and ledger entries when a later item fails', async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { customerId: customerB } } });
    const firstVariantId = await createVariant('Checkout Multi Rollback A', 3, 61000);
    const secondVariantId = await createVariant('Checkout Multi Rollback B', 2, 62000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: firstVariantId.toString(), quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: secondVariantId.toString(), quantity: 2 });
    await prisma.inventory.update({
      where: { productVariantId: secondVariantId },
      data: { onHandQuantity: 1 },
    });

    const response = await checkout(tokenB, addressB, `multi-rollback-${suffix}`);
    expect(response.status).toBe(400);
    expect(errorCodeOf(response)).toBe('CHECKOUT_OUT_OF_STOCK');
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: firstVariantId } }),
    ).toMatchObject({ onHandQuantity: 3 });
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: secondVariantId } }),
    ).toMatchObject({ onHandQuantity: 1 });
    expect(
      await prisma.inventoryLedger.count({
        where: { inventoryId: { in: [firstVariantId, secondVariantId] } },
      }),
    ).toBe(0);
    expect(
      await prisma.order.count({
        where: { customerId: customerB, items: { some: { variantId: firstVariantId } } },
      }),
    ).toBe(0);
  });

  it('returns the same order for repeated idempotent requests without consuming stock twice', async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { customerId: customerB } } });
    const variantId = await createVariant('Checkout Idempotent Book', 2, 88000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: variantId.toString(), quantity: 1 });
    const key = `same-key-${suffix}`;

    const first = await checkout(tokenB, addressB, key);
    const second = await checkout(tokenB, addressB, key);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(dataOf<{ orderNumber: string }>(second).orderNumber).toBe(
      dataOf<{ orderNumber: string }>(first).orderNumber,
    );
    expect(await prisma.order.count({ where: { customerId: customerB } })).toBe(1);
    expect(await prisma.orderItem.count({ where: { variantId } })).toBe(1);
    expect(await prisma.inventoryLedger.count({ where: { inventoryId: variantId } })).toBe(1);
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }),
    ).toMatchObject({ onHandQuantity: 1 });
    const conflict = await checkout(tokenB, addressB, key, checkoutBody(addressB, 'Ghi chú khác'));
    expect(conflict.status).toBe(409);
    expect(errorCodeOf(conflict)).toBe('CHECKOUT_IDEMPOTENCY_CONFLICT');
  });

  it('scopes idempotency by customer and serializes concurrent same-key requests to one order', async () => {
    await prisma.cartItem.deleteMany({
      where: { cart: { customerId: { in: [customerB, customerC] } } },
    });
    const variantB = await createVariant('Checkout Scoped Customer B', 2, 55000);
    const variantC = await createVariant('Checkout Scoped Customer C', 2, 56000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: variantB.toString(), quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenC))
      .send({ variantId: variantC.toString(), quantity: 1 });

    const sharedKey = `shared-key-${suffix}`;
    expect((await checkout(tokenB, addressB, sharedKey)).status).toBe(201);
    expect((await checkout(tokenC, addressC, sharedKey)).status).toBe(201);

    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenC))
      .send({ variantId: variantC.toString(), quantity: 1 });
    const concurrentKey = `concurrent-key-${suffix}`;
    const responses = await Promise.all([
      checkout(tokenC, addressC, concurrentKey),
      checkout(tokenC, addressC, concurrentKey),
    ]);
    expect(responses.every((response) => response.status === 201)).toBe(true);
    const orderNumbers = responses.map(
      (response) => dataOf<{ orderNumber: string }>(response).orderNumber,
    );
    expect(new Set(orderNumbers).size).toBe(1);
  }, 20000);

  it('rejects disabled products/variants and prevents oversell under concurrent checkout', async () => {
    await prisma.cartItem.deleteMany({
      where: { cart: { customerId: { in: [customerB, customerC] } } },
    });
    const productDisabledVariantId = await createVariant('Checkout Disabled Product', 2, 50000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenC))
      .send({ variantId: productDisabledVariantId.toString(), quantity: 1 });
    await prisma.product.update({
      where: { id: productIds[productIds.length - 1]! },
      data: { isActive: false, publicationState: 'INACTIVE' },
    });
    const productResponse = await checkout(tokenC, addressC, `disabled-product-${suffix}`);
    expect(productResponse.status).toBe(400);
    expect(errorCodeOf(productResponse)).toBe('CHECKOUT_PRODUCT_DISABLED');

    await prisma.cartItem.deleteMany({ where: { cart: { customerId: customerC } } });
    const variantDisabledId = await createVariant('Checkout Disabled Variant', 2, 50000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenC))
      .send({ variantId: variantDisabledId.toString(), quantity: 1 });
    await prisma.productVariant.update({
      where: { id: variantDisabledId },
      data: { isActive: false },
    });
    const variantResponse = await checkout(tokenC, addressC, `disabled-variant-${suffix}`);
    expect(variantResponse.status).toBe(400);
    expect(errorCodeOf(variantResponse)).toBe('CHECKOUT_VARIANT_DISABLED');

    await prisma.cartItem.deleteMany({
      where: { cart: { customerId: { in: [customerB, customerC] } } },
    });
    const scarceVariantId = await createVariant('Checkout Scarce Book', 1, 99000);
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenB))
      .send({ variantId: scarceVariantId.toString(), quantity: 1 });
    await request(app)
      .post('/api/v1/cart/items')
      .set(bearer(tokenC))
      .send({ variantId: scarceVariantId.toString(), quantity: 1 });

    const responses = await Promise.all([
      checkout(tokenB, addressB, `scarce-b-${suffix}`),
      checkout(tokenC, addressC, `scarce-c-${suffix}`),
    ]);
    const successCount = responses.filter((response) => response.status === 201).length;
    const failureCodes = responses
      .filter((response) => response.status !== 201)
      .map((response) => errorCodeOf(response));
    expect(successCount).toBe(1);
    expect(failureCodes).toEqual(['CHECKOUT_OUT_OF_STOCK']);
    expect(
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: scarceVariantId } }),
    ).toMatchObject({ onHandQuantity: 0 });
    const ledgerRows = await prisma.inventoryLedger.findMany({
      where: { inventoryId: scarceVariantId, adjustmentType: 'CHECKOUT_CONSUMPTION' },
    });
    expect(ledgerRows).toHaveLength(1);
    expect(ledgerRows[0]).toMatchObject({ quantityDelta: -1, beforeQuantity: 1, afterQuantity: 0 });
  }, 20000);
});
