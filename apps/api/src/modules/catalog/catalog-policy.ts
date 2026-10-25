import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';

export const publicationStates = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type PublicationState = (typeof publicationStates)[number];

export const isPublicationState = (value: unknown): value is PublicationState =>
  typeof value === 'string' && publicationStates.includes(value as PublicationState);

export const normalizePublicationState = (value: unknown): PublicationState => {
  if (isPublicationState(value)) return value;
  throw new AppError(400, 'CATALOG_PUBLICATION_STATE_INVALID', 'Trang thai xuat ban khong hop le.');
};

export const publicationStateFromLegacy = (input: {
  deletedAt?: Date | string | null;
  isActive?: boolean | null;
  publicationState?: string | null;
}): PublicationState => {
  if (input.deletedAt) return 'ARCHIVED';
  if (isPublicationState(input.publicationState)) return input.publicationState;
  return input.isActive === false ? 'INACTIVE' : 'ACTIVE';
};

export const isPublicPublicationState = (input: {
  deletedAt?: Date | string | null;
  isActive?: boolean | null;
  publicationState?: string | null;
}): boolean => publicationStateFromLegacy(input) === 'ACTIVE' && !input.deletedAt;

export const isPurchasablePublicationState = isPublicPublicationState;

export const isActiveMirrorForPublicationState = (state: PublicationState): boolean =>
  state === 'ACTIVE';

export const effectiveVariantPrice = (variant: { salePrice: Prisma.Decimal.Value }) =>
  new Prisma.Decimal(variant.salePrice);

export const hasSalePrice = (variant: {
  listPrice: Prisma.Decimal.Value;
  salePrice: Prisma.Decimal.Value;
}): boolean => !new Prisma.Decimal(variant.salePrice).equals(variant.listPrice);

export const availableQuantity = (
  inventory: {
    onHandQuantity: number;
    reservedQuantity: number;
  } | null,
): number => Math.max(0, (inventory?.onHandQuantity ?? 0) - (inventory?.reservedQuantity ?? 0));

export const stockStatus = (
  inventory: {
    onHandQuantity: number;
    reservedQuantity: number;
    lowStockThreshold?: number;
  } | null,
) => {
  const available = availableQuantity(inventory);
  return {
    onHandQuantity: inventory?.onHandQuantity ?? 0,
    reservedQuantity: inventory?.reservedQuantity ?? 0,
    availableQuantity: available,
    inStock: available > 0,
    lowStock:
      available > 0 &&
      inventory?.lowStockThreshold !== undefined &&
      available <= inventory.lowStockThreshold,
  };
};

export const variantUnavailableReason = (input: {
  productPublic: boolean;
  variantActive: boolean;
  availableQuantity: number;
  priceChanged?: boolean;
}): string | null => {
  if (!input.productPublic) return 'CATALOG_PRODUCT_NOT_PURCHASABLE';
  if (!input.variantActive) return 'CATALOG_VARIANT_INACTIVE';
  if (input.availableQuantity < 1) return 'INVENTORY_OUT_OF_STOCK';
  if (input.priceChanged) return 'CHECKOUT_PRICE_CHANGED';
  return null;
};

export const assertActivePrimaryCategory = (input: {
  publicationState: PublicationState;
  primaryCategoryId: bigint | null;
  categoryIds: readonly bigint[];
  primaryCategory?: { isActive: boolean; deletedAt: Date | null } | null;
}): void => {
  if (input.publicationState !== 'ACTIVE') return;
  if (!input.primaryCategoryId) {
    throw new AppError(
      400,
      'CATALOG_PRIMARY_CATEGORY_REQUIRED',
      'Sach ACTIVE phai co danh muc chinh.',
    );
  }
  if (!input.categoryIds.some((id) => id === input.primaryCategoryId)) {
    throw new AppError(
      400,
      'CATALOG_PRIMARY_CATEGORY_ASSIGNMENT_REQUIRED',
      'Danh muc chinh phai nam trong danh sach danh muc cua sach.',
    );
  }
  if (
    input.primaryCategory &&
    (!input.primaryCategory.isActive || input.primaryCategory.deletedAt)
  ) {
    throw new AppError(
      400,
      'CATALOG_PRIMARY_CATEGORY_INACTIVE',
      'Danh muc chinh phai dang hoat dong.',
    );
  }
};

export const resolveCreatePublicationState = (input: {
  publicationState?: string | undefined;
  isActive?: boolean | undefined;
}): PublicationState => {
  if (input.publicationState !== undefined)
    return normalizePublicationState(input.publicationState);
  return 'DRAFT';
};
