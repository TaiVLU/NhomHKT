import type { Metadata } from 'next';
import { expect, vi } from 'vitest';
import { createSEOConfig, type SEOConfig } from '../../lib/seo';

export const productionOrigin = 'https://hktstore.vn';

export const productionSEOConfig = (): SEOConfig => {
  const config = createSEOConfig({
    origin: productionOrigin,
    environment: 'production',
    indexingEnabled: true,
  });
  if (!config.ok) throw new Error('Expected production SEO config to be valid.');
  return config.value;
};

export const stubProductionSEOEnvironment = () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', productionOrigin);
};

export const expectAbsolutePublicUrl = (url: string) => {
  const parsed = new URL(url);
  expect(parsed.origin).toBe(productionOrigin);
  expect(parsed.search).toBe('');
  expect(parsed.hash).toBe('');
};

export const metadataUrl = (value: unknown): string => {
  if (value instanceof URL) return value.toString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) return metadataUrl(value.url);
  return '';
};

export const expectMetadataConsistency = (metadata: Metadata, expectedCanonical: string) => {
  const canonical = metadataUrl(metadata.alternates?.canonical);
  const openGraphUrl = metadataUrl(metadata.openGraph?.url);

  expect(canonical).toBe(expectedCanonical);
  expect(openGraphUrl).toBe(canonical);
  expect(metadata.openGraph?.title).toBe(metadata.title);
  expect(metadata.openGraph?.description).toBe(metadata.description);
  expect(metadata.twitter?.title).toBe(metadata.title);
  expect(metadata.twitter?.description).toBe(metadata.description);
  if (metadata.metadataBase) expect(new URL(metadata.metadataBase).origin).toBe(productionOrigin);
  expectAbsolutePublicUrl(canonical);
};
