import type { MetadataRoute } from 'next';
import { seoRuntimeConfigFromEnvironment } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  const config = seoRuntimeConfigFromEnvironment();
  if (!config.ok) throw new Error('Invalid robots SEO configuration.');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/tai-khoan/',
        '/gio-hang',
        '/thanh-toan/',
        '/dang-nhap',
        '/dang-ky',
        '/quen-mat-khau',
        '/dat-lai-mat-khau',
      ],
    },
    ...(config.value.indexing.enabled ? { sitemap: `${config.value.origin}/sitemap.xml` } : {}),
  };
}
