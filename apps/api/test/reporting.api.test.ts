import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { Environment } from '../src/config/environment.js';
import type { AuthService } from '../src/modules/auth/auth.service.js';
import { TokenService } from '../src/modules/auth/token.service.js';
import type { HealthService } from '../src/modules/health/health.service.js';
import type { ReportingService } from '../src/modules/reporting/reporting.service.js';

const environment: Environment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  WEB_ORIGIN: 'http://localhost:3000',
  DATABASE_URL: 'sqlserver://unused',
  JWT_SECRET: 'r'.repeat(32),
  JWT_ISSUER: 'hktstore-api',
  JWT_AUDIENCE: 'hktstore-web',
  OTP_PEPPER: 'p'.repeat(32),
  MAIL_MODE: 'fake',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_FROM: 'reporting@test.local',
  PRODUCT_IMAGE_ADAPTER: 'fake',
};
const tokens = new TokenService(environment);
const healthService = { check: vi.fn() } as unknown as HealthService;
const report = vi.fn().mockResolvedValue({ summary: { recognizedRevenue: 0 } });
const app = createApp({
  environment,
  healthService,
  authService: { tokens } as AuthService,
  reportingService: { report } as unknown as ReportingService,
});
const bearer = (role: string) => ({
  Authorization: `Bearer ${tokens.signAccessToken(1n, role, `family-${role}`)}`,
});

describe('M7.4E reporting API access and validation', () => {
  it('rejects unauthenticated and customer callers', async () => {
    expect((await request(app).get('/api/v1/admin/dashboard/overview')).status).toBe(401);
    expect(
      (await request(app).get('/api/v1/admin/dashboard/overview').set(bearer('CUSTOMER'))).status,
    ).toBe(403);
  });

  it('allows Admin and Staff read-only reporting access', async () => {
    for (const role of ['ADMIN', 'STAFF']) {
      const response = await request(app)
        .get('/api/v1/admin/dashboard/overview?from=2026-07-01&to=2026-07-07')
        .set(bearer(role));
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: { summary: { recognizedRevenue: 0 } },
      });
    }
  });

  it('returns a stable public error for invalid, reversed and excessive ranges', async () => {
    for (const query of [
      'from=2026-07-31&to=2026-07-01',
      'from=2024-01-01&to=2026-01-01',
      'from=2026-02-30&to=2026-03-01',
      'from=2026-07-01&to=2026-07-02&sort=DROP',
    ]) {
      const response = await request(app)
        .get(`/api/v1/admin/dashboard/revenue?${query}`)
        .set(bearer('ADMIN'));
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'REPORTING_INVALID_RANGE' },
      });
      const body = response.body as { requestId?: unknown };
      expect(body.requestId).toBeTypeOf('string');
    }
  });

  it('exposes no mutation route', async () => {
    expect(
      (await request(app).post('/api/v1/admin/dashboard/overview').set(bearer('ADMIN')).send({}))
        .status,
    ).toBe(404);
  });
});
