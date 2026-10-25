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
const password = 'OrderFlow12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'o'.repeat(32),
  JWT_ISSUER: 'rosach-api',
  JWT_AUDIENCE: 'rosach-web',
  OTP_PEPPER: 'p'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'order-flow@test.local',
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
  addressId: bigint,
  productId: bigint,
  variantId: bigint,
  secondVariantId: bigint,
  adminToken = '',
  staffToken = '',
  customerToken = '';
const orderNumbers: string[] = [];

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const errorOf = (response: request.Response) =>
  (JSON.parse(response.text) as { error: { code: string } }).error.code;

const createUser = async (role: 'ADMIN' | 'STAFF' | 'CUSTOMER', label: string) =>
  prisma.user.create({
    data: {
      username: `${label}${suffix.slice(-6)}`.slice(0, 15),
      fullName: `${role} Flow ${label}`,
      email: `${label}${suffix}@order-flow.local`,
      phone: `+848${role === 'ADMIN' ? '0' : role === 'STAFF' ? '1' : '2'}${suffix.slice(-8)}`,
      passwordHash: await hashPassword(password),
      role,
    },
  });

const transition = (
  orderNumber: string,
  targetStatus: string,
  note?: string,
  token = adminToken,
  expectedCurrentStatus?: string,
) =>
  request(app)
    .post(`/api/v1/admin/orders/${orderNumber}/transitions`)
    .set(bearer(token))
    .send({
      targetStatus,
      ...(expectedCurrentStatus ? { expectedCurrentStatus } : {}),
      ...(note ? { note } : {}),
    });

let orderCounter = 0;
const createOrder = async (
  status = 'PENDING_CONFIRMATION',
  items: Array<{ variantId: bigint; quantity: number; unitPrice: number }> = [
    { variantId, quantity: 2, unitPrice: 60000 },
  ],
) => {
  orderCounter += 1;
  const orderNumber = `M5EF${suffix.slice(-10)}${String(orderCounter).padStart(3, '0')}`;
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      shippingAddressId: addressId,
      status,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      shippingRecipientName: 'Flow Recipient',
      shippingPhone: '+84901234567',
      shippingLine1: 'Snapshot Line',
      shippingWard: 'Snapshot Ward',
      shippingDistrict: 'Snapshot District',
      shippingProvince: 'TP. Ho Chi Minh',
      subtotal: total,
      shippingFee: 0,
      discount: 0,
      total,
      grandTotal: total,
      items: {
        create: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      statusHistory: {
        create: { fromStatus: null, toStatus: status, note: 'Order created' },
      },
    },
  });
  orderNumbers.push(orderNumber);
  return order;
};

