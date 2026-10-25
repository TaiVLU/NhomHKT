import type { SitemapEntry, SitemapProvider } from '../types';

const staticEntries: readonly SitemapEntry[] = [
  { url: '/', changeFrequency: 'weekly', priority: 1 },
  { url: '/san-pham', changeFrequency: 'daily', priority: 0.9 },
  { url: '/danh-muc', changeFrequency: 'weekly', priority: 0.8 },
];

export const createStaticSitemapProvider = (): SitemapProvider => ({
  name: 'static',
  getEntries: () => staticEntries,
});
