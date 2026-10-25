import { describe, expect, it } from 'vitest';
import { publicEnvironment, resolveApiBaseUrl } from './environment';

describe('publicEnvironment', () => {
  it('provides a valid API URL', () => {
    expect(new URL(publicEnvironment.NEXT_PUBLIC_API_URL).protocol).toMatch(/^https?:$/);
    expect(publicEnvironment.NEXT_PUBLIC_API_URL).toMatch(/\/api\/v1$/);
  });

  it('normalizes one trailing slash', () => {
    expect(resolveApiBaseUrl('http://localhost:4000/api/v1/')).toBe('http://localhost:4000/api/v1');
  });

  it('rejects a missing or duplicated API prefix', () => {
    expect(() => resolveApiBaseUrl('http://localhost:4000')).toThrow('/api/v1');
    expect(() => resolveApiBaseUrl('http://localhost:4000/api/v1/api/v1')).toThrow('/api/v1');
  });

  it('rejects malformed or unsafe URL values', () => {
    expect(() => resolveApiBaseUrl('not-a-url')).toThrow();
    expect(() => resolveApiBaseUrl('ftp://localhost:4000/api/v1')).toThrow();
    expect(() => resolveApiBaseUrl('http://user:pass@localhost:4000/api/v1')).toThrow();
    expect(() => resolveApiBaseUrl('http://localhost:4000/api/v1?token=secret')).toThrow();
  });
});
