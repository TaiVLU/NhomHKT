import type { SitemapEntry, SitemapProvider } from '../types';

const promotionEntries: readonly SitemapEntry[] = [
  { url: '/khuyen-mai', changeFrequency: 'weekly', priority: 0.7 },
];

export const createPromotionSitemapProvider = (): SitemapProvider => ({
  name: 'promotion',
  getEntries: () => promotionEntries,
});
