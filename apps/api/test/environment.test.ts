import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../src/config/environment.js';

describe('parseEnvironment', () => {
  it('accepts a valid SQL Server environment', () => {
    const value = parseEnvironment({
      NODE_ENV: 'test',
      API_HOST: '127.0.0.1',
      API_PORT: '4000',
      WEB_ORIGIN: 'http://localhost:3000',
      DATABASE_URL: 'sqlserver://localhost:1433;database=hktstore;user=test;password=test',
      JWT_SECRET: 'a'.repeat(32),
      OTP_PEPPER: 'b'.repeat(32),
    });
    expect(value.API_PORT).toBe(4000);
    expect(value.TRUST_PROXY_HOPS).toBe(0);
  });

  it('accepts only the bounded zero-hop or one-hop proxy policy', () => {
    const base = {
      WEB_ORIGIN: 'http://localhost:3000',
      DATABASE_URL: 'sqlserver://localhost:1433;database=hktstore;user=test;password=test',
      JWT_SECRET: 'a'.repeat(32),
      OTP_PEPPER: 'b'.repeat(32),
    };
    expect(parseEnvironment({ ...base, TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS).toBe(1);
    expect(() => parseEnvironment({ ...base, TRUST_PROXY_HOPS: '2' })).toThrow(/TRUST_PROXY_HOPS/);
    expect(() => parseEnvironment({ ...base, TRUST_PROXY_HOPS: 'loopback' })).toThrow(
      /TRUST_PROXY_HOPS/,
    );
  });

  it('rejects a non-SQL Server database URL', () => {
    expect(() =>
      parseEnvironment({
        WEB_ORIGIN: 'http://localhost:3000',
        DATABASE_URL: 'postgres://db',
        JWT_SECRET: 'a'.repeat(32),
        OTP_PEPPER: 'b'.repeat(32),
      }),
    ).toThrow(/DATABASE_URL/);
  });
});