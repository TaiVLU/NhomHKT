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
const password = 'AdminOrders12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'm'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'n'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'admin-orders@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  ordersService: new OrdersService(prisma),
});

let adminId: bigint,
  staffId: bigint,
  customerId: bigint,
  otherCustomerId: bigint,
  addressId: bigint,
  otherAddressId: bigint,
  productId: bigint,
  variantId: bigint,
  imageId: bigint,
  adminToken = '',
  staffToken = '',
  customerToken = '',
  orderNewest = '',
  orderOldest = '',
  orderOther = '';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const bodyOf = <T>(response: request.Response) => JSON.parse(response.text) as T;

const createUser = async (role: 'ADMIN' | 'STAFF' | 'CUSTOMER', label: string) =>
  prisma.user.create({
    data: {
      username: `${label}${suffix}`.slice(0, 15),
      fullName: `${role} ${label}`,
      email: `${label}${suffix}@admin-orders.local`,
      phone: `+846${label === 'admin' ? '0' : label === 'staff' ? '1' : label === 'cust' ? '2' : '3'}${suffix.slice(-8)}`,
      passwordHash: await hashPassword(password),
      role,
    },
  });

const login = async (path: string, payload: object) =>
  dataOf<{ accessToken: string }>(await request(app).post(path).send(payload)).accessToken;

const createOrder = async ({
  customer,
  address,
  orderNumber,
  recipientName,
  phone,
  status,
  paymentStatus,
  grandTotal,
  quantity,
  createdAt,
}: {
  customer: bigint;
  address: bigint;
  orderNumber: string;
  recipientName: string;
  phone: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  quantity: number;
  createdAt: Date;
}) =>
  prisma.order.create({
    data: {
      orderNumber,
      customerId: customer,
      shippingAddressId: address,
      status,
      paymentMethod: 'COD',
      paymentStatus,
      shippingRecipientName: recipientName,
      shippingPhone: phone,
      shippingLine1: 'Original snapshot line',
      shippingWard: 'Snapshot Ward',
      shippingDistrict: 'Snapshot District',
      shippingProvince: 'TP. Ho Chi Minh',
      shippingPostalCode: '700000',
      deliveryNote: 'Leave at reception',
      subtotal: grandTotal,
      shippingFee: 0,
      discount: 0,
      total: grandTotal,
      grandTotal,
      createdAt,
      items: {
        create: {
          variantId,
          quantity,
          unitPrice: grandTotal / quantity,
        },
      },
    },
  });

describe('M5E admin orders integration', () => {
  beforeAll(async () => {
    const [admin, staff, customer, otherCustomer] = await Promise.all([
      createUser('ADMIN', 'admin'),
      createUser('STAFF', 'staff'),
      createUser('CUSTOMER', 'cust'),
      createUser('CUSTOMER', 'other'),
    ]);
    adminId = admin.id;
    staffId = staff.id;
    customerId = customer.id;
    otherCustomerId = otherCustomer.id;
    const [address, otherAddress] = await Promise.all([
      prisma.address.create({
        data: {
          userId: customerId,
          recipientName: 'Original Current Name',
          phone: '+84901234567',
          line1: 'Current Line',
          ward: 'Current Ward',
          district: 'Current District',
          province: 'Current Province',
        },
      }),
      prisma.address.create({
        data: {
          userId: otherCustomerId,
          recipientName: 'Other Name',
          phone: '+84901234568',
          line1: 'Other Line',
          ward: 'Other Ward',
          district: 'Other District',
          province: 'Other Province',
        },
      }),
    ]);
    addressId = address.id;
    otherAddressId = otherAddress.id;
    const product = await prisma.product.create({
      data: {
        name: `Admin Order Book ${suffix}`,
        slug: `admin-order-book-${suffix}`,
        isActive: true,
        variants: {
          create: {
            sku: `ADMIN_ORDER_${suffix}`,
            name: 'Paperback',
            costPrice: 50000,
            listPrice: 100000,
            salePrice: 90000,
            isActive: true,
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0]!.id;
    const image = await prisma.productImage.create({
      data: {
        productId,
        url: 'https://example.test/admin-order-book.jpg',
        publicId: `admin-order-book-${suffix}`,
        mimeType: 'image/jpeg',
        sizeBytes: 1234,
        altText: 'Admin order book cover',
        isPrimary: true,
      },
    });
    imageId = image.id;
    orderOldest = `RSAO${suffix}01`;
    orderNewest = `RSAO${suffix}02`;
    orderOther = `RSBO${suffix}03`;
    await createOrder({
      customer: customerId,
      address: addressId,
      orderNumber: orderOldest,
      recipientName: 'Nguyen Snapshot',
      phone: '+84901111111',
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'UNPAID',
      grandTotal: 120000,
      quantity: 2,
      createdAt: new Date('2026-07-18T10:00:00.000Z'),
    });
    await createOrder({
      customer: customerId,
      address: addressId,
      orderNumber: orderNewest,
      recipientName: 'Tran Filter',
      phone: '+84902222222',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      grandTotal: 300000,
      quantity: 3,
      createdAt: new Date('2026-07-19T10:00:00.000Z'),
    });
    await createOrder({
      customer: otherCustomerId,
      address: otherAddressId,
      orderNumber: orderOther,
      recipientName: 'Other Recipient',
      phone: '+84903333333',
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'UNPAID',
      grandTotal: 90000,
      quantity: 1,
      createdAt: new Date('2026-07-19T12:00:00.000Z'),
    });
    await prisma.address.update({
      where: { id: addressId },
      data: { line1: 'Changed Current Line' },
    });
    adminToken = await login('/api/v1/auth/admin/login', { username: admin.username, password });
    staffToken = await login('/api/v1/auth/admin/login', { username: staff.username, password });
    customerToken = await login('/api/v1/auth/login', { email: customer.email, password });
  }, 30000);

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { variantId } });
    await prisma.orderStatusHistory.deleteMany({
      where: { order: { orderNumber: { in: [orderOldest, orderNewest, orderOther] } } },
    });
    await prisma.order.deleteMany({
      where: { orderNumber: { in: [orderOldest, orderNewest, orderOther] } },
    });
    await prisma.productImage.deleteMany({ where: { id: imageId } });
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.address.deleteMany({ where: { id: { in: [addressId, otherAddressId] } } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [adminId, staffId, customerId, otherCustomerId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorUserId: { in: [adminId, staffId, customerId, otherCustomerId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, staffId, customerId, otherCustomerId] } },
    });
  });

  it('allows admin and ORDER_READ staff to list all orders', async () => {
    const adminResponse = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(adminToken))
      .query({ search: suffix });
    const staffResponse = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(staffToken))
      .query({ search: suffix });
    expect(adminResponse.status).toBe(200);
    expect(staffResponse.status).toBe(200);
    expect(
      dataOf<Array<{ orderNumber: string }>>(adminResponse).map((order) => order.orderNumber),
    ).toEqual(expect.arrayContaining([orderNewest, orderOldest, orderOther]));
  });

  it('rejects customers and unauthenticated requests', async () => {
    expect((await request(app).get('/api/v1/admin/orders').set(bearer(customerToken))).status).toBe(
      403,
    );
    expect((await request(app).get('/api/v1/admin/orders')).status).toBe(401);
  });

  it('paginates and sorts newest first by default', async () => {
    const response = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(adminToken))
      .query({ page: 1, pageSize: 2, search: suffix });
    expect(response.status).toBe(200);
    const body = bodyOf<{
      data: Array<{ orderNumber: string; itemCount: number; grandTotal: number }>;
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(response);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(2);
    expect(body.data[0]?.orderNumber).toBe(orderOther);
    expect(body.data[1]?.orderNumber).toBe(orderNewest);
    expect(body.data[1]).toMatchObject({ itemCount: 3, grandTotal: 300000 });
  });

  it('searches by order number, recipient, phone, and customer email', async () => {
    for (const search of [
      orderNewest,
      'Tran Filter',
      '+84902222222',
      `cust${suffix}@admin-orders.local`,
    ]) {
      const response = await request(app)
        .get('/api/v1/admin/orders')
        .set(bearer(adminToken))
        .query({ search });
      expect(response.status).toBe(200);
      expect(
        dataOf<Array<{ orderNumber: string }>>(response).map((order) => order.orderNumber),
      ).toContain(orderNewest);
    }
  });

  it('filters by status, payment, date, and combined filters', async () => {
    const confirmed = await request(app).get('/api/v1/admin/orders').set(bearer(adminToken)).query({
      search: suffix,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
    });
    expect(
      dataOf<Array<{ orderNumber: string }>>(confirmed).map((order) => order.orderNumber),
    ).toEqual([orderNewest]);

    const dateFiltered = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(adminToken))
      .query({ search: suffix, dateFrom: '2026-07-18', dateTo: '2026-07-18' });
    expect(
      dataOf<Array<{ orderNumber: string }>>(dateFiltered).map((order) => order.orderNumber),
    ).toEqual([orderOldest]);
  });

  it('sorts by oldest and total', async () => {
    const oldest = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(adminToken))
      .query({ search: suffix, sort: 'oldest' });
    expect(dataOf<Array<{ orderNumber: string }>>(oldest)[0]?.orderNumber).toBe(orderOldest);
    const totalDesc = await request(app)
      .get('/api/v1/admin/orders')
      .set(bearer(adminToken))
      .query({ search: suffix, sort: 'totalDesc' });
    expect(dataOf<Array<{ orderNumber: string }>>(totalDesc)[0]?.orderNumber).toBe(orderNewest);
  });

  it('allows admin and staff to open detail with snapshots and no sensitive fields', async () => {
    const response = await request(app)
      .get(`/api/v1/admin/orders/${orderOldest}`)
      .set(bearer(adminToken));
    const staffResponse = await request(app)
      .get(`/api/v1/admin/orders/${orderOldest}`)
      .set(bearer(staffToken));
    expect(response.status).toBe(200);
    expect(staffResponse.status).toBe(200);
    const detail = dataOf<{
      customer: { email: string; passwordHash?: string };
      shippingAddress: { line1: string; deliveryNote: string };
      items: Array<{
        unitPrice: number;
        lineTotal: number;
        image: { url: string } | null;
        costPrice?: number;
      }>;
      subtotal: number;
      grandTotal: number;
    }>(response);
    expect(detail.shippingAddress.line1).toBe('Original snapshot line');
    expect(detail.items[0]).toMatchObject({
      unitPrice: 60000,
      lineTotal: 120000,
      image: { url: 'https://example.test/admin-order-book.jpg' },
    });
    expect(detail.subtotal).toBe(120000);
    expect(detail.grandTotal).toBe(120000);
    expect(detail.customer.passwordHash).toBeUndefined();
    expect(detail.items[0]?.costPrice).toBeUndefined();
  });

  it('returns safe 404 for unknown admin order detail', async () => {
    const response = await request(app)
      .get('/api/v1/admin/orders/RS_UNKNOWN')
      .set(bearer(adminToken));
    expect(response.status).toBe(404);
    expect(bodyOf<{ error: { code: string } }>(response).error.code).toBe('ORDER_NOT_FOUND');
  });
});
