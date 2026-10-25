import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

const appDir = join(process.cwd(), 'app');
const publicDir = join(process.cwd(), 'public');

const source = (path: string): string => readFileSync(join(appDir, path), 'utf8');

describe('teacher SEO checklist on-page compliance', () => {
  it('keeps the approved legacy product redirect permanent and canonical', async () => {
    expect(typeof nextConfig.redirects).toBe('function');
    const redirects = await nextConfig.redirects!();

    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: '/san-pham/:slug',
          destination: '/sach/:slug',
          permanent: true,
        },
      ]),
    );
    expect(
      redirects.find((redirect) => redirect.destination === '/san-pham/:slug'),
    ).toBeUndefined();
  });

  it('keeps local SEO assets referenced by manifest and metadata available', () => {
    for (const asset of [
      'favicon.svg',
      'icon-192.svg',
      'icon-512.svg',
      'apple-touch-icon.svg',
      'icon-192.png',
      'icon-512.png',
      'apple-touch-icon.png',
      'social-preview.svg',
      'social-preview.png',
      'book-placeholder.svg',
    ]) {
      expect(existsSync(join(publicDir, asset))).toBe(true);
    }
  });

  it('keeps public route files with one primary H1 in the rendered source where practical', () => {
    const routeFiles = [
      'page.tsx',
      'san-pham/page.tsx',
      'danh-muc/page.tsx',
      'danh-muc/[slug]/page.tsx',
      'khuyen-mai/page.tsx',
      'not-found.tsx',
    ];

    for (const file of routeFiles) {
      const content = source(file);
      const h1Count = (content.match(/<h1[\s>]/g) ?? []).length;
      expect(h1Count, file).toBe(1);
    }

    const productPage = source('sach/[slug]/page.tsx');
    const productDetail = readFileSync(
      join(process.cwd(), 'features/catalog/product-detail-experience.tsx'),
      'utf8',
    );
    expect(productPage).toContain('<ProductDetailExperience product={product} />');
    expect((productDetail.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  });

  it('keeps product cards and related discovery links on canonical product routes', () => {
    const productCard = readFileSync(
      join(process.cwd(), 'features/catalog/product-card.tsx'),
      'utf8',
    );
    const productDetail = source('sach/[slug]/page.tsx');

    expect(productCard).toContain('href={productUrl(product.slug)}');
    expect(productCard).toContain('ProductImage');
    expect(productCard).toContain('alt={product.primaryImage?.altText || product.name}');
    expect(productDetail).toContain('relatedProducts.slice(0, 4)');
    expect(productDetail).toContain('productUrl(product.slug)');
  });

  it('keeps visible breadcrumbs aligned with structured data activation on public detail routes', () => {
    const categoryDetail = source('danh-muc/[slug]/page.tsx');
    const productDetail = source('sach/[slug]/page.tsx');

    expect(categoryDetail).toContain('<nav className="breadcrumb"');
    expect(categoryDetail).toContain('structuredData');
    expect(categoryDetail).toContain('breadcrumb');
    expect(categoryDetail).toContain('categoryUrl(category.slug)');

    expect(productDetail).toContain('<nav className="breadcrumb"');
    expect(productDetail).toContain('structuredData');
    expect(productDetail).toContain('breadcrumb');
    expect(productDetail).toContain('productUrl(product.slug)');
  });

  it('keeps the friendly 404 route noindex and linked back to catalog discovery', () => {
    const notFound = source('not-found.tsx');

    expect(notFound).toContain('indexable: false');
    expect(notFound).toContain('follow: false');
    expect(notFound).toContain("canonicalPath: '/404'");
    expect(notFound).toContain('href="/san-pham"');
  });
});
