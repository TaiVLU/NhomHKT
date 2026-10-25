import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCategories, getCategory, getProduct, getProducts } from './catalog-client';

const response = (status: number, body: unknown = {}): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as Response;

describe('catalog client failure semantics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null only for a genuine product 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(404)));
    await expect(getProduct('khong-ton-tai')).resolves.toBeNull();
  });

  it('propagates product upstream failures instead of converting them to not-found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(503)));
    await expect(getProduct('sach-that')).rejects.toThrow();
  });

  it('returns valid detail envelopes through the approved local API origin', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { id: '1749', name: 'Data Storytelling', slug: 'du-lieu-ke-chuyen' },
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          success: true,
          data: { id: '44', name: 'Children', slug: 'thieu-nhi' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProduct('du-lieu-ke-chuyen')).resolves.toMatchObject({
      slug: 'du-lieu-ke-chuyen',
    });
    await expect(getCategory('thieu-nhi')).resolves.toMatchObject({ slug: 'thieu-nhi' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:4000/api/v1/products/du-lieu-ke-chuyen',
      { cache: 'no-store' },
    );
  });

  it('rejects malformed success envelopes instead of producing false 404s', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { success: true })));
    await expect(getProduct('du-lieu-ke-chuyen')).rejects.toThrow('Invalid product response');
    await expect(getCategory('thieu-nhi')).rejects.toThrow('Invalid category response');
  });

  it('propagates list and category upstream failures instead of producing false 404s', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(503)));
    await expect(getProducts()).rejects.toThrow();
    await expect(getCategories()).rejects.toThrow();
  });
});
