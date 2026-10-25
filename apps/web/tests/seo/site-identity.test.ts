import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi, afterEach } from 'vitest';
import manifest from '../../app/manifest';
import { generateMetadata, viewport } from '../../app/layout';
import { buildSEOAssets, createSEOConfig, DEFAULT_SEO_CONFIG, toNextMetadata } from '../../lib/seo';
import { metadataUrl, productionOrigin, stubProductionSEOEnvironment } from './helpers';

const publicDir = join(process.cwd(), 'public');
const pngSignature = '89504e470d0a1a0a';

const pngInfo = (asset: string): { width: number; height: number; signature: string } => {
  const data = readFileSync(join(publicDir, asset));
  return {
    signature: data.subarray(0, 8).toString('hex'),
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
};

describe('site identity metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports application identity, metadataBase, manifest, icons, and accessible viewport values', () => {
    stubProductionSEOEnvironment();

    const metadata = generateMetadata();

    expect(metadata.applicationName).toBe('HKTStore');
    expect(new URL(metadataUrl(metadata.metadataBase)).origin).toBe(productionOrigin);
    expect(metadata.manifest).toBe('/manifest.webmanifest');
    const iconsJson = JSON.stringify(metadata.icons);
    expect(iconsJson).toContain('/favicon.svg');
    expect(iconsJson).toContain('/icon-192.png');
    expect(iconsJson).toContain('192x192');
    expect(iconsJson).toContain('/icon-512.png');
    expect(iconsJson).toContain('512x512');
    expect(iconsJson).toContain('/apple-touch-icon.png');
    expect(iconsJson).toContain('180x180');
    expect(viewport).toMatchObject({
      width: 'device-width',
      initialScale: 1,
      themeColor: DEFAULT_SEO_CONFIG.themeColor,
    });
    expect(viewport).not.toHaveProperty('maximumScale');
    expect(viewport).not.toHaveProperty('userScalable');
  });

  it('keeps title defaults and template behavior free of duplicate HKTStore suffixes', () => {
    const config = createSEOConfig({
      origin: productionOrigin,
      environment: 'production',
      indexingEnabled: true,
    });
    expect(config.ok).toBe(true);
    if (!config.ok) return;

    const home = buildSEOAssets(
      {
        type: 'home',
        title: 'HKTStore',
        description: 'HKTStore bookstore.',
        canonicalPath: '/',
        published: true,
        indexable: true,
      },
      config.value,
    );
    const book = buildSEOAssets(
      {
        type: 'book',
        title: 'Atomic Habits',
        description: 'Small habits, large outcomes.',
        canonicalPath: '/sach/atomic-habits',
        published: true,
        indexable: true,
      },
      config.value,
    );

    expect(home.ok).toBe(true);
    expect(book.ok).toBe(true);
    if (!home.ok || !book.ok) return;
    expect(toNextMetadata(home.value.metadata).title).toBe('HKTStore');
    expect(toNextMetadata(book.value.metadata).title).toBe('Atomic Habits | HKTStore');
  });

  it('uses local brand and social preview assets without leaking localhost into production URLs', () => {
    stubProductionSEOEnvironment();

    for (const asset of [
      'favicon.svg',
      'icon-192.svg',
      'icon-512.svg',
      'apple-touch-icon.svg',
      'icon-192.png',
      'icon-512.png',
      'apple-touch-icon.png',
      'social-preview.png',
    ]) {
      expect(existsSync(join(publicDir, asset))).toBe(true);
    }

    const metadata = generateMetadata();
    const openGraphImages = metadata.openGraph?.images;
    const openGraphImageUrls = Array.isArray(openGraphImages)
      ? openGraphImages.map((image: unknown) => metadataUrl(image))
      : openGraphImages
        ? [metadataUrl(openGraphImages)]
        : [];
    const urls = [
      metadataUrl(metadata.alternates?.canonical),
      metadataUrl(metadata.openGraph?.url),
      ...openGraphImageUrls,
      ...((metadata.twitter?.images as string[] | undefined) ?? []),
    ];

    expect(urls).toContain(`${productionOrigin}/social-preview.png`);
    for (const url of urls) {
      expect(url).not.toContain('localhost');
      expect(url).not.toContain('127.0.0.1');
    }
  });

  it('keeps raster manifest, apple, and social preview assets valid with certified dimensions', () => {
    expect(pngInfo('icon-192.png')).toEqual({
      signature: pngSignature,
      width: 192,
      height: 192,
    });
    expect(pngInfo('icon-512.png')).toEqual({
      signature: pngSignature,
      width: 512,
      height: 512,
    });
    expect(pngInfo('apple-touch-icon.png')).toEqual({
      signature: pngSignature,
      width: 180,
      height: 180,
    });
    expect(pngInfo('social-preview.png')).toEqual({
      signature: pngSignature,
      width: 1200,
      height: 630,
    });
  });

  it('returns a local-safe manifest for site identity without PWA/offline claims', () => {
    const value = manifest();

    expect(value).toMatchObject({
      name: 'HKTStore',
      short_name: 'HKTStore',
      start_url: '/',
      display: 'standalone',
      theme_color: DEFAULT_SEO_CONFIG.themeColor,
    });
    expect(value.icons).toEqual([
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ]);
    for (const icon of value.icons ?? []) {
      expect(icon.sizes).toBeDefined();
      if (!icon.sizes) continue;
      const [width, height] = icon.sizes.split('x').map(Number);
      expect(pngInfo(icon.src.replace(/^\//, ''))).toMatchObject({ width, height });
    }
    expect(value).not.toHaveProperty('scope');
    expect(value).not.toHaveProperty('share_target');
  });

  it('declares owned social preview dimensions while preserving product image precedence', () => {
    const config = createSEOConfig({
      origin: productionOrigin,
      environment: 'production',
      indexingEnabled: true,
    });
    expect(config.ok).toBe(true);
    if (!config.ok) return;

    const fallback = buildSEOAssets(
      {
        type: 'catalog',
        title: 'Sach',
        description: 'Browse books.',
        canonicalPath: '/san-pham',
        published: true,
        indexable: true,
      },
      config.value,
    );
    const product = buildSEOAssets(
      {
        type: 'book',
        title: 'Atomic Habits',
        description: 'Small habits, large outcomes.',
        canonicalPath: '/sach/atomic-habits',
        imagePath: '/covers/atomic-habits.webp',
        published: true,
        indexable: true,
      },
      config.value,
    );

    expect(fallback.ok).toBe(true);
    expect(product.ok).toBe(true);
    if (!fallback.ok || !product.ok) return;

    expect(fallback.value.metadata.openGraph.images[0]).toEqual({
      url: `${productionOrigin}/social-preview.png`,
      alt: 'Sach | HKTStore',
      width: 1200,
      height: 630,
    });
    expect(fallback.value.metadata.twitter.images).toEqual([
      `${productionOrigin}/social-preview.png`,
    ]);
    expect(product.value.metadata.openGraph.images[0]).toMatchObject({
      url: `${productionOrigin}/covers/atomic-habits.webp`,
      alt: 'Atomic Habits | HKTStore',
    });
    expect(product.value.metadata.openGraph.images[0]).not.toHaveProperty('width');
  });
});
