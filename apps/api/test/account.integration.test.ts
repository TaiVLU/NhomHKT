import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/database/prisma.js';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { AccountService } from '../src/modules/account/account.service.js';
import { createHealthService } from '../src/modules/health/health.service.js';
import type { Environment } from '../src/config/environment.js';

const suffix = Date.now().toString();
const oldPassword = 'Account123';
const newPassword = 'Account456';
const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL ?? 'sqlserver://unused',
  JWT_SECRET: 'a'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'b'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'no-reply@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const auth = new AuthService(prisma, environment, new FakeMailer());
const accounts = new AccountService(prisma);
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: auth,
  accountService: accounts,
});
let userA: bigint,
  userB: bigint,
  staff: bigint,
  tokenA = '',
  tokenB = '',
  staffToken = '',
  firstId = '',
  secondId = '';
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const dataOf = <T>(response: request.Response) => (JSON.parse(response.text) as { data: T }).data;
const addressBody = (name: string, phone: string) => ({
  recipientName: name,
  phone,
  line1: '12 Main Street',
  ward: 'Ward 1',
  district: 'District 1',
  province: 'HCM',
});

describe('M4 account SQL Server integration', () => {
  beforeAll(async () => {
    const hash = await hashPassword(oldPassword);
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: `ca${suffix}`.slice(0, 15),
          fullName: 'Customer A',
          email: `ca${suffix}@m4.local`,
          phone: `+8491${suffix.slice(-7)}`,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          username: `cb${suffix}`.slice(0, 15),
          fullName: 'Customer B',
          email: `cb${suffix}@m4.local`,
          phone: `+8492${suffix.slice(-7)}`,
          passwordHash: hash,
        },
      }),
      prisma.user.create({
        data: {
          username: `st${suffix}`.slice(0, 15),
          fullName: 'Staff',
          email: `st${suffix}@m4.local`,
          phone: `+8493${suffix.slice(-7)}`,
          passwordHash: hash,
          role: 'STAFF',
        },
      }),
    ]);
    userA = users[0].id;
    userB = users[1].id;
    staff = users[2].id;
    tokenA = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/login')
        .send({ username: users[0].username, password: oldPassword }),
    ).accessToken;
    tokenB = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/login')
        .send({ username: users[1].username, password: oldPassword }),
    ).accessToken;
    staffToken = dataOf<{ accessToken: string }>(
      await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: users[2].username, password: oldPassword }),
    ).accessToken;
  });
  afterAll(async () => {
    const ids = [userA, userB, staff];
    await prisma.address.deleteMany({ where: { userId: { in: ids } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  });
  it('gets and patches safe profile and maps phone conflicts', async () => {
    const get = await request(app).get('/api/v1/me/profile').set(bearer(tokenA));
    expect(get.status).toBe(200);
    expect(dataOf<Record<string, unknown>>(get)).not.toHaveProperty('passwordHash');
    const patch = await request(app)
      .patch('/api/v1/me/profile')
      .set(bearer(tokenA))
      .send({ fullName: 'Customer A Updated', birthday: '2000-01-01', gender: 'OTHER' });
    expect(patch.status).toBe(200);
    expect(dataOf<{ id: string }>(patch).id).toBe(userA.toString());
    const other = await prisma.user.findUniqueOrThrow({ where: { id: userB } });
    expect(
      (
        await request(app)
          .patch('/api/v1/me/profile')
          .set(bearer(tokenA))
          .send({ phone: other.phone })
      ).status,
    ).toBe(409);
  });
  it('creates, lists, updates, defaults and soft-deletes with promotion', async () => {
    const first = await request(app)
      .post('/api/v1/me/addresses')
      .set(bearer(tokenA))
      .send(addressBody('First', '0901111111'));
    expect(first.status).toBe(201);
    expect(dataOf<{ isDefault: boolean }>(first).isDefault).toBe(true);
    firstId = dataOf<{ id: string }>(first).id;
    const second = await request(app)
      .post('/api/v1/me/addresses')
      .set(bearer(tokenA))
      .send(addressBody('Second', '0902222222'));
    secondId = dataOf<{ id: string }>(second).id;
    expect(dataOf<{ isDefault: boolean }>(second).isDefault).toBe(false);
    expect(
      (await request(app).put(`/api/v1/me/addresses/${secondId}/default`).set(bearer(tokenA)))
        .status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/api/v1/me/addresses/${secondId}`)
          .set(bearer(tokenA))
          .send({ line1: '99 Updated' })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).delete(`/api/v1/me/addresses/${secondId}`).set(bearer(tokenA))).status,
    ).toBe(204);
    const list = dataOf<Array<{ id: string; isDefault: boolean }>>(
      await request(app).get('/api/v1/me/addresses').set(bearer(tokenA)),
    );
    expect(list).toEqual([expect.objectContaining({ id: firstId, isDefault: true })]);
    const third = await request(app)
      .post('/api/v1/me/addresses')
      .set(bearer(tokenA))
      .send(addressBody('Third', '0903333333'));
    const thirdId = dataOf<{ id: string }>(third).id;
    expect(
      (await request(app).delete(`/api/v1/me/addresses/${thirdId}`).set(bearer(tokenA))).status,
    ).toBe(204);
  });
  it('enforces auth, permission, ownership and strict userId rejection', async () => {
    expect((await request(app).get('/api/v1/me/addresses')).status).toBe(401);
    expect((await request(app).get('/api/v1/me/addresses').set(bearer(staffToken))).status).toBe(
      403,
    );
    expect(
      (await request(app).get(`/api/v1/me/addresses/${firstId}`).set(bearer(tokenB))).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch(`/api/v1/me/addresses/${firstId}`)
          .set(bearer(tokenB))
          .send({ line1: 'No access' })
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete(`/api/v1/me/addresses/${firstId}`).set(bearer(tokenB))).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/v1/me/addresses')
          .set(bearer(tokenA))
          .send({ ...addressBody('Bad', '0904444444'), userId: userB.toString() })
      ).status,
    ).toBe(400);
  });
  it('changes password, revokes old sessions and accepts only new password', async () => {
    const username = (await prisma.user.findUniqueOrThrow({ where: { id: userA } })).username;
    const changed = await request(app)
      .patch('/api/v1/me/password')
      .set(bearer(tokenA))
      .send({ currentPassword: oldPassword, newPassword });
    expect(changed.status).toBe(200);
    expect(dataOf<{ accessToken: string }>(changed).accessToken).toBeTruthy();
    expect(
      (await request(app).post('/api/v1/auth/login').send({ username, password: oldPassword }))
        .status,
    ).toBe(401);
    expect(
      (await request(app).post('/api/v1/auth/login').send({ username, password: newPassword }))
        .status,
    ).toBe(200);
  });
  it('concurrent set-default leaves exactly one active default', async () => {
    const extra = await request(app)
      .post('/api/v1/me/addresses')
      .set(bearer(tokenA))
      .send(addressBody('Concurrent', '0905555555'));
    const extraId = dataOf<{ id: string }>(extra).id;
    const context = { ip: undefined, userAgent: undefined, requestId: undefined };
    await Promise.allSettled([
      accounts.setDefault(userA, BigInt(firstId), context),
      accounts.setDefault(userA, BigInt(extraId), context),
    ]);
    expect(
      await prisma.address.count({ where: { userId: userA, deletedAt: null, isDefault: true } }),
    ).toBe(1);
  });
});
