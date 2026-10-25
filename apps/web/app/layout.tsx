import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { SiteChrome } from '../features/shell/site-chrome';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../lib/seo/metadata';
import { seoRuntimeConfigFromEnvironment } from '../lib/seo/core/config';

const descriptor: SEODescriptor = {
  type: 'home',
  title: 'HKT Store - Thế Giới Manga & Sách Kỹ Năng',
  description: 'HKT Store - Nền tảng mua sắm truyện tranh Manga Anime và sách phát triển kỹ năng chọn lọc.',
  canonicalPath: '/',
  published: true,
  indexable: true,
};

export function generateMetadata(): Metadata {
  const config = seoRuntimeConfigFromEnvironment();
  if (!config.ok) throw new Error('Invalid root SEO runtime config.');
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid root SEO descriptor.');
  return {
    ...toNextMetadata(assets.value.metadata),
    applicationName: config.value.siteName,
    metadataBase: new URL(config.value.origin),
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
        { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      ],
      apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
