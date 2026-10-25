import type { PrismaClient } from '@prisma/client';
import { effectiveVariantPrice, hasSalePrice } from '../modules/catalog/catalog-policy.js';
import { decimalNumber } from '../modules/catalog/catalog.utils.js';

type SnapshotPrisma = Pick<PrismaClient, 'productVariant'>;

export interface OrderItemSnapshotSeed {
  readonly productTitleSnapshot: string;
  readonly productSlugSnapshot: string;
  readonly variantNameSnapshot: string;
  readonly skuSnapshot: string;
  readonly isbnSnapshot: string | null;
  readonly languageSnapshot: string | null;
  readonly coverImageUrlSnapshot: string | null;
  readonly primaryCategoryNameSnapshot: string | null;
  readonly authorNamesSnapshot: string;
  readonly publisherNameSnapshot: string | null;
  readonly unitListPrice: number;
  readonly unitSalePrice: number | null;
  readonly unitEffectivePrice: number;
  readonly lineTotal: number;
}

export const serializeAuthorNamesSnapshot = (
  authorNames: readonly string[] | null,
): string | null => {
  if (authorNames === null) return null;
  return JSON.stringify([...authorNames].sort((a, b) => a.localeCompare(b, 'vi')));
};

export const buildOrderItemSnapshotSeed = async (
  prisma: SnapshotPrisma,
  variantId: bigint,
  quantity: number,
): Promise<OrderItemSnapshotSeed> => {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: {
      product: {
        include: {
          primaryCategory: true,
          publisher: true,
          images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
          authors: {
            include: { author: true },
            orderBy: [{ sortOrder: 'asc' }, { authorId: 'asc' }],
          },
        },
      },
    },
  });
  const effectivePrice = decimalNumber(effectiveVariantPrice(variant));
  const authorNames = variant.product.authors
    .filter(({ author }) => author.isActive && !author.deletedAt)
    .map(({ author }) => author.name);
  return {
    productTitleSnapshot: variant.product.name,
    productSlugSnapshot: variant.product.slug,
    variantNameSnapshot: variant.name,
    skuSnapshot: variant.sku,
    isbnSnapshot: variant.isbn,
    languageSnapshot: variant.product.language,
    coverImageUrlSnapshot: variant.product.images[0]?.url ?? null,
    primaryCategoryNameSnapshot: variant.product.primaryCategory?.name ?? null,
    authorNamesSnapshot: serializeAuthorNamesSnapshot(authorNames) ?? '[]',
    publisherNameSnapshot: variant.product.publisher?.name ?? null,
    unitListPrice: decimalNumber(variant.listPrice),
    unitSalePrice: hasSalePrice(variant) ? decimalNumber(variant.salePrice) : null,
    unitEffectivePrice: effectivePrice,
    lineTotal: effectivePrice * quantity,
  };
};
