import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import { prisma } from '../src/database/prisma.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { createHealthService } from '../src/modules/health/health.service.js';
import { OrdersService } from '../src/modules/orders/orders.service.js';

const suffix = Date.now().toString();
const password = 'Orders12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'k'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'l'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'orders@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  ordersService: new OrdersService(prisma),
});

let customerA: bigint,
  customerB: bigint,
  addressA: bigint,
  addressB: bigint,
  productId: bigint,
  variantId: bigint,
  tokenA = '',
  tokenB = '',
  orderA1 = '',
  orderA2 = '',
  orderB = '';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const errorCodeOf = (response: request.Response) =>
  (JSON.parse(response.text) as { error: { code: string } }).error.code;

const createOrder = async (
  customerId: bigint,
  addressId: bigint,
  orderNumber: string,
  withSnapshot = true,
) => {
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      shippingAddressId: addressId,
      status: 'PENDING_CONFIRMATION',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      shippingRecipientName: `Recipient ${orderNumber}`,
      shippingPhone: '+84901234567',
      shippingLine1: '12 Nguyen Hue',
      shippingWard: 'Phuong Ben Nghe',
      shippingDistrict: 'Quan 1',
      shippingProvince: 'TP. Ho Chi Minh',
      shippingPostalCode: '700000',
      deliveryNote: 'Call first',
      subtotal: 120000,
      shippingFee: 0,
      discount: 0,
      total: 120000,
      grandTotal: 120000,
      items: {
        create: {
          variantId,
          quantity: 2,
          unitPrice: 60000,
          ...(withSnapshot
            ? {
                productTitleSnapshot: `Snapshot ${orderNumber}`,
                productSlugSnapshot: `snapshot-${orderNumber.toLowerCase()}`,
                variantNameSnapshot: 'Snapshot Paperback',
                skuSnapshot: `SNAP_${orderNumber}`.slice(0, 64),
                authorNamesSnapshot: JSON.stringify(['Snapshot Author']),
                unitListPrice: 60000,
                unitSalePrice: 60000,
                unitEffectivePrice: 60000,
                lineTotal: 120000,
              }
            : {}),
        },
      },
    },
  });
  return order.orderNumber;
};

