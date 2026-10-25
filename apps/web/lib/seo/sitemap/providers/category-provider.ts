import {
  categoryUrl,
  getCategories,
  type CategorySummary,
} from '../../../../services/catalog-client';
import type { SitemapEntry, SitemapProvider } from '../types';

export interface CategorySitemapProviderOptions {
  readonly getCategories?: () => Promise<readonly CategorySummary[]>;
}

export const createCategorySitemapProvider = (
  options: CategorySitemapProviderOptions = {},
): SitemapProvider => {
  const loadCategories = options.getCategories ?? getCategories;
  return {
    name: 'category',
    getEntries: async (): Promise<readonly SitemapEntry[]> => {
      const categories = await loadCategories();
      return categories.map((category) => ({
        url: categoryUrl(category.slug),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    },
  };
};
