import { Prisma } from '@prisma/client';
import type { CatalogVariantCurrentFact } from '../catalog/catalog-read-model.js';
import { AppError } from '../../shared/errors/app-error.js';

export type CheckoutSnapshotItem = {
  variantId: bigint;
  quantity: number;
  current: CatalogVariantCurrentFact;
};

const primaryImageUrl = (variant: CatalogVariantCurrentFact): string | null => {
  const image =
    variant.product.images.find((candidate) => candidate.productVariantId === variant.id) ??
    variant.product.primaryImage ??
    null;
  return image?.url ?? null;
};

export const buildCheckoutOrderItemSnapshot = (
  item: CheckoutSnapshotItem,
): Prisma.OrderItemCreateWithoutOrderInput => {
  if (
    !item.current.product.title ||
    !item.current.product.slug ||
    !item.current.name ||
    !item.current.sku
  ) {
    throw new AppError(
      409,
      'CHECKOUT_SNAPSHOT_INCOMPLETE',
      'Khong the tao snapshot don hang day du.',
    );
  }
  const unitListPrice = new Prisma.Decimal(item.current.listPrice);
  const unitSalePrice =
    item.current.salePrice === null ? null : new Prisma.Decimal(item.current.salePrice);
  const unitEffectivePrice = new Prisma.Decimal(item.current.effectivePrice);
  const authorNames = item.current.product.authors
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((author) => author.name);
  return {
    variant: { connect: { id: item.variantId } },
    quantity: item.quantity,
    unitPrice: unitEffectivePrice,
    productTitleSnapshot: item.current.product.title,
    productSlugSnapshot: item.current.product.slug,
    variantNameSnapshot: item.current.name,
    skuSnapshot: item.current.sku,
    isbnSnapshot: item.current.isbn,
    languageSnapshot: item.current.product.language,
    coverImageUrlSnapshot: primaryImageUrl(item.current),
    primaryCategoryNameSnapshot: item.current.product.primaryCategory?.name ?? null,
    authorNamesSnapshot: JSON.stringify(authorNames),
    publisherNameSnapshot: item.current.product.publisher?.name ?? null,
    unitListPrice,
    unitSalePrice,
    unitEffectivePrice,
    lineTotal: unitEffectivePrice.mul(item.quantity),
  };
};
