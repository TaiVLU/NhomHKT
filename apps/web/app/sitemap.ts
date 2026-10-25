import type { MetadataRoute } from 'next';
import { buildSitemap } from '../lib/seo/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await buildSitemap();
  if (!result.ok) throw new Error('Invalid sitemap configuration.');
  return [...result.value];
}