describe('M5E customer orders integration', () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(password);
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: {
          username: `oa${suffix}`.slice(0, 15),
          fullName: 'Orders Customer A',
          email: `oa${suffix}@orders.local`,
          phone: `+8450${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: `ob${suffix}`.slice(0, 15),
          fullName: 'Orders Customer B',
          email: `ob${suffix}@orders.local`,
          phone: `+8451${suffix.slice(-7)}`,
          passwordHash,
        },
      }),
    ]);
    customerA = userA.id;
    customerB = userB.id;
    const [a, b] = await Promise.all([
      prisma.address.create({
        data: {
          userId: customerA,
          recipientName: 'A Recipient',
          phone: '+84901234567',
          line1: 'A Line',
          ward: 'Ward',
          district: 'District',
          province: 'Province',
        },
      }),
      prisma.address.create({
        data: {
          userId: customerB,
          recipientName: 'B Recipient',
          phone: '+84901234568',
          line1: 'B Line',
          ward: 'Ward',
          district: 'District',
          province: 'Province',
        },
      }),
    ]);
    addressA = a.id;
    addressB = b.id;
    const product = await prisma.product.create({
      data: {
        name: `Orders Book ${suffix}`,
        slug: `orders-book-${suffix}`,
        isActive: true,
        variants: {
          create: {
            sku: `ORDERS_${suffix}`,
            name: 'Paperback',
            costPrice: 30000,
            listPrice: 60000,
            salePrice: 60000,
            isActive: true,
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0]!.id;
    orderA1 = await createOrder(customerA, addressA, `RSA${suffix}01`);
    await new Promise((resolve) => setTimeout(resolve, 5));
    orderA2 = await createOrder(customerA, addressA, `RSA${suffix}02`);
    orderB = await createOrder(customerB, addressB, `RSB${suffix}01`, false);
    tokenA = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: userA.email, password }),
    ).accessToken;
    tokenB = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: userB.email, password }),
    ).accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { variantId } });
    await prisma.orderStatusHistory.deleteMany({
      where: { order: { customerId: { in: [customerA, customerB] } } },
    });
    await prisma.order.deleteMany({ where: { customerId: { in: [customerA, customerB] } } });
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.address.deleteMany({ where: { id: { in: [addressA, addressB] } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: [customerA, customerB] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customerA, customerB] } } });
  });

  it('lists only the authenticated customer orders newest first with pagination', async () => {
    const response = await request(app)
      .get('/api/v1/orders')
      .set(bearer(tokenA))
      .query({ page: 1, pageSize: 1 });
    expect(response.status).toBe(200);
    const body = JSON.parse(response.text) as {
      data: Array<{ orderNumber: string; itemCount: number; grandTotal: number }>;
      meta: { page: number; pageSize: number; total: number };
    };
    expect(body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      orderNumber: orderA2,
      itemCount: 2,
      grandTotal: 120000,
    });
    expect(body.data.map((order) => order.orderNumber)).not.toContain(orderB);
  });

  it('returns order detail using historical snapshots', async () => {
    await prisma.product.update({ where: { id: productId }, data: { name: 'Changed Later' } });
    const response = await request(app).get(`/api/v1/orders/${orderA1}`).set(bearer(tokenA));
    expect(response.status).toBe(200);
    const detail = dataOf<{
      orderNumber: string;
      shippingAddress: object;
      items: Array<{ productName: string; productSlug: string; variantName: string; sku: string }>;
    }>(response);
    expect(detail).toMatchObject({
      orderNumber: orderA1,
      orderStatus: 'PENDING_CONFIRMATION',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      shippingAddress: {
        recipientName: `Recipient ${orderA1}`,
        line1: '12 Nguyen Hue',
        deliveryNote: 'Call first',
      },
      subtotal: 120000,
      shippingFee: 0,
      discount: 0,
      grandTotal: 120000,
    });
    expect(detail.items[0]).toMatchObject({
      productName: `Snapshot ${orderA1}`,
      productSlug: `snapshot-${orderA1.toLowerCase()}`,
      variantName: 'Snapshot Paperback',
      sku: `SNAP_${orderA1}`.slice(0, 64),
    });
  });

  it('does not leak another customer order', async () => {
    const response = await request(app).get(`/api/v1/orders/${orderB}`).set(bearer(tokenA));
    expect(response.status).toBe(404);
    expect(errorCodeOf(response)).toBe('ORDER_NOT_FOUND');
    expect((await request(app).get(`/api/v1/orders/${orderA1}`).set(bearer(tokenB))).status).toBe(
      404,
    );
  });

  it('falls back to current relations for legacy order items without snapshots', async () => {
    const response = await request(app).get(`/api/v1/orders/${orderB}`).set(bearer(tokenB));
    expect(response.status).toBe(200);
    expect(
      dataOf<{ items: Array<{ productName: string; productSlug: string }> }>(response).items[0],
    ).toMatchObject({
      productName: 'Changed Later',
      productSlug: `orders-book-${suffix}`,
    });
  });

  it('does not crash order detail when author snapshot JSON is malformed', async () => {
    await prisma.orderItem.updateMany({
      where: { order: { orderNumber: orderA2 } },
      data: { authorNamesSnapshot: '{bad json' },
    });
    const response = await request(app).get(`/api/v1/orders/${orderA2}`).set(bearer(tokenA));
    expect(response.status).toBe(200);
    expect(
      dataOf<{ items: Array<{ authorNames: string[] | null }> }>(response).items[0],
    ).toMatchObject({ authorNames: null });
  });
});
