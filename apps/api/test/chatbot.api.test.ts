import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { requestId } from '../src/middlewares/request-id.js';
import { createChatbotRouter } from '../src/modules/chatbot/chatbot.routes.js';

const appWith = (publicProducts: ReturnType<typeof vi.fn>, trustProxyHops: 0 | 1 = 0) => {
  const app = express();
  app.set('trust proxy', trustProxyHops);
  app.use(express.json());
  app.use(requestId);
  app.get('/api/v1/products', (_request, response) => response.json({ success: true }));
  app.use(
    '/api/v1/chatbot',
    createChatbotRouter({ publicProducts } as unknown as CatalogService, 'https://hktstore.example'),
  );
  app.use(errorHandler);
  return app;
};

describe('chatbot public API', () => {
  it('serves a public request without auth and returns flattened data', async () => {
    const app = appWith(
      vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } }),
    );
    const response = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'tìm sách', source: 'TYPEBOT' });
    expect(response.status).toBe(200);
    expect(response.body as unknown).toMatchObject({
      data: { resultCount: 0, product1Title: null },
    });
  });
  it.each([
    ['category', { message: 'sách thiếu nhi', source: 'TYPEBOT' }, { category: 'thieu-nhi' }],
    [
      'author',
      { message: 'sách của Nguyễn Nhật Ánh', source: 'TYPEBOT' },
      { author: 'nguyen-nhat-anh' },
    ],
    ['price', { message: 'sách dưới 200 nghìn', source: 'TYPEBOT' }, { maxPrice: 200000 }],
    ['availability', { message: 'sách nào còn hàng', source: 'TYPEBOT' }, { inStock: 'true' }],
  ])('maps valid %s search through the public catalog boundary', async (_label, body, expected) => {
    const publicProducts = vi
      .fn()
      .mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } });
    const app = appWith(publicProducts);
    const response = await request(app).post('/api/v1/chatbot/search').send(body);
    expect(response.status).toBe(200);
    expect(publicProducts).toHaveBeenCalledWith(expect.objectContaining(expected));
  });
  it('maps invalid and oversized bodies to stable public errors', async () => {
    const app = appWith(vi.fn());
    const invalid = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'x', source: 'BAD' });
    expect(invalid.body as unknown).toMatchObject({
      error: { code: 'CHATBOT_INVALID_INPUT' },
    });
    const oversized = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'x'.repeat(501), source: 'TYPEBOT' });
    expect(oversized.body as unknown).toMatchObject({
      error: { code: 'CHATBOT_MESSAGE_TOO_LONG' },
    });
  });
  it('hides upstream failures', async () => {
    const app = appWith(vi.fn().mockRejectedValue(new Error('SQL secret path')));
    const response = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'tìm sách', source: 'TYPEBOT' });
    expect(response.status).toBe(503);
    expect(response.body as unknown).toMatchObject({
      error: { code: 'CHATBOT_UPSTREAM_UNAVAILABLE' },
    });
    expect(JSON.stringify(response.body as unknown)).not.toContain('SQL secret');
  });
  it('applies 30 requests/minute only to the chatbot route', async () => {
    const app = appWith(
      vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } }),
    );
    for (let count = 0; count < 30; count += 1) {
      const response = await request(app)
        .post('/api/v1/chatbot/search')
        .send({ message: 'xin chào', source: 'TYPEBOT' });
      expect(response.status).toBe(200);
    }
    const limited = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'xin chào', source: 'TYPEBOT' });
    expect(limited.status).toBe(429);
    expect(limited.body as unknown).toMatchObject({ error: { code: 'CHATBOT_RATE_LIMITED' } });
    expect(await request(app).get('/api/v1/products')).toMatchObject({ status: 200 });
  });
  it('accepts a one-hop proxied request without the forwarded-for validation error', async () => {
    const app = appWith(
      vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } }),
      1,
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await request(app)
      .post('/api/v1/chatbot/search')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ message: 'xin chĂ o', source: 'TYPEBOT' });
    expect(response.status).toBe(200);
    expect(
      consoleError.mock.calls.some((arguments_) =>
        arguments_.some((value) => String(value).includes('ERR_ERL_UNEXPECTED_X_FORWARDED_FOR')),
      ),
    ).toBe(false);
    consoleError.mockRestore();
  });
  it('keys independent clients separately behind the verified one-hop proxy', async () => {
    const app = appWith(
      vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } }),
      1,
    );
    for (let count = 0; count < 30; count += 1) {
      expect(
        await request(app)
          .post('/api/v1/chatbot/search')
          .set('X-Forwarded-For', '203.0.113.20')
          .send({ message: 'xin chĂ o', source: 'TYPEBOT' }),
      ).toMatchObject({ status: 200 });
    }
    expect(
      await request(app)
        .post('/api/v1/chatbot/search')
        .set('X-Forwarded-For', '203.0.113.21')
        .send({ message: 'xin chĂ o', source: 'TYPEBOT' }),
    ).toMatchObject({ status: 200 });
    expect(
      await request(app)
        .post('/api/v1/chatbot/search')
        .set('X-Forwarded-For', '203.0.113.20')
        .send({ message: 'xin chĂ o', source: 'TYPEBOT' }),
    ).toMatchObject({
      status: 429,
      body: { error: { code: 'CHATBOT_RATE_LIMITED' } },
    });
  });
  it('does not let spoofed forwarded-for values bypass the direct-path limiter', async () => {
    const app = appWith(
      vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } }),
      0,
    );
    for (let count = 0; count < 30; count += 1) {
      expect(
        await request(app)
          .post('/api/v1/chatbot/search')
          .set('X-Forwarded-For', `203.0.113.${count + 1}`)
          .send({ message: 'xin chĂ o', source: 'TYPEBOT' }),
      ).toMatchObject({ status: 200 });
    }
    expect(
      await request(app)
        .post('/api/v1/chatbot/search')
        .set('X-Forwarded-For', '198.51.100.200')
        .send({ message: 'xin chĂ o', source: 'TYPEBOT' }),
    ).toMatchObject({
      status: 429,
      body: { error: { code: 'CHATBOT_RATE_LIMITED' } },
    });
  });
  it('rejects injection-like input without leaking it', async () => {
    const app = appWith(vi.fn());
    const response = await request(app)
      .post('/api/v1/chatbot/search')
      .send({ message: 'SELECT password FROM User', source: 'TYPEBOT' });
    expect(response.status).toBe(400);
    expect(response.body as unknown).toMatchObject({ error: { code: 'CHATBOT_INVALID_INPUT' } });
    expect(JSON.stringify(response.body as unknown)).not.toContain('password');
  });
});
