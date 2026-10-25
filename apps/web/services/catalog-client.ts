import type { EntityId } from '@hktstore/shared';
import { apiBaseUrl as base } from '../lib/environment';
import { seoRuntimeConfigFromEnvironment } from '../lib/seo/core/config';

export interface ProductAvailability {
  availableQuantity: number;
  inStock: boolean;
  lowStock: boolean;
}

export interface ProductCard {
  id: EntityId;
  name: string;
  slug: string;
  shortDescription: string | null;
  primaryImage: { url: string; altText: string } | null;
  authors: Array<{ name: string; slug: string }>;
  minPrice: number;
  maxPrice: number;
  isNew: boolean;
  isFeatured: boolean;
  availability: ProductAvailability;
}

export interface ProductVariant {
  id: EntityId;
  sku: string;
  isbn: string | null;
  name: string;
  coverType: string | null;
  listPrice: number;
  salePrice: number;
  availability: ProductAvailability;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  releaseDate: string | null;
  pageCount: number | null;
  language: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  variants: ProductVariant[];
  images: Array<{
    id: EntityId;
    url: string | null;
    altText: string;
    productVariantId: EntityId | null;
  }>;
  categories: Array<{ name: string; slug: string }>;
  publisher: { name: string; slug: string } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  relatedProducts: ProductCard[];
}

export interface CategorySummary {
  id: EntityId;
  name: string;
  slug: string;
  description?: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const successData = <T>(body: unknown, valid: (value: unknown) => boolean, message: string): T => {
  if (!isRecord(body) || body.success !== true || !valid(body.data)) throw new Error(message);
  return body.data as T;
};

const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isRecord);

export const siteUrl = (): string => {
  const config = seoRuntimeConfigFromEnvironment();
  if (!config.ok) throw new Error('Invalid public site URL configuration.');
  return config.value.origin;
};

export const productUrl = (slug: string): string => `/sach/${slug}`;
export const categoryUrl = (slug: string): string => `/danh-muc/${slug}`;

export const getProducts = async (
  query = '',
): Promise<{ data: ProductCard[]; meta: { page: number; pageSize: number; total: number } }> => {
  try {
    const url = `${base}/products${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n[API ERROR ${response.status}] Gọi URL: ${url}`);
      console.error(`[NỘI DUNG LỖI BACKEND]:`, errorText, `\n`);
      // Trả về danh sách rỗng để tránh sập toàn trang 500 khi DB chưa sẵn sàng
      return {
        data: [],
        meta: { page: 1, pageSize: 12, total: 0 },
      };
    }

    const body: unknown = await response.json();
    if (!isRecord(body) || !isRecord(body.meta)) {
      return {
        data: [],
        meta: { page: 1, pageSize: 12, total: 0 },
      };
    }

    const { page, pageSize, total } = body.meta;
    if (typeof page !== 'number' || typeof pageSize !== 'number' || typeof total !== 'number') {
      return {
        data: [],
        meta: { page: 1, pageSize: 12, total: 0 },
      };
    }

    return {
      data: successData<ProductCard[]>(body, isRecordArray, 'Invalid catalog response.'),
      meta: { page, pageSize, total },
    };
  } catch (error) {
    console.error('[FETCH CATALOG ERROR]:', error);
    return {
      data: [],
      meta: { page: 1, pageSize: 12, total: 0 },
    };
  }
};

export const getProduct = async (slug: string): Promise<ProductDetail | null> => {
  try {
    const response = await fetch(`${base}/products/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return successData<ProductDetail>(await response.json(), isRecord, 'Invalid product response.');
  } catch {
    return null;
  }
};

export const getCategories = async (): Promise<CategorySummary[]> => {
  try {
    const response = await fetch(`${base}/categories`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return successData<CategorySummary[]>(
      await response.json(),
      isRecordArray,
      'Invalid category response.',
    );
  } catch {
    return [];
  }
};

export const getAuthors = async (): Promise<CategorySummary[]> => {
  try {
    const response = await fetch(`${base}/authors`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return successData<CategorySummary[]>(
      await response.json(),
      isRecordArray,
      'Invalid author response.',
    );
  } catch {
    return [];
  }
};

export const getPublishers = async (): Promise<CategorySummary[]> => {
  try {
    const response = await fetch(`${base}/publishers`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return successData<CategorySummary[]>(
      await response.json(),
      isRecordArray,
      'Invalid publisher response.',
    );
  } catch {
    return [];
  }
};

export const getCategory = async (slug: string): Promise<CategorySummary | null> => {
  try {
    const response = await fetch(`${base}/categories/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return successData<CategorySummary>(
      await response.json(),
      isRecord,
      'Invalid category response.',
    );
  } catch {
    return null;
  }
};

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);