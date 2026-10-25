import { getProducts, productUrl, type ProductCard } from '../../../../services/catalog-client';
import type { SitemapEntry, SitemapProvider } from '../types';

export interface BookSitemapProviderOptions {
  readonly getProducts?: typeof getProducts;
  readonly pageSize?: number;
}

export const createBookSitemapProvider = (
  options: BookSitemapProviderOptions = {},
): SitemapProvider => {
  const loadProducts = options.getProducts ?? getProducts;
  const pageSize = options.pageSize ?? 100;
  return {
    name: 'book',
    getEntries: async (): Promise<readonly SitemapEntry[]> => {
      const result: {
        data: ProductCard[];
        meta: { page: number; pageSize: number; total: number };
      } = await loadProducts(`pageSize=${pageSize}`);
      return result.data.map((product) => ({
        url: productUrl(product.slug),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    },
  };
};
