import { describe, expect, it, vi } from 'vitest';
import sitemap from './sitemap';

vi.mock('../lib/seo/sitemap', () => ({
  buildSitemap: vi.fn(() =>
    Promise.resolve({
      ok: true,
      value: [{ url: 'http://localhost:3000/', changeFrequency: 'weekly', priority: 1 }],
      issues: [],
    }),
  ),
}));

describe('Next.js sitemap route', () => {
  it('delegates sitemap generation to the SEO sitemap builder', async () => {
    await expect(sitemap()).resolves.toEqual([
      { url: 'http://localhost:3000/', changeFrequency: 'weekly', priority: 1 },
    ]);
  });
});
