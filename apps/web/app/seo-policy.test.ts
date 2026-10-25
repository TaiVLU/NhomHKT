import { describe, expect, it, vi } from 'vitest';
import { generateMetadata as generateAdminMetadata } from './admin/layout';
import { generateMetadata as generateRegisterMetadata } from './dang-ky/layout';
import { generateMetadata as generateCartMetadata } from './gio-hang/page';
import { generateMetadata as generateNotFoundMetadata } from './not-found';
import robots from './robots';

vi.mock('../features/cart/cart-page', () => ({
  CartPage: () => null,
}));
vi.mock('../services/catalog-client', () => ({
  siteUrl: () => 'http://localhost:3000',
}));

describe('Route SEO policy', () => {
  it('marks cart noindex and nofollow', () => {
    expect(generateCartMetadata()).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/gio-hang' },
      robots: { index: false, follow: false },
    });
  });

  it('marks auth routes noindex and nofollow', () => {
    expect(generateRegisterMetadata()).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/dang-ky' },
      robots: { index: false, follow: false },
    });
  });

  it('marks admin noindex, nofollow, and noarchive', () => {
    expect(generateAdminMetadata()).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/admin' },
      robots: { index: false, follow: false, noarchive: true },
    });
  });

  it('marks 404 noindex and nofollow', () => {
    expect(generateNotFoundMetadata()).toMatchObject({
      alternates: { canonical: 'http://localhost:3000/404' },
      robots: { index: false, follow: false },
    });
  });

  it('allows public crawling while disallowing private/admin paths and exposing sitemap', () => {
    const policy = robots();
    if (Array.isArray(policy.rules)) throw new Error('Expected one global robots rule.');
    const disallow = Array.isArray(policy.rules.disallow)
      ? policy.rules.disallow
      : [policy.rules.disallow ?? ''];
    expect(policy.rules.userAgent).toBe('*');
    expect(policy.rules.allow).toBe('/');
    for (const path of [
      '/admin/',
      '/tai-khoan/',
      '/gio-hang',
      '/thanh-toan/',
      '/dang-nhap',
      '/dang-ky',
      '/quen-mat-khau',
      '/dat-lai-mat-khau',
    ]) {
      expect(disallow).toContain(path);
    }
    expect(policy.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(disallow).not.toContain('/san-pham');
    expect(disallow).not.toContain('/san-pham?');
  });
});
