import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../lib/seo/sitemap';
import { expectAbsolutePublicUrl, productionSEOConfig } from './helpers';

const forbiddenRoutePrefixes = [
  '/admin',
  '/tai-khoan',
  '/dang-nhap',
  '/dang-ky',
  '/quen-mat-khau',
  '/dat-lai-mat-khau',
  '/gio-hang',
  '/thanh-toan',
  '/api',
  '/callback',
  '/preview',
  '/error',
  '/404',
] as const;

describe('SEO sitemap regression policy', () => {
  it('keeps sitemap output limited to public canonical URLs', async () => {
    const result = await buildSitemap({
      config: productionSEOConfig(),
      providers: [
        {
          name: 'public-only',
          getEntries: () => [
            { url: '/', priority: 1 },
            { url: '/san-pham', priority: 0.9 },
            { url: '/danh-muc', priority: 0.8 },
            { url: '/khuyen-mai', priority: 0.7 },
            { url: '/danh-muc/van-hoc', priority: 0.7 },
            { url: '/sach/atomic-habits', priority: 0.6 },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const urls = result.value.map((entry) => entry.url);
    expect(urls).toEqual([...urls].sort());
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expectAbsolutePublicUrl(url);
      const parsed = new URL(url);
      expect(forbiddenRoutePrefixes.some((prefix) => parsed.pathname.startsWith(prefix))).toBe(
        false,
      );
    }
  });

  it('excludes private, checkout, admin, auth, temporary, callback, error, and utility routes', async () => {
    const result = await buildSitemap({
      config: productionSEOConfig(),
      providers: [
        {
          name: 'approved-public',
          getEntries: () => [
            { url: '/' },
            { url: '/san-pham' },
            { url: '/danh-muc' },
            { url: '/khuyen-mai' },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const paths = result.value.map((entry) => new URL(entry.url).pathname);
    for (const prefix of forbiddenRoutePrefixes) {
      expect(paths.some((path) => path.startsWith(prefix))).toBe(false);
    }
  });

  it('keeps query strings and fragments out of normalized sitemap output', async () => {
    const result = await buildSitemap({
      config: productionSEOConfig(),
      providers: [{ name: 'clean', getEntries: () => [{ url: '/san-pham' }] }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual([{ url: 'https://hktstore.vn/san-pham' }]);
    expect(result.value[0]?.url).not.toContain('?');
    expect(result.value[0]?.url).not.toContain('#');
  });
});