describe('M5E order processing workflow integration', () => {
  beforeAll(async () => {
    const leftovers = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: '@order-flow.local' } }, { username: { startsWith: 'flow' } }],
      },
      select: { id: true },
    });
    const leftoverUserIds = leftovers.map((user) => user.id);
    if (leftoverUserIds.length) {
      await prisma.address.deleteMany({ where: { userId: { in: leftoverUserIds } } });
      await prisma.refreshToken.deleteMany({ where: { userId: { in: leftoverUserIds } } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: leftoverUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: leftoverUserIds } } });
    }
    const admin = await createUser('ADMIN', 'flowadmin');
    const staff = await createUser('STAFF', 'flowstaff');
    const customer = await createUser('CUSTOMER', 'flowcust');
    adminId = admin.id;
    staffId = staff.id;
    customerId = customer.id;
    const address = await prisma.address.create({
      data: {
        userId: customerId,
        recipientName: 'Flow Recipient',
        phone: '+84901234567',
        line1: 'Flow Line',
        ward: 'Flow Ward',
        district: 'Flow District',
        province: 'TP. Ho Chi Minh',
      },
    });
    addressId = address.id;
    const product = await prisma.product.create({
      data: {
        name: `Order Flow Book ${suffix}`,
        slug: `order-flow-book-${suffix}`,
        isActive: true,
        variants: {
          create: [
            {
              sku: `FLOW_A_${suffix}`,
              name: 'Paperback',
              costPrice: 30000,
              listPrice: 60000,
              salePrice: 60000,
              isActive: true,
              inventory: { create: { onHandQuantity: 100, reservedQuantity: 0 } },
            },
            {
              sku: `FLOW_B_${suffix}`,
              name: 'Hardcover',
              costPrice: 40000,
              listPrice: 80000,
              salePrice: 80000,
              isActive: true,
              inventory: { create: { onHandQuantity: 100, reservedQuantity: 0 } },
            },
          ],
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0]!.id;
    secondVariantId = product.variants[1]!.id;
    adminToken = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: admin.username, password }),
    ).accessToken;
    staffToken = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: staff.username, password }),
    ).accessToken;
    customerToken = dataOf<{ accessToken: string }>(
      await request(app).post('/api/v1/auth/login').send({ email: customer.email, password }),
    ).accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { order: { orderNumber: { in: orderNumbers } } } });
    await prisma.orderStatusHistory.deleteMany({
      where: { order: { orderNumber: { in: orderNumbers } } },
    });
    await prisma.order.deleteMany({ where: { orderNumber: { in: orderNumbers } } });
    const variantIds = [variantId, secondVariantId].filter((id): id is bigint => Boolean(id));
    const userIds = [adminId, staffId, customerId].filter((id): id is bigint => Boolean(id));
    if (variantIds.length) {
      await prisma.inventoryLedger.deleteMany({ where: { inventoryId: { in: variantIds } } });
      await prisma.inventory.deleteMany({ where: { productVariantId: { in: variantIds } } });
      await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
    }
    if (productId) await prisma.product.deleteMany({ where: { id: productId } });
    if (addressId) await prisma.address.deleteMany({ where: { id: addressId } });
    if (userIds.length) {
      await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  it('enforces every allowed forward transition and COD completion payment policy', async () => {
    const order = await createOrder();
    expect((await transition(order.orderNumber, 'CONFIRMED', 'Confirmed')).status).toBe(200);
    expect((await transition(order.orderNumber, 'PACKING', 'Packing')).status).toBe(200);
    expect((await transition(order.orderNumber, 'SHIPPING', 'Shipping')).status).toBe(200);
    const completed = await transition(order.orderNumber, 'COMPLETED', 'Delivered');
    expect(completed.status).toBe(200);
    expect(dataOf<{ orderStatus: string; paymentStatus: string }>(completed)).toMatchObject({
      orderStatus: 'COMPLETED',
      paymentStatus: 'PAID',
    });
    expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id } })).toBe(5);
  });

  it('rejects invalid, terminal, and same-state transitions without history rows', async () => {
    const invalidTransitions: Array<[string, string]> = [
      ['PENDING_CONFIRMATION', 'PACKING'],
      ['PENDING_CONFIRMATION', 'COMPLETED'],
      ['CONFIRMED', 'SHIPPING'],
      ['PACKING', 'COMPLETED'],
      ['SHIPPING', 'CANCELLED'],
      ['COMPLETED', 'CONFIRMED'],
      ['CANCELLED', 'CONFIRMED'],
      ['CONFIRMED', 'CONFIRMED'],
    ];
    for (const [from, to] of invalidTransitions) {
      const order = await createOrder(from);
      const before = await prisma.orderStatusHistory.count({ where: { orderId: order.id } });
      const response = await transition(
        order.orderNumber,
        to,
        to === 'CANCELLED' ? 'Reason' : 'Note',
      );
      expect(response.status).toBe(400);
      expect(errorOf(response)).toBe('ORDER_TRANSITION_INVALID');
      expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id } })).toBe(before);
    }
  });

  it('enforces transition permissions', async () => {
    const order = await createOrder();
    expect((await transition(order.orderNumber, 'CONFIRMED', 'Confirmed')).status).toBe(200);
    expect((await transition(order.orderNumber, 'PACKING', 'Packing', staffToken)).status).toBe(
      403,
    );
    expect((await transition(order.orderNumber, 'PACKING', 'Packing', customerToken)).status).toBe(
      403,
    );
    expect(
      (
        await request(app)
          .post(`/api/v1/admin/orders/${order.orderNumber}/transitions`)
          .send({ targetStatus: 'PACKING', note: 'Packing' })
      ).status,
    ).toBe(401);
  });

  it('returns admin and customer timelines with safe actor visibility', async () => {
    const order = await createOrder();
    await transition(order.orderNumber, 'CONFIRMED', 'Admin note');
    const adminDetail = await request(app)
      .get(`/api/v1/admin/orders/${order.orderNumber}`)
      .set(bearer(adminToken));
    const customerDetail = await request(app)
      .get(`/api/v1/orders/${order.orderNumber}`)
      .set(bearer(customerToken));
    expect(
      dataOf<{ statusHistory: Array<{ actorEmail: string | null; note: string | null }> }>(
        adminDetail,
      ).statusHistory.at(-1),
    ).toMatchObject({
      actorEmail: `flowadmin${suffix}@order-flow.local`,
      note: 'Admin note',
    });
    const customerHistory = dataOf<{
      statusHistory: Array<{
        status: string;
        createdAt: string;
        actorEmail?: string;
        note?: string;
      }>;
    }>(customerDetail).statusHistory.at(-1);
    expect(customerHistory?.status).toBe('CONFIRMED');
    expect(typeof customerHistory?.createdAt).toBe('string');
    expect(customerHistory?.actorEmail).toBeUndefined();
    expect(customerHistory?.note).toBeUndefined();
  });

  it('restores inventory exactly once for eligible cancellations including multi-item orders', async () => {
    const order = await createOrder('PACKING', [
      { variantId, quantity: 2, unitPrice: 60000 },
      { variantId: secondVariantId, quantity: 3, unitPrice: 80000 },
    ]);
    const beforeA = (
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } })
    ).onHandQuantity;
    const beforeB = (
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: secondVariantId } })
    ).onHandQuantity;
    const cancelled = await transition(
      order.orderNumber,
      'CANCELLED',
      'Customer requested cancellation',
    );
    expect(cancelled.status).toBe(200);
    expect(
      (await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }))
        .onHandQuantity,
    ).toBe(beforeA + 2);
    expect(
      (await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: secondVariantId } }))
        .onHandQuantity,
    ).toBe(beforeB + 3);
    const ledgerRows = await prisma.inventoryLedger.findMany({
      where: {
        inventoryId: { in: [variantId, secondVariantId] },
        adjustmentType: 'ORDER_CANCELLATION_RESTORE',
      },
      orderBy: { inventoryId: 'asc' },
    });
    expect(ledgerRows).toHaveLength(2);
    expect(ledgerRows.map((entry) => entry.quantityDelta).sort((a, b) => a - b)).toEqual([2, 3]);
    expect(ledgerRows.every((entry) => entry.reason.includes(order.orderNumber))).toBe(true);
    const repeated = await transition(order.orderNumber, 'CONFIRMED', 'Try again');
    expect(repeated.status).toBe(400);
    expect(
      (await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } }))
        .onHandQuantity,
    ).toBe(beforeA + 2);
    expect(
      await prisma.inventoryLedger.count({
        where: { inventoryId: variantId, adjustmentType: 'ORDER_CANCELLATION_RESTORE' },
      }),
    ).toBe(1);
  });

  it('requires cancellation reason and rolls back when restoration fails', async () => {
    const noReason = await createOrder();
    expect((await transition(noReason.orderNumber, 'CANCELLED')).status).toBe(400);

    const missingInventory = await createOrder();
    await prisma.inventoryLedger.deleteMany({ where: { inventoryId: variantId } });
    await prisma.inventory.delete({ where: { productVariantId: variantId } });
    const response = await transition(missingInventory.orderNumber, 'CANCELLED', 'Valid reason');
    expect(response.status).toBe(409);
    expect(errorOf(response)).toBe('ORDER_INVENTORY_RESTORE_FAILED');
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: missingInventory.id } })).status,
    ).toBe('PENDING_CONFIRMATION');
    expect(await prisma.orderStatusHistory.count({ where: { orderId: missingInventory.id } })).toBe(
      1,
    );
    expect(
      await prisma.inventoryLedger.count({
        where: {
          adjustmentType: 'ORDER_CANCELLATION_RESTORE',
          reason: { contains: missingInventory.orderNumber },
        },
      }),
    ).toBe(0);
    await prisma.inventory.create({
      data: { productVariantId: variantId, onHandQuantity: 100, reservedQuantity: 0 },
    });
  });

  it('protects concurrent transitions with a stable conflict and restores cancellation stock at most once', async () => {
    const order = await createOrder();
    const before = (
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } })
    ).onHandQuantity;
    const responses = await Promise.all([
      transition(order.orderNumber, 'CONFIRMED', 'Admin A', adminToken, 'PENDING_CONFIRMATION'),
      transition(
        order.orderNumber,
        'CANCELLED',
        'Admin B cancel',
        adminToken,
        'PENDING_CONFIRMATION',
      ),
    ]);
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 409]);
    expect(
      responses.some(
        (response) => response.status === 409 && errorOf(response) === 'ORDER_STATUS_CONFLICT',
      ),
    ).toBe(true);
    const current = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    const after = (
      await prisma.inventory.findUniqueOrThrow({ where: { productVariantId: variantId } })
    ).onHandQuantity;
    const ledgerCount = await prisma.inventoryLedger.count({
      where: {
        inventoryId: variantId,
        adjustmentType: 'ORDER_CANCELLATION_RESTORE',
        reason: { contains: order.orderNumber },
      },
    });
    expect(['CONFIRMED', 'CANCELLED']).toContain(current.status);
    expect(after === before || after === before + 2).toBe(true);
    expect(ledgerCount === 0 || ledgerCount === 1).toBe(true);
    expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id } })).toBe(2);
  });
});
