import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import { TokenService } from '../src/modules/auth/token.service.js';
import type { HealthService } from '../src/modules/health/health.service.js';

const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: 'sqlserver://localhost:1433;database=hktstore;user=test;password=test',
  JWT_SECRET: 'a'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'b'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'no-reply@hktstore.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const healthyService: HealthService = {
  check: () =>
    Promise.resolve({
      status: 'ok',
      api: 'up',
      environment: 'valid',
      database: { status: 'up' },
      timestamp: new Date().toISOString(),
    }),
};

describe('API documentation and diagnostics', () => {
  it('serves safe documentation and a valid OpenAPI 3.x document', async () => {
    const app = createApp({ environment, healthService: healthyService });
    const docs = await request(app).get('/docs');
    expect(docs.status).toBe(200);
    expect(docs.text).toContain('HKT Store API v1');
    expect(docs.text).not.toContain(environment.JWT_SECRET);

    const specResponse = await request(app).get('/docs/openapi.json');
    const spec = specResponse.body as unknown as {
      openapi: string;
      paths: Record<string, unknown>;
      components: {
        securitySchemes: Record<string, unknown>;
        schemas: { BigIntId: { type: string } };
      };
    };
    expect(specResponse.status).toBe(200);
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/auth/login']).toBeDefined();
    expect(spec.paths['/me/addresses']).toBeDefined();
    expect(spec.paths['/admin/products']).toBeDefined();
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    expect(spec.components.schemas.BigIntId.type).toBe('string');
  });

  it('keeps detailed diagnostics Admin-only and never serializes configuration', async () => {
    const tokens = new TokenService(environment);
    const app = createApp({
      environment,
      healthService: healthyService,
      authService: { tokens } as never,
    });
    expect((await request(app).get('/api/v1/diagnostics')).status).toBe(401);
    const staff = tokens.signAccessToken(2n, 'STAFF', 'family');
    expect(
      (await request(app).get('/api/v1/diagnostics').set('Authorization', `Bearer ${staff}`))
        .status,
    ).toBe(403);
    const admin = tokens.signAccessToken(1n, 'ADMIN', 'family');
    const response = await request(app)
      .get('/api/v1/diagnostics')
      .set('Authorization', `Bearer ${admin}`);
    const payload = response.body as unknown as {
      data: {
        modules: { docs: string };
        status: string;
        database: string;
        prisma: string;
        apiVersion: string;
      };
    };
    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({
      status: 'up',
      database: 'up',
      prisma: 'up',
      apiVersion: 'v1',
    });
    expect(JSON.stringify(response.body)).not.toContain('DATABASE_URL');
    expect(JSON.stringify(response.body)).not.toContain(environment.JWT_SECRET);
    expect(payload.data.modules.docs).toBe('up');
  });
});