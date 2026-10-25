import type { Prisma, PrismaClient } from '@prisma/client';
import {
  effectiveVariantPrice,
  hasSalePrice,
  isPublicPublicationState,
  stockStatus,
  variantUnavailableReason,
  type PublicationState,
} from './catalog-policy.js';
import { decimalNumber } from './catalog.utils.js';

export const catalogReadModelInclude = {
  variants: {
    include: { inventory: true },
    orderBy: { id: 'asc' as const },
  },
  images: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  publisher: true,
  primaryCategory: true,
  authors: {
    include: { author: true },
    orderBy: [{ sortOrder: 'asc' as const }, { authorId: 'asc' as const }],
  },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProductRow = Prisma.ProductGetPayload<{
  include: typeof catalogReadModelInclude;
}>;
export type CatalogVariantRow = CatalogProductRow['variants'][number];

export type CatalogImageFact = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  productVariantId: string | null;
};

export type CatalogVariantFact = {
  id: string;
  productId: string;
  sku: string;
  isbn: string | null;
  name: string;
  coverType: string | null;
  isActive: boolean;
  listPrice: number;
  salePrice: number | null;
  effectivePrice: number;
  availability: {
    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    inStock: boolean;
    lowStock: boolean;
  };
  purchasable: boolean;
  unavailableReason: string | null;
};

export type CatalogProductFact = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  releaseDate: string | null;
  pageCount: number | null;
  language: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  isNew: boolean;
  isFeatured: boolean;
  publicationState: PublicationState;
  visible: boolean;
  purchasable: boolean;
  primaryCategory: { id: string; name: string; slug: string } | null;
  publisher: { id: string; name: string; slug: string } | null;
  authors: Array<{ id: string; name: string; slug: string; sortOrder: number }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  variants: CatalogVariantFact[];
  images: CatalogImageFact[];
  primaryImage: CatalogImageFact | null;
  seoTitle: string | null;
  seoDescription: string | null;
  minPrice: number;
  maxPrice: number;
  availability: {
    availableQuantity: number;
    inStock: boolean;
    lowStock: boolean;
  };
};

export type CatalogVariantCurrentFact = CatalogVariantFact & {
  product: CatalogProductFact;
};

const imageFact = (image: CatalogProductRow['images'][number]): CatalogImageFact => ({
  id: image.id.toString(),
  url: image.url,
  altText: image.altText,
  sortOrder: image.sortOrder,
  isPrimary: image.isPrimary,
  productVariantId: image.productVariantId?.toString() ?? null,
});

const primaryImageFact = (product: CatalogProductRow): CatalogImageFact | null => {
  const image =
    product.images.find(
      (candidate) => candidate.isPrimary && candidate.productVariantId === null,
    ) ??
    product.images[0] ??
    null;
  return image ? imageFact(image) : null;
};

const variantFact = (
  product: CatalogProductRow,
  variant: CatalogVariantRow,
): CatalogVariantFact => {
  const availability = stockStatus(variant.inventory);
  const productPublic = isPublicPublicationState(product);
  const effectivePrice = effectiveVariantPrice(variant);
  const salePrice = hasSalePrice(variant) ? decimalNumber(variant.salePrice) : null;
  const unavailableReason = variantUnavailableReason({
    productPublic,
    variantActive: variant.isActive,
    availableQuantity: availability.availableQuantity,
  });
  return {
    id: variant.id.toString(),
    productId: product.id.toString(),
    sku: variant.sku,
    isbn: variant.isbn,
    name: variant.name,
    coverType: variant.coverType,
    isActive: variant.isActive,
    listPrice: decimalNumber(variant.listPrice),
    salePrice,
    effectivePrice: decimalNumber(effectivePrice),
    availability,
    purchasable: unavailableReason === null,
    unavailableReason,
  };
};

export const productFactFromRow = (product: CatalogProductRow): CatalogProductFact => {
  const visible = isPublicPublicationState(product);
  const variants = product.variants.map((variant) => variantFact(product, variant));
  const effectivePrices = variants.map((variant) => variant.effectivePrice);
  const availableQuantity = variants.reduce(
    (total, variant) => total + variant.availability.availableQuantity,
    0,
  );
  return {
    id: product.id.toString(),
    title: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    releaseDate: product.releaseDate?.toISOString().slice(0, 10) ?? null,
    pageCount: product.pageCount,
    language: product.language,
    dimensions: product.dimensions,
    weightGrams: product.weightGrams,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    publicationState: product.publicationState as PublicationState,
    visible,
    purchasable: variants.some((variant) => variant.purchasable),
    primaryCategory:
      product.primaryCategory?.isActive && !product.primaryCategory.deletedAt
        ? {
            id: product.primaryCategory.id.toString(),
            name: product.primaryCategory.name,
            slug: product.primaryCategory.slug,
          }
        : null,
    publisher:
      product.publisher?.isActive && !product.publisher.deletedAt
        ? {
            id: product.publisher.id.toString(),
            name: product.publisher.name,
            slug: product.publisher.slug,
          }
        : null,
    authors: product.authors
      .filter(({ author }) => author.isActive && !author.deletedAt)
      .map(({ author, sortOrder }) => ({
        id: author.id.toString(),
        name: author.name,
        slug: author.slug,
        sortOrder,
      })),
    categories: product.categories
      .filter(({ category }) => category.isActive && !category.deletedAt)
      .map(({ category }) => ({
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
      })),
    variants,
    images: product.images.map(imageFact),
    primaryImage: primaryImageFact(product),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    minPrice: effectivePrices.length ? Math.min(...effectivePrices) : 0,
    maxPrice: effectivePrices.length ? Math.max(...effectivePrices) : 0,
    availability: {
      availableQuantity,
      inStock: availableQuantity > 0,
      lowStock: variants.some((variant) => variant.availability.lowStock),
    },
  };
};

type CatalogReader = Pick<PrismaClient, 'product' | 'productVariant'> | Prisma.TransactionClient;

export class CatalogReadModelService {
  constructor(private readonly prisma: CatalogReader) {}

  async publicProductBySlug(slug: string): Promise<CatalogProductFact | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        publicationState: 'ACTIVE',
        deletedAt: null,
        variants: { some: { isActive: true } },
      },
      include: catalogReadModelInclude,
    });
    return product ? productFactFromRow(product) : null;
  }

  async productsByIds(ids: readonly bigint[]): Promise<CatalogProductFact[]> {
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: [...ids] } },
      include: catalogReadModelInclude,
    });
    const byId = new Map(
      products.map((product) => [product.id.toString(), productFactFromRow(product)]),
    );
    return ids
      .map((id) => byId.get(id.toString()))
      .filter((item): item is CatalogProductFact => Boolean(item));
  }

  async variantCurrentFact(variantId: bigint): Promise<CatalogVariantCurrentFact | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { include: catalogReadModelInclude } },
    });
    if (!variant) return null;
    const product = productFactFromRow(variant.product);
    const currentVariant = product.variants.find((item) => item.id === variant.id.toString());
    return currentVariant ? { ...currentVariant, product } : null;
  }
}
