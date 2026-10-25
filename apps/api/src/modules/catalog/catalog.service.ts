import { Prisma, type PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import type { AuthPrincipal } from '../../middlewares/authenticate.js';
import { hasPermission } from '../rbac/permissions.js';
import type { RequestContext } from '../auth/auth.service.js';
import type {
  ImageAttachInput,
  ProductInput,
  ProductPatchInput,
  VariantInput,
} from './catalog.schema.js';
import {
  decimalNumber,
  normalizeIsbn,
  normalizeWhitespace,
  parseId,
  slugify,
} from './catalog.utils.js';
import {
  assertActivePrimaryCategory,
  isActiveMirrorForPublicationState,
  normalizePublicationState,
  publicationStateFromLegacy,
  resolveCreatePublicationState,
  type PublicationState,
} from './catalog-policy.js';
import {
  CatalogReadModelService,
  catalogReadModelInclude,
  productFactFromRow,
  type CatalogProductFact,
} from './catalog-read-model.js';
import type { ProductImageAdapter, UploadedProductAsset } from './product-image.service.js';

const publicInclude = {
  variants: {
    where: { isActive: true },
    include: { inventory: true },
    orderBy: { id: 'asc' as const },
  },
  images: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  publisher: true,
  primaryCategory: true,
  authors: { include: { author: true }, orderBy: { sortOrder: 'asc' as const } },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;
const adminInclude = {
  ...publicInclude,
  variants: { include: { inventory: true }, orderBy: { id: 'asc' as const } },
} satisfies Prisma.ProductInclude;
type FullProduct = Prisma.ProductGetPayload<{ include: typeof publicInclude }>;

const publicDtoFromFact = (product: CatalogProductFact) => ({
  id: product.id,
  name: product.title,
  title: product.title,
  slug: product.slug,
  shortDescription: product.shortDescription,
  description: product.description,
  releaseDate: product.releaseDate,
  pageCount: product.pageCount,
  language: product.language,
  dimensions: product.dimensions,
  weightGrams: product.weightGrams,
  isNew: product.isNew,
  isFeatured: product.isFeatured,
  publicationState: product.publicationState,
  visible: product.visible,
  purchasable: product.purchasable,
  primaryCategory: product.primaryCategory,
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  minPrice: product.minPrice,
  maxPrice: product.maxPrice,
  availability: product.availability,
  variants: product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    isbn: variant.isbn,
    name: variant.name,
    coverType: variant.coverType,
    listPrice: variant.listPrice,
    salePrice: variant.salePrice ?? variant.effectivePrice,
    effectivePrice: variant.effectivePrice,
    isActive: variant.isActive,
    purchasable: variant.purchasable,
    unavailableReason: variant.unavailableReason,
    availability: variant.availability,
  })),
  images: product.images,
  primaryImage: product.primaryImage,
  publisher: product.publisher,
  authors: product.authors,
  categories: product.categories,
});

const imageDto = (image: FullProduct['images'][number]) => ({
  id: image.id.toString(),
  url: image.url,
  altText: image.altText,
  sortOrder: image.sortOrder,
  isPrimary: image.isPrimary,
  productVariantId: image.productVariantId?.toString() ?? null,
});
const variantAvailability = (variant: FullProduct['variants'][number]) => {
  const onHand = variant.inventory?.onHandQuantity ?? 0;
  const reserved = variant.inventory?.reservedQuantity ?? 0;
  const availableQuantity = Math.max(0, onHand - reserved);
  return {
    availableQuantity,
    inStock: availableQuantity > 0,
    lowStock:
      availableQuantity > 0 && availableQuantity <= (variant.inventory?.lowStockThreshold ?? 0),
  };
};
const publicDto = (product: FullProduct) => {
  const variants = product.variants.map((variant) => ({
    id: variant.id.toString(),
    sku: variant.sku,
    isbn: variant.isbn,
    name: variant.name,
    coverType: variant.coverType,
    listPrice: decimalNumber(variant.listPrice),
    salePrice: decimalNumber(variant.salePrice),
    isActive: variant.isActive,
    availability: variantAvailability(variant),
  }));
  const prices = variants.map((variant) => variant.salePrice);
  const availableQuantity = variants.reduce(
    (total, variant) => total + variant.availability.availableQuantity,
    0,
  );
  return {
    id: product.id.toString(),
    name: product.name,
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
    publicationState: publicationStateFromLegacy(product),
    primaryCategory:
      product.primaryCategory?.isActive && !product.primaryCategory.deletedAt
        ? {
            id: product.primaryCategory.id.toString(),
            name: product.primaryCategory.name,
            slug: product.primaryCategory.slug,
          }
        : null,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    availability: {
      availableQuantity,
      inStock: availableQuantity > 0,
      lowStock:
        availableQuantity > 0 &&
        variants.some((variant) => variant.availability.lowStock && variant.availability.inStock),
    },
    variants,
    images: product.images.map(imageDto),
    primaryImage: product.images.find((image) => image.isPrimary && image.productVariantId === null)
      ? imageDto(
          product.images.find((image) => image.isPrimary && image.productVariantId === null)!,
        )
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
  };
};

