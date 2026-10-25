import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import type { HealthService } from '../src/modules/health/health.service.js';

const testEnvironment: Environment = {
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

describe('GET /api/v1/health', () => {
  it('applies the explicit bounded trust-proxy setting during app creation', () => {
    const healthService: HealthService = {
      check: () => Promise.reject(new Error('not called')),
    };
    expect(createApp({ environment: testEnvironment, healthService }).get('trust proxy')).toBe(0);
    expect(
      createApp({
        environment: { ...testEnvironment, TRUST_PROXY_HOPS: 1 },
        healthService,
      }).get('trust proxy'),
    ).toBe(1);
  });

  it('reports a healthy API and database', async () => {
    const healthService: HealthService = {
      check: () =>
        Promise.resolve({
          status: 'ok',
          api: 'up',
          environment: 'valid',
          database: { status: 'up' },
          timestamp: new Date().toISOString(),
        }),
    };
    const response = await request(createApp({ environment: testEnvironment, healthService })).get(
      '/api/v1/health',
    );
    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });

  it('returns 503 instead of faking success when the database is down', async () => {
    const healthService: HealthService = {
      check: () =>
        Promise.resolve({
          status: 'degraded',
          api: 'up',
          environment: 'valid',
          database: { status: 'down', error: 'ConnectionError' },
          timestamp: new Date().toISOString(),
        }),
    };
    const response = await request(createApp({ environment: testEnvironment, healthService })).get(
      '/api/v1/health',
    );
    expect(response.status).toBe(503);
    expect(response.headers['x-request-id']).toBeTypeOf('string');
  });
});