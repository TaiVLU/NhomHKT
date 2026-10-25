import { beforeEach, describe, expect, it, vi } from 'vitest';

const freshClient = async () => {
  vi.resetModules();
  return import('./auth-client');
};

describe('auth client session bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not call refresh when the browser has no local session hint', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = await freshClient();

    await expect(client.bootstrapSession()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stores a session hint after login and clears it after failed refresh', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              accessToken: 'token',
              user: { role: 'CUSTOMER', fullName: 'M6 Demo Customer' },
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: 'AUTH_REFRESH_INVALID', message: 'Invalid session.' },
          }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const client = await freshClient();

    await client.authenticate('/auth/login', { username: 'm6demo', password: 'M6Demo12345' });
    expect(localStorage.getItem('rosach:session')).toBe('1');

    client.clearAccessToken();
    localStorage.setItem('rosach:session', '1');
    await expect(client.bootstrapSession()).resolves.toBe(false);
    expect(localStorage.getItem('rosach:session')).toBeNull();
  });
});
