import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import { prisma } from '../src/database/prisma.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { createHealthService } from '../src/modules/health/health.service.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const password = 'Inventory12345';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'i'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'j'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'inventory@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  inventoryService: new InventoryService(prisma),
});

let adminId: bigint,
  staffId: bigint,
  customerId: bigint,
  productId: bigint,
  variantId: bigint,
  adminToken = '',
  staffToken = '',
  customerToken = '';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const errorOf = (response: request.Response) =>
  (JSON.parse(response.text) as { error: { code: string } }).error.code;

const adjust = (token: string, body: Record<string, unknown>) =>
  request(app).post('/api/v1/admin/inventory/adjustments').set(bearer(token)).send(body);

describe('M5E inventory adjustment integration', () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(password);
    const [admin, staff, customer] = await Promise.all([
      prisma.user.create({
        data: {
          username: `ia${suffix}`.slice(0, 20),
          fullName: 'Inventory Admin',
          email: `invadmin${suffix}@m5e.local`,
          phone: `+8490${suffix.slice(-7)}`,
          passwordHash,
          role: 'ADMIN',
        },
      }),
      prisma.user.create({
        data: {
          username: `is${suffix}`.slice(0, 20),
          fullName: 'Inventory Staff',
          email: `invstaff${suffix}@m5e.local`,
          phone: `+8491${suffix.slice(-7)}`,
          passwordHash,
          role: 'STAFF',
        },
      }),
      prisma.user.create({
        data: {
          username: `ic${suffix}`.slice(0, 20),
          fullName: 'Inventory Customer',
          email: `invcust${suffix}@m5e.local`,
          phone: `+8492${suffix.slice(-7)}`,
          passwordHash,
          role: 'CUSTOMER',
        },
      }),
    ]);
    adminId = admin.id;
    staffId = staff.id;
    customerId = customer.id;
    const product = await prisma.product.create({
      data: {
        name: `Inventory Book ${suffix}`,
        slug: `inventory-book-${suffix}`,
        isActive: true,
        variants: {
          create: {
            sku: `INV-${suffix}`,
            name: 'Paperback',
            costPrice: 50000,
            listPrice: 100000,
            salePrice: 90000,
            inventory: { create: { onHandQuantity: 10, reservedQuantity: 0 } },
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0]!.id;
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
    await prisma.inventoryLedger.deleteMany({ where: { inventoryId: variantId } });
    await prisma.inventory.deleteMany({ where: { productVariantId: variantId } });
    await prisma.productImage.deleteMany({
      where: { OR: [{ productId }, { productVariantId: variantId }] },
    });
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [adminId, staffId, customerId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorUserId: { in: [adminId, staffId, customerId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, staffId, customerId] } } });
  });

  it('records receive, increase, decrease, and correction adjustments in the immutable ledger', async () => {
    for (const [type, quantity] of [
      ['RECEIVE_STOCK', 5],
      ['MANUAL_INCREASE', 2],
      ['MANUAL_DECREASE', 3],
      ['CORRECTION', 1],
    ] as const) {
      const before = await prisma.inventory.findUniqueOrThrow({
        where: { productVariantId: variantId },
      });
      const response = await adjust(adminToken, {
        variantId: variantId.toString(),
        type,
        quantity,
        reason: `${type} QA reason`,
        expectedOnHandQuantity: before.onHandQuantity,
      });
      expect(response.status).toBe(201);
      const delta = type === 'MANUAL_DECREASE' ? -quantity : quantity;
      expect(
        dataOf<{ inventory: { onHandQuantity: number }; ledgerEntry: { quantityDelta: number } }>(
          response,
        ),
      ).toMatchObject({
        inventory: { onHandQuantity: before.onHandQuantity + delta },
        ledgerEntry: { quantityDelta: delta },
      });
    }
    expect(await prisma.inventoryLedger.count({ where: { inventoryId: variantId } })).toBe(4);
  });

  it('rejects invalid quantity and negative stock without ledger rows', async () => {
    const before = await prisma.inventory.findUniqueOrThrow({
      where: { productVariantId: variantId },
    });
    expect(
      (
        await adjust(adminToken, {
          variantId: variantId.toString(),
          type: 'MANUAL_INCREASE',
          quantity: 0,
          reason: 'bad',
        })
      ).status,
    ).toBe(400);
    const count = await prisma.inventoryLedger.count({ where: { inventoryId: variantId } });
    const response = await adjust(adminToken, {
      variantId: variantId.toString(),
      type: 'MANUAL_DECREASE',
      quantity: before.onHandQuantity + 100,
      reason: 'Too much',
      expectedOnHandQuantity: before.onHandQuantity,
    });
    expect(response.status).toBe(400);
    expect(errorOf(response)).toBe('INVENTORY_NEGATIVE_STOCK');
    expect(await prisma.inventoryLedger.count({ where: { inventoryId: variantId } })).toBe(count);
  });

  it('protects concurrent stale adjustments with a stable conflict', async () => {
    const before = await prisma.inventory.findUniqueOrThrow({
      where: { productVariantId: variantId },
    });
    const responses = await Promise.all([
      adjust(adminToken, {
        variantId: variantId.toString(),
        type: 'MANUAL_INCREASE',
        quantity: 1,
        reason: 'A',
        expectedOnHandQuantity: before.onHandQuantity,
      }),
      adjust(adminToken, {
        variantId: variantId.toString(),
        type: 'MANUAL_INCREASE',
        quantity: 1,
        reason: 'B',
        expectedOnHandQuantity: before.onHandQuantity,
      }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(
      responses.some(
        (response) =>
          response.status === 409 && errorOf(response) === 'INVENTORY_ADJUSTMENT_CONFLICT',
      ),
    ).toBe(true);
  });

  it('enforces RBAC for adjustments while allowing Staff read-only inventory history', async () => {
    expect(
      (
        await request(app)
          .get(`/api/v1/admin/inventory/variants/${variantId}`)
          .set(bearer(staffToken))
      ).status,
    ).toBe(200);
    expect(
      (
        await adjust(staffToken, {
          variantId: variantId.toString(),
          type: 'MANUAL_INCREASE',
          quantity: 1,
          reason: 'Staff attempt',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await adjust(customerToken, {
          variantId: variantId.toString(),
          type: 'MANUAL_INCREASE',
          quantity: 1,
          reason: 'Customer attempt',
        })
      ).status,
    ).toBe(403);
    expect((await request(app).post('/api/v1/admin/inventory/adjustments').send({})).status).toBe(
      401,
    );
  });
});
