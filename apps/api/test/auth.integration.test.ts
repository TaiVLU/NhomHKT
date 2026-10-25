import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import { prisma } from '../src/database/prisma.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { hashPassword } from '../src/modules/auth/auth.crypto.js';
import { runInitialAdminSeed } from '../src/modules/auth/auth-seed.service.js';
import { FakeMailer } from '../src/modules/auth/mailer.js';
import { createHealthService } from '../src/modules/health/health.service.js';

const suffix = `${Date.now()}`.slice(-8);
const username = `m2u${suffix}`.slice(0, 15);
const email = `${username}@example.com`;
const lockedEmail = `locked-${username}@example.com`;
const environment: Environment = {
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
  SMTP_FROM: 'no-reply@hktstore.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const mailer = new FakeMailer();
const service = new AuthService(prisma, environment, mailer);
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService: service,
});
const originHeaders = { Origin: environment.WEB_ORIGIN, 'X-HKTStore-Client': 'web' };
const authResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    user: z.object({ id: z.string(), email: z.string(), phone: z.string(), role: z.string() }),
  }),
});
const resetResponseSchema = z.object({ data: z.object({ resetToken: z.string() }) });

describe('Auth SQL Server integration', () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
  afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: { in: [email, lockedEmail] } } });
    for (const user of users) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetOtp.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { actorUserId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
  it('registers, returns string ID, and rejects role injection', async () => {
    const payload = {
      fullName: 'M2 Test User',
      email,
      phone: `090${suffix.slice(0, 7)}`,
      password: 'HKTStore123',
    };
    const response = await request(app).post('/api/v1/auth/register').send(payload);
    expect(response.status).toBe(201);
    expect(authResponseSchema.parse(JSON.parse(response.text) as unknown).data.user.id).toMatch(
      /^\d+$/,
    );
    expect(authResponseSchema.parse(JSON.parse(response.text) as unknown).data.user).toMatchObject({
      email,
      role: 'CUSTOMER',
    });
    expect(response.headers['set-cookie']?.[0]).toContain('hktstore_refresh_token=');
    expect(
      (
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            ...payload,
            email: `role-${email}`,
            phone: `091${suffix.slice(0, 7)}`,
            role: 'ADMIN',
          })
      ).status,
    ).toBe(400);
  });
  it('blocks refresh without CSRF headers and rotates only once', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'HKTStore123' });
    const accessToken = authResponseSchema.parse(JSON.parse(login.text) as unknown).data
      .accessToken;
    expect(
      (await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${accessToken}`))
        .status,
    ).toBe(200);
    expect((await request(app).get('/api/v1/auth/session')).status).toBe(401);
    expect(
      (await request(app).get('/api/v1/diagnostics').set('Authorization', `Bearer ${accessToken}`))
        .status,
    ).toBe(403);
    const cookie = login.headers['set-cookie']?.[0]?.split(';')[0];
    expect(cookie).toBeTruthy();
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .set('Cookie', cookie ?? '')
      ).status,
    ).toBe(403);
    const [first, second] = await Promise.all([
      request(app)
        .post('/api/v1/auth/refresh')
        .set(originHeaders)
        .set('Cookie', cookie ?? ''),
      request(app)
        .post('/api/v1/auth/refresh')
        .set(originHeaders)
        .set('Cookie', cookie ?? ''),
    ]);
    expect([first.status, second.status].filter((status) => status === 200)).toHaveLength(1);
    expect([first.status, second.status].filter((status) => status === 401)).toHaveLength(1);
  }, 15_000);
  it('supports OTP single-use and reset without auto-login', async () => {
    expect((await request(app).post('/api/v1/auth/forgot-password').send({ email })).status).toBe(
      200,
    );
    const otp = mailer.deliveries.at(-1)?.otp;
    expect(otp).toMatch(/^\d{6}$/);
    const verified = await request(app).post('/api/v1/auth/verify-otp').send({ email, otp });
    expect(verified.status).toBe(200);
    const resetToken = resetResponseSchema.parse(JSON.parse(verified.text) as unknown).data
      .resetToken;
    expect((await request(app).post('/api/v1/auth/verify-otp').send({ email, otp })).status).toBe(
      400,
    );
    expect(
      (
        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ resetToken, newPassword: 'HKTStore456' })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).post('/api/v1/auth/login').send({ email, password: 'HKTStore123' })).status,
    ).toBe(401);
    expect(
      (await request(app).post('/api/v1/auth/login').send({ email, password: 'HKTStore456' })).status,
    ).toBe(200);
  });
  it('seeds an Admin idempotently and rejects split identity conflicts', async () => {
    const seedName = `s${suffix}`.slice(0, 15);
    const input = {
      username: seedName,
      fullName: 'Seed Admin',
      email: `${seedName}@example.com`,
      phone: `+8491${suffix.slice(0, 7)}`,
      password: 'SeedPass123',
    };
    expect(await runInitialAdminSeed(prisma, input)).toBe('created');
    expect(await runInitialAdminSeed(prisma, input)).toBe('existing');
    await expect(
      runInitialAdminSeed(prisma, { ...input, username: `${seedName}x` }),
    ).rejects.toThrow('conflict');
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: seedName } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: admin.id } });
    await prisma.user.delete({ where: { id: admin.id } });
  });
  it('rejects a locked privileged account without leaking credentials', async () => {
    const locked = await prisma.user.create({
      data: {
        username: `l${username}`.slice(0, 15),
        fullName: 'Locked Admin',
        email: lockedEmail,
        phone: `+8492${suffix.slice(0, 7)}`,
        passwordHash: await hashPassword('LockedPass123'),
        role: 'ADMIN',
        status: 'LOCKED',
      },
    });
    await expect(
      service.login({ email: locked.email, password: 'LockedPass123' }, true, {
        ip: '127.0.0.1',
        userAgent: 'test',
        requestId: 'locked-login-test',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'AUTH_ACCOUNT_LOCKED' });
    await expect(
      service.login({ email: locked.email, password: 'WrongPass123' }, true, {
        ip: '127.0.0.1',
        userAgent: 'test',
        requestId: 'wrong-password-test',
      }),
    ).rejects.toMatchObject({ status: 401, code: 'AUTH_INVALID_CREDENTIALS' });
  });
  it('enforces the Admin login rate limit without account enumeration', async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await request(app)
        .post('/api/v1/auth/admin/login')
        .send({ username: `missing${suffix}`, password: 'WrongPass123' });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });
});