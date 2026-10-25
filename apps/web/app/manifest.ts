import type { MetadataRoute } from 'next';
import { DEFAULT_SEO_CONFIG } from '../lib/seo/core/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: DEFAULT_SEO_CONFIG.siteName,
    short_name: DEFAULT_SEO_CONFIG.brandName,
    description: DEFAULT_SEO_CONFIG.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f0',
    theme_color: DEFAULT_SEO_CONFIG.themeColor,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