export class CatalogService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly imageAdapter?: ProductImageAdapter,
  ) {}

  private assertManage(principal: AuthPrincipal): void {
    if (!hasPermission(principal.role, 'PRODUCT_MANAGE'))
      throw new AppError(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền quản lý catalog.');
  }
  private async audit(
    tx: Prisma.TransactionClient,
    principal: AuthPrincipal,
    context: RequestContext,
    action: string,
    entityType: string,
    entityId: bigint,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action,
        entityType,
        entityId: entityId.toString(),
        requestId: context.requestId ?? null,
        ip: context.ip ?? null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }
  private conflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = JSON.stringify(error.meta?.target ?? '').toLowerCase();
      if (target.includes('sku'))
        throw new AppError(409, 'CATALOG_SKU_CONFLICT', 'SKU đã được sử dụng.');
      if (target.includes('isbn'))
        throw new AppError(409, 'CATALOG_ISBN_CONFLICT', 'ISBN đã được sử dụng.');
      throw new AppError(409, 'CATALOG_SLUG_CONFLICT', 'Slug đã được sử dụng.');
    }
    throw error;
  }
  private async reserveSlug(
    tx: Prisma.TransactionClient,
    type: string,
    requested: string,
    resourceId: bigint,
    allowSuffix = true,
  ): Promise<string> {
    const base = slugify(requested);
    if (!base) throw new AppError(400, 'VALIDATION_ERROR', 'Không thể tạo slug hợp lệ.');
    for (let suffix = 1; suffix <= (allowSuffix ? 1000 : 1); suffix += 1) {
      const slug = suffix === 1 ? base : `${base.slice(0, 250)}-${suffix}`;
      try {
        await tx.slugReservation.create({ data: { resourceType: type, slug, resourceId } });
        return slug;
      } catch (error: unknown) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'))
          throw error;
      }
    }
    throw new AppError(409, 'CATALOG_SLUG_CONFLICT', 'Không thể cấp slug.');
  }

  private listConditions(
    query: {
      q?: string | undefined;
      category?: string | undefined;
      author?: string | undefined;
      publisher?: string | undefined;
      isNew?: string | undefined;
      isFeatured?: string | undefined;
      inStock?: string | undefined;
      minPrice?: number | undefined;
      maxPrice?: number | undefined;
      sort: string;
      page: number;
      pageSize: number;
    },
    q: string | undefined,
  ): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`p.[publicationState] = 'ACTIVE'`,
      Prisma.sql`p.[deletedAt] IS NULL`,
      Prisma.sql`price.[minPrice] IS NOT NULL`,
    ];
    if (query.isNew) conditions.push(Prisma.sql`p.[isNew] = ${query.isNew === 'true'}`);
    if (query.isFeatured)
      conditions.push(Prisma.sql`p.[isFeatured] = ${query.isFeatured === 'true'}`);
    if (query.minPrice !== undefined)
      conditions.push(Prisma.sql`price.[minPrice] >= ${query.minPrice}`);
    if (query.maxPrice !== undefined)
      conditions.push(Prisma.sql`price.[minPrice] <= ${query.maxPrice}`);
    if (query.inStock === 'true')
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM [dbo].[ProductVariant] iv JOIN [dbo].[Inventory] inv ON inv.productVariantId=iv.id WHERE iv.productId=p.id AND iv.isActive=1 AND inv.onHandQuantity > inv.reservedQuantity)`,
      );
    if (query.inStock === 'false')
      conditions.push(
        Prisma.sql`NOT EXISTS (SELECT 1 FROM [dbo].[ProductVariant] iv JOIN [dbo].[Inventory] inv ON inv.productVariantId=iv.id WHERE iv.productId=p.id AND iv.isActive=1 AND inv.onHandQuantity > inv.reservedQuantity)`,
      );
    if (query.category)
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM [dbo].[ProductCategory] pc JOIN [dbo].[Category] c ON c.id=pc.categoryId WHERE pc.productId=p.id AND c.slug=${query.category} AND c.isActive=1 AND c.deletedAt IS NULL)`,
      );
    if (query.author)
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM [dbo].[ProductAuthor] pa JOIN [dbo].[Author] a ON a.id=pa.authorId WHERE pa.productId=p.id AND a.slug=${query.author} AND a.isActive=1 AND a.deletedAt IS NULL)`,
      );
    if (query.publisher)
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM [dbo].[Publisher] pub WHERE pub.id=p.publisherId AND pub.slug=${query.publisher} AND pub.isActive=1 AND pub.deletedAt IS NULL)`,
      );
    if (q)
      conditions.push(
        Prisma.sql`(p.name COLLATE Vietnamese_CI_AI LIKE ${`%${escapeLike(q)}%`} OR EXISTS (SELECT 1 FROM [dbo].[ProductVariant] sv WHERE sv.productId=p.id AND sv.isActive=1 AND (sv.isbn=${normalizeIsbnSearch(q)} OR sv.sku COLLATE Vietnamese_CI_AI LIKE ${`%${escapeLike(q)}%`})) OR EXISTS (SELECT 1 FROM [dbo].[ProductAuthor] spa JOIN [dbo].[Author] sa ON sa.id=spa.authorId WHERE spa.productId=p.id AND sa.name COLLATE Vietnamese_CI_AI LIKE ${`%${escapeLike(q)}%`}) OR EXISTS (SELECT 1 FROM [dbo].[ProductCategory] spc JOIN [dbo].[Category] sc ON sc.id=spc.categoryId WHERE spc.productId=p.id AND sc.name COLLATE Vietnamese_CI_AI LIKE ${`%${escapeLike(q)}%`}) OR EXISTS (SELECT 1 FROM [dbo].[Publisher] sp WHERE sp.id=p.publisherId AND sp.name COLLATE Vietnamese_CI_AI LIKE ${`%${escapeLike(q)}%`}))`,
      );
    return conditions;
  }

  private async publicProductIds(
    query: {
      q?: string | undefined;
      category?: string | undefined;
      author?: string | undefined;
      publisher?: string | undefined;
      isNew?: string | undefined;
      isFeatured?: string | undefined;
      inStock?: string | undefined;
      minPrice?: number | undefined;
      maxPrice?: number | undefined;
      sort: string;
      page: number;
      pageSize: number;
    },
    q: string | undefined,
  ): Promise<{ total: number; ids: bigint[] }> {
    const conditions = this.listConditions(query, q);
    const orderBy =
      query.sort === 'price_desc'
        ? Prisma.sql`price.minPrice DESC, p.id ASC`
        : query.sort === 'price_asc'
          ? Prisma.sql`price.minPrice ASC, p.id ASC`
          : query.sort === 'name_asc'
            ? Prisma.sql`p.name ASC, p.id ASC`
            : query.sort === 'name_desc'
              ? Prisma.sql`p.name DESC, p.id ASC`
              : Prisma.sql`p.createdAt DESC, p.id DESC`;
    const offset = (query.page - 1) * query.pageSize;
    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: number }>>(
        Prisma.sql`SELECT COUNT_BIG(1) AS total FROM [dbo].[Product] p CROSS APPLY (SELECT MIN(v.salePrice) AS minPrice FROM [dbo].[ProductVariant] v WHERE v.productId=p.id AND v.isActive=1) price WHERE ${Prisma.join(conditions, ' AND ')}`,
      ),
      this.prisma.$queryRaw<Array<{ id: bigint }>>(
        Prisma.sql`SELECT p.id FROM [dbo].[Product] p CROSS APPLY (SELECT MIN(v.salePrice) AS minPrice FROM [dbo].[ProductVariant] v WHERE v.productId=p.id AND v.isActive=1) price WHERE ${Prisma.join(conditions, ' AND ')} ORDER BY ${orderBy} OFFSET ${offset} ROWS FETCH NEXT ${query.pageSize} ROWS ONLY`,
      ),
    ]);
    return {
      total: Number(countRows[0]?.total ?? 0),
      ids: rows.map((row) => row.id),
    };
  }

  async publicProducts(query: {
    q?: string | undefined;
    category?: string | undefined;
    author?: string | undefined;
    publisher?: string | undefined;
    isNew?: string | undefined;
    isFeatured?: string | undefined;
    inStock?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sort: string;
    page: number;
    pageSize: number;
  }) {
    const q = query.q ? normalizeWhitespace(query.q) : undefined;
    const { total, ids } = await this.publicProductIds(query, q);
    const rows = await new CatalogReadModelService(this.prisma).productsByIds(ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return {
      data: ids
        .map((id) => byId.get(id.toString()))
        .filter((row): row is CatalogProductFact => Boolean(row))
        .map(publicDtoFromFact),
      meta: { page: query.page, pageSize: query.pageSize, total },
    };
  }
  async publicProduct(slug: string) {
    const product = await new CatalogReadModelService(this.prisma).publicProductBySlug(slug);
    if (!product) throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    return { ...publicDtoFromFact(product), relatedProducts: await this.relatedProducts(product) };
  }
  private async relatedProducts(product: CatalogProductFact) {
    const chosen = new Map<string, CatalogProductFact>();
    const load = async (where: Prisma.ProductWhereInput) => {
      if (chosen.size >= 8) return;
      const rows = await this.prisma.product.findMany({
        where,
        include: catalogReadModelInclude,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        take: 12,
      });
      rows
        .map(productFactFromRow)
        .sort((a, b) => Number(b.availability.inStock) - Number(a.availability.inStock))
        .forEach((row) => {
          if (chosen.size < 8) chosen.set(row.id, row);
        });
    };
    const baseWhere: Prisma.ProductWhereInput = {
      id: { not: BigInt(product.id) },
      publicationState: 'ACTIVE',
      deletedAt: null,
      variants: { some: { isActive: true } },
    };
    const categoryIds = product.categories.map((item) => BigInt(item.id));
    if (categoryIds.length)
      await load({
        ...baseWhere,
        categories: { some: { categoryId: { in: categoryIds } } },
      });
    const authorIds = product.authors.map((item) => BigInt(item.id));
    if (chosen.size < 4 && authorIds.length)
      await load({
        ...baseWhere,
        id: { notIn: [BigInt(product.id), ...[...chosen.keys()].map(BigInt)] },
        authors: { some: { authorId: { in: authorIds } } },
      });
    return [...chosen.values()].map(publicDtoFromFact);
  }

  async suggestions(q: string) {
    const result = await this.publicProducts({ q, sort: 'newest', page: 1, pageSize: 5 });
    return result.data.map(({ id, name, slug, primaryImage, minPrice, maxPrice }) => ({
      id,
      name,
      slug,
      primaryImage,
      minPrice,
      maxPrice,
    }));
  }
  async publicTaxonomy(kind: 'category' | 'author' | 'publisher') {
    const publicProductWhere = {
      publicationState: 'ACTIVE',
      isActive: true,
      deletedAt: null,
      variants: { some: { isActive: true } },
    } as const;
    const rows =
      kind === 'category'
        ? await this.prisma.category.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              products: { some: { product: publicProductWhere } },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          })
        : kind === 'author'
          ? await this.prisma.author.findMany({
              where: {
                isActive: true,
                deletedAt: null,
                products: { some: { product: publicProductWhere } },
              },
              orderBy: { name: 'asc' },
            })
          : await this.prisma.publisher.findMany({
              where: {
                isActive: true,
                deletedAt: null,
                products: { some: publicProductWhere },
              },
              orderBy: { name: 'asc' },
            });
    return rows.map((item) => ({
      id: item.id.toString(),
      name: item.name,
      slug: item.slug,
    }));
  }
  async publicTaxonomyDetail(kind: 'category' | 'author' | 'publisher', slug: string) {
    const publicProductWhere = {
      publicationState: 'ACTIVE',
      isActive: true,
      deletedAt: null,
      variants: { some: { isActive: true } },
    } as const;
    const item =
      kind === 'category'
        ? await this.prisma.category.findFirst({
            where: {
              slug,
              isActive: true,
              deletedAt: null,
              products: { some: { product: publicProductWhere } },
            },
          })
        : kind === 'author'
          ? await this.prisma.author.findFirst({
              where: {
                slug,
                isActive: true,
                deletedAt: null,
                products: { some: { product: publicProductWhere } },
              },
            })
          : await this.prisma.publisher.findFirst({
              where: {
                slug,
                isActive: true,
                deletedAt: null,
                products: { some: publicProductWhere },
              },
            });
    if (!item)
      throw new AppError(
        404,
        `CATALOG_${kind.toUpperCase()}_NOT_FOUND`,
        'Khong tim thay taxonomy.',
      );
    return {
      id: item.id.toString(),
      name: item.name,
      slug: item.slug,
      description: 'bio' in item ? item.bio : item.description,
    };
  }
  async adminTaxonomy(kind: 'category' | 'author' | 'publisher') {
    const rows =
      kind === 'category'
        ? await this.prisma.category.findMany({ orderBy: { createdAt: 'desc' } })
        : kind === 'author'
          ? await this.prisma.author.findMany({ orderBy: { createdAt: 'desc' } })
          : await this.prisma.publisher.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((item) => ({
      ...item,
      id: item.id.toString(),
      deletedAt: item.deletedAt?.toISOString() ?? null,
    }));
  }
  async createTaxonomy(
    kind: 'category' | 'author' | 'publisher',
    input: {
      name: string;
      slug?: string;
      description?: string | null;
      bio?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    },
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    return this.prisma.$transaction(async (tx) => {
      const model = tx[kind] as unknown as { create(args: object): Promise<{ id: bigint }> };
      const temporarySlug = `pending-${crypto.randomUUID()}`;
      const data =
        kind === 'author'
          ? {
              name: normalizeWhitespace(input.name),
              slug: temporarySlug,
              bio: input.bio,
              isActive: input.isActive,
            }
          : kind === 'category'
            ? {
                name: normalizeWhitespace(input.name),
                slug: temporarySlug,
                description: input.description,
                isActive: input.isActive,
                sortOrder: input.sortOrder,
              }
            : {
                name: normalizeWhitespace(input.name),
                slug: temporarySlug,
                description: input.description,
                isActive: input.isActive,
              };
      const created = await model.create({ data });
      const type = kind.toUpperCase();
      const slug = await this.reserveSlug(
        tx,
        type,
        input.slug ?? input.name,
        created.id,
        input.slug === undefined,
      );
      await (tx[kind] as unknown as { update(args: object): Promise<unknown> }).update({
        where: { id: created.id },
        data: { slug },
      });
      await this.audit(
        tx,
        principal,
        context,
        `CATALOG_${type}_CREATED`,
        type[0] + type.slice(1).toLowerCase(),
        created.id,
      );
      return { id: created.id.toString(), slug };
    });
  }
  async patchTaxonomy(
    kind: 'category' | 'author' | 'publisher',
    idValue: string,
    input: Record<string, unknown>,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const id = parseId(idValue);
    return this.prisma.$transaction(async (tx) => {
      const model = tx[kind] as unknown as {
        findUnique(args: object): Promise<{ id: bigint; slug: string } | null>;
        update(args: object): Promise<{ id: bigint; slug: string }>;
      };
      const current = await model.findUnique({ where: { id } });
      if (!current)
        throw new AppError(
          404,
          `CATALOG_${kind.toUpperCase()}_NOT_FOUND`,
          'Không tìm thấy danh mục.',
        );
      const requestedSlug = typeof input.slug === 'string' ? input.slug : undefined;
      const slug =
        requestedSlug && slugify(requestedSlug) !== current.slug
          ? await this.reserveSlug(tx, kind.toUpperCase(), requestedSlug, id, false)
          : current.slug;
      if (kind === 'category' && input.isActive === false)
        await this.assertCategoryNotPrimaryForActiveProduct(tx, id);
      const updated = await model.update({
        where: { id },
        data: {
          ...input,
          slug,
          ...(typeof input.name === 'string' ? { name: normalizeWhitespace(input.name) } : {}),
        },
      });
      await this.audit(tx, principal, context, `CATALOG_${kind.toUpperCase()}_UPDATED`, kind, id);
      return { id: updated.id.toString(), slug: updated.slug };
    });
  }

  async adminProducts(principal: AuthPrincipal, query: { page: number; pageSize: number }) {
    const [total, rows] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.findMany({
        include: adminInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const data = rows.map((p) => ({
      ...publicDto({ ...p, variants: p.variants.filter(() => true) }),
      isActive: p.isActive,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      variants: p.variants.map((v) => ({
        id: v.id.toString(),
        sku: v.sku,
        isbn: v.isbn,
        name: v.name,
        coverType: v.coverType,
        listPrice: decimalNumber(v.listPrice),
        salePrice: decimalNumber(v.salePrice),
        isActive: v.isActive,
        inventory: v.inventory
          ? {
              onHandQuantity: v.inventory.onHandQuantity,
              reservedQuantity: v.inventory.reservedQuantity,
              availableQuantity: Math.max(
                0,
                v.inventory.onHandQuantity - v.inventory.reservedQuantity,
              ),
            }
          : null,
        ...(hasPermission(principal.role, 'PRODUCT_MANAGE')
          ? { costPrice: decimalNumber(v.costPrice) }
          : {}),
      })),
    }));
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }
  async adminProduct(idValue: string, principal: AuthPrincipal) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseId(idValue) },
      include: adminInclude,
    });
    if (!product) throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    return {
      ...publicDto(product),
      isActive: product.isActive,
      deletedAt: product.deletedAt?.toISOString() ?? null,
      variants: product.variants.map((v) => ({
        id: v.id.toString(),
        sku: v.sku,
        isbn: v.isbn,
        name: v.name,
        coverType: v.coverType,
        listPrice: decimalNumber(v.listPrice),
        salePrice: decimalNumber(v.salePrice),
        isActive: v.isActive,
        inventory: v.inventory
          ? {
              onHandQuantity: v.inventory.onHandQuantity,
              reservedQuantity: v.inventory.reservedQuantity,
              availableQuantity: Math.max(
                0,
                v.inventory.onHandQuantity - v.inventory.reservedQuantity,
              ),
            }
          : null,
        ...(hasPermission(principal.role, 'PRODUCT_MANAGE')
          ? { costPrice: decimalNumber(v.costPrice) }
          : {}),
      })),
    };
  }
  async createProduct(input: ProductInput, principal: AuthPrincipal, context: RequestContext) {
    this.assertManage(principal);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateRelations(tx, input);
        const publicationState = resolveCreatePublicationState(input);
        const primaryCategoryId = input.primaryCategoryId ? parseId(input.primaryCategoryId) : null;
        await this.assertPrimaryCategoryInvariant(tx, {
          publicationState,
          primaryCategoryId,
          categoryIds: input.categoryIds.map(parseId),
        });
        const product = await tx.product.create({
          data: {
            name: normalizeWhitespace(input.name),
            slug: `pending-${crypto.randomUUID()}`,
            ...(input.shortDescription !== undefined
              ? { shortDescription: input.shortDescription }
              : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
            ...(input.pageCount !== undefined ? { pageCount: input.pageCount } : {}),
            ...(input.language !== undefined ? { language: input.language } : {}),
            ...(input.dimensions !== undefined ? { dimensions: input.dimensions } : {}),
            ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
            publisherId: input.publisherId ? parseId(input.publisherId) : null,
            primaryCategoryId,
            ...(input.isNew !== undefined ? { isNew: input.isNew } : {}),
            ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
            publicationState,
            isActive: isActiveMirrorForPublicationState(publicationState),
            ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
            ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
          },
        });
        const slug = await this.reserveSlug(
          tx,
          'PRODUCT',
          input.slug ?? input.name,
          product.id,
          input.slug === undefined,
        );
        await tx.product.update({
          where: { id: product.id },
          data: {
            slug,
            categories: { create: input.categoryIds.map((id) => ({ categoryId: parseId(id) })) },
            authors: {
              create: input.authorIds.map((id, sortOrder) => ({
                authorId: parseId(id),
                sortOrder,
              })),
            },
          },
        });
        await this.audit(tx, principal, context, 'CATALOG_PRODUCT_CREATED', 'Product', product.id);
        return { id: product.id.toString(), slug };
      });
    } catch (e) {
      this.conflict(e);
    }
  }
  private async validateRelations(
    tx: Prisma.TransactionClient,
    input: {
      publisherId?: string | null | undefined;
      primaryCategoryId?: string | null | undefined;
      categoryIds?: string[] | undefined;
      authorIds?: string[] | undefined;
    },
  ) {
    if (
      input.publisherId &&
      (await tx.publisher.count({ where: { id: parseId(input.publisherId), deletedAt: null } })) !==
        1
    )
      throw new AppError(400, 'CATALOG_RELATION_INVALID', 'Publisher không hợp lệ.');
    if (
      input.categoryIds &&
      (await tx.category.count({
        where: { id: { in: input.categoryIds.map(parseId) }, deletedAt: null },
      })) !== input.categoryIds.length
    )
      throw new AppError(400, 'CATALOG_RELATION_INVALID', 'Category không hợp lệ.');
    if (
      input.primaryCategoryId &&
      (await tx.category.count({
        where: { id: parseId(input.primaryCategoryId), deletedAt: null },
      })) !== 1
    )
      throw new AppError(400, 'CATALOG_RELATION_INVALID', 'Primary category khong hop le.');
    if (
      input.authorIds &&
      (await tx.author.count({
        where: { id: { in: input.authorIds.map(parseId) }, deletedAt: null },
      })) !== input.authorIds.length
    )
      throw new AppError(400, 'CATALOG_RELATION_INVALID', 'Author không hợp lệ.');
  }
  private async assertPrimaryCategoryInvariant(
    tx: Prisma.TransactionClient,
    input: {
      publicationState: PublicationState;
      primaryCategoryId: bigint | null;
      categoryIds: bigint[];
    },
  ) {
    const primaryCategory = input.primaryCategoryId
      ? await tx.category.findUnique({ where: { id: input.primaryCategoryId } })
      : null;
    assertActivePrimaryCategory({ ...input, primaryCategory });
  }
  private async assertCategoryNotPrimaryForActiveProduct(
    tx: Prisma.TransactionClient,
    categoryId: bigint,
  ) {
    const activePrimaryCount = await tx.product.count({
      where: { primaryCategoryId: categoryId, publicationState: 'ACTIVE', deletedAt: null },
    });
    if (activePrimaryCount > 0) {
      throw new AppError(
        409,
        'CATALOG_PRIMARY_CATEGORY_IN_USE',
        'Danh muc chinh dang duoc gan cho sach ACTIVE.',
      );
    }
  }
  async patchProduct(
    idValue: string,
    input: ProductPatchInput,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const id = parseId(idValue);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.product.findUnique({ where: { id } });
        if (!current)
          throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
        await this.validateRelations(tx, {
          publisherId: input.publisherId,
          primaryCategoryId: input.primaryCategoryId,
          categoryIds: input.categoryIds,
          authorIds: input.authorRelations?.map((item) => item.authorId),
        });
        let slug = current.slug;
        if (input.slug && slugify(input.slug) !== current.slug)
          slug = await this.reserveSlug(tx, 'PRODUCT', input.slug, id, false);
        const nextPublicationState =
          input.publicationState !== undefined
            ? normalizePublicationState(input.publicationState)
            : publicationStateFromLegacy(current);
        const existingCategoryIds =
          input.categoryIds === undefined
            ? (
                await tx.productCategory.findMany({
                  where: { productId: id },
                  select: { categoryId: true },
                })
              ).map((item) => item.categoryId)
            : input.categoryIds.map(parseId);
        const nextPrimaryCategoryId =
          input.primaryCategoryId !== undefined
            ? input.primaryCategoryId
              ? parseId(input.primaryCategoryId)
              : null
            : current.primaryCategoryId;
        await this.assertPrimaryCategoryInvariant(tx, {
          publicationState: nextPublicationState,
          primaryCategoryId: nextPrimaryCategoryId,
          categoryIds: existingCategoryIds,
        });
        const {
          categoryIds,
          authorRelations,
          publisherId,
          primaryCategoryId,
          releaseDate,
          ...scalars
        } = input;
        const updateData: Prisma.ProductUncheckedUpdateInput = {
          ...scalars,
          slug,
          ...(publisherId !== undefined
            ? { publisherId: publisherId ? parseId(publisherId) : null }
            : {}),
          ...(primaryCategoryId !== undefined
            ? { primaryCategoryId: primaryCategoryId ? parseId(primaryCategoryId) : null }
            : {}),
          ...(releaseDate !== undefined
            ? { releaseDate: releaseDate ? new Date(releaseDate) : null }
            : {}),
          publicationState: nextPublicationState,
          isActive: isActiveMirrorForPublicationState(nextPublicationState),
        } as Prisma.ProductUncheckedUpdateInput;
        await tx.product.update({
          where: { id },
          data: updateData,
        });
        if (categoryIds) {
          await tx.productCategory.deleteMany({ where: { productId: id } });
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              productId: id,
              categoryId: parseId(categoryId),
            })),
          });
        }
        if (authorRelations) {
          await tx.productAuthor.deleteMany({ where: { productId: id } });
          await tx.productAuthor.createMany({
            data: authorRelations.map((item) => ({
              productId: id,
              authorId: parseId(item.authorId),
              sortOrder: item.sortOrder,
            })),
          });
        }
        await this.audit(tx, principal, context, 'CATALOG_PRODUCT_UPDATED', 'Product', id, {
          fields: Object.keys(input).filter((field) => field !== 'description'),
        });
        return { id: id.toString(), slug };
      });
    } catch (error) {
      this.conflict(error);
    }
  }
  async createVariant(
    productId: string,
    input: VariantInput,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const id = parseId(productId);
    if ((await this.prisma.product.count({ where: { id, deletedAt: null } })) !== 1)
      throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    try {
      const variant = await this.prisma.$transaction(async (tx) => {
        const created = await tx.productVariant.create({
          data: {
            productId: id,
            sku: input.sku,
            isbn: normalizeIsbn(input.isbn),
            name: input.name,
            ...(input.coverType !== undefined ? { coverType: input.coverType } : {}),
            costPrice: input.costPrice,
            listPrice: input.listPrice,
            salePrice: input.salePrice,
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        });
        await tx.inventory.create({
          data: { productVariantId: created.id, onHandQuantity: 0, reservedQuantity: 0 },
        });
        await this.audit(
          tx,
          principal,
          context,
          'CATALOG_VARIANT_CREATED',
          'ProductVariant',
          created.id,
        );
        return created;
      });
      return { id: variant.id.toString() };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        if ((await this.prisma.productVariant.count({ where: { sku: input.sku } })) > 0)
          throw new AppError(409, 'CATALOG_SKU_CONFLICT', 'SKU đã được sử dụng.');
        const isbn = normalizeIsbn(input.isbn);
        if (isbn && (await this.prisma.productVariant.count({ where: { isbn } })) > 0)
          throw new AppError(409, 'CATALOG_ISBN_CONFLICT', 'ISBN đã được sử dụng.');
      }
      this.conflict(e);
    }
  }
  async setVariantActive(
    productId: string,
    variantId: string,
    data: {
      isActive?: boolean;
      isbn?: string | null;
      name?: string;
      coverType?: string | null;
      costPrice?: number;
      listPrice?: number;
      salePrice?: number;
    },
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const id = parseId(variantId);
    const found = await this.prisma.productVariant.findFirst({
      where: { id, productId: parseId(productId) },
    });
    if (!found) throw new AppError(404, 'CATALOG_VARIANT_NOT_FOUND', 'Không tìm thấy phiên bản.');
    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.update({
        where: { id },
        data: { ...data, ...(data.isbn !== undefined ? { isbn: normalizeIsbn(data.isbn) } : {}) },
      });
      await this.audit(tx, principal, context, 'CATALOG_VARIANT_UPDATED', 'ProductVariant', id);
      return v;
    });
    return { id: updated.id.toString(), isActive: updated.isActive };
  }
  async listImages(productIdValue: string) {
    const productId = parseId(productIdValue);
    if ((await this.prisma.product.count({ where: { id: productId } })) !== 1)
      throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    return (
      await this.prisma.productImage.findMany({
        where: { productId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
    ).map(imageDto);
  }
  async attachUploadedAsset(
    productIdValue: string,
    asset: UploadedProductAsset,
    input: Pick<ImageAttachInput, 'productVariantId' | 'altText' | 'sortOrder' | 'isPrimary'>,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const productId = parseId(productIdValue);
    const productVariantId = input.productVariantId ? parseId(input.productVariantId) : null;
    try {
      return await this.prisma.$transaction(async (tx) => {
        if ((await tx.product.count({ where: { id: productId, deletedAt: null } })) !== 1)
          throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
        if (
          productVariantId &&
          (await tx.productVariant.count({ where: { id: productVariantId, productId } })) !== 1
        )
          throw new AppError(400, 'CATALOG_IMAGE_SCOPE_INVALID', 'Variant không thuộc Product.');
        const image = await tx.productImage.create({
          data: {
            productId,
            productVariantId,
            ...asset,
            altText: input.altText,
            sortOrder: input.sortOrder,
            isPrimary: input.isPrimary,
          },
        });
        await this.audit(
          tx,
          principal,
          context,
          'CATALOG_IMAGE_ATTACHED',
          'ProductImage',
          image.id,
        );
        return imageDto(image);
      });
    } catch (error) {
      try {
        await this.imageAdapter?.destroy(asset.publicId);
      } catch {
        await this.cleanupFailure(principal, context, asset.publicId, null);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new AppError(409, 'CATALOG_IMAGE_INVALID', 'Primary image conflict.');
      throw error;
    }
  }
  private async cleanupFailure(
    principal: AuthPrincipal,
    context: RequestContext,
    publicId: string,
    entityId: bigint | null,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action: 'CATALOG_IMAGE_CLEANUP_FAILED',
        entityType: 'ProductImage',
        entityId: entityId?.toString() ?? null,
        requestId: context.requestId ?? null,
        metadataJson: JSON.stringify({ publicId: publicId.replace(/[^a-zA-Z0-9/_-]/g, '') }),
      },
    });
  }
  async patchImage(
    productIdValue: string,
    imageIdValue: string,
    input: {
      altText?: string | undefined;
      sortOrder?: number | undefined;
      isPrimary?: boolean | undefined;
    },
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const productId = parseId(productIdValue);
    const id = parseId(imageIdValue);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.productImage.findFirst({ where: { id, productId } });
      if (!current) throw new AppError(404, 'CATALOG_IMAGE_INVALID', 'Không tìm thấy ảnh.');
      if (input.isPrimary)
        await tx.productImage.updateMany({
          where: {
            productId,
            productVariantId: current.productVariantId,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      const image = await tx.productImage.update({
        where: { id },
        data: {
          ...(input.altText !== undefined ? { altText: input.altText } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
        },
      });
      await this.audit(tx, principal, context, 'CATALOG_IMAGE_UPDATED', 'ProductImage', id);
      return imageDto(image);
    });
  }
  async deleteImage(
    productIdValue: string,
    imageIdValue: string,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const productId = parseId(productIdValue);
    const id = parseId(imageIdValue);
    const image = await this.prisma.$transaction(async (tx) => {
      const found = await tx.productImage.findFirst({ where: { id, productId } });
      if (!found) throw new AppError(404, 'CATALOG_IMAGE_INVALID', 'Không tìm thấy ảnh.');
      await tx.productImage.delete({ where: { id } });
      await this.audit(tx, principal, context, 'CATALOG_IMAGE_DELETED', 'ProductImage', id);
      return found;
    });
    try {
      await this.imageAdapter?.destroy(image.publicId);
    } catch {
      await this.cleanupFailure(principal, context, image.publicId, id);
    }
  }
  async softDeleteTaxonomy(
    kind: 'category' | 'author' | 'publisher',
    idValue: string,
    principal: AuthPrincipal,
    context: RequestContext,
  ) {
    this.assertManage(principal);
    const id = parseId(idValue);
    await this.prisma.$transaction(async (tx) => {
      if (kind === 'category') await this.assertCategoryNotPrimaryForActiveProduct(tx, id);
      const model = tx[kind] as unknown as { updateMany(args: object): Promise<{ count: number }> };
      const result = await model.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (!result.count)
        throw new AppError(
          404,
          `CATALOG_${kind.toUpperCase()}_NOT_FOUND`,
          'Không tìm thấy taxonomy.',
        );
      await this.audit(
        tx,
        principal,
        context,
        `CATALOG_${kind.toUpperCase()}_SOFT_DELETED`,
        kind,
        id,
      );
    });
  }
  async softDeleteProduct(idValue: string, principal: AuthPrincipal, context: RequestContext) {
    this.assertManage(principal);
    const id = parseId(idValue);
    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.product.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), publicationState: 'ARCHIVED', isActive: false },
      });
      if (!changed.count)
        throw new AppError(404, 'CATALOG_PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
      await this.audit(tx, principal, context, 'CATALOG_PRODUCT_SOFT_DELETED', 'Product', id);
      return changed;
    });
    return result;
  }
}

const normalizeIsbnSearch = (q: string): string => q.replace(/[\s-]/g, '').toUpperCase();
const escapeLike = (value: string): string => value.replace(/[[%_]/g, '[$&]');
