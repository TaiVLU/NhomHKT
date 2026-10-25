import { z } from 'zod';

export const idSchema = z.string().regex(/^[1-9]\d*$/);
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const money = z.number().int().safe().nonnegative();
export const publicationStateSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const taxonomySchema = z
  .object({
    name: text(160),
    slug: text(255).optional(),
    description: optionalText(1000),
    bio: z.string().trim().max(100_000).nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .strict();
export const taxonomyPatchSchema = taxonomySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);

export const productSchema = z
  .object({
    name: text(255),
    slug: text(255).optional(),
    shortDescription: optionalText(1000),
    description: z.string().max(100_000).nullable().optional(),
    releaseDate: z.iso.date().nullable().optional(),
    pageCount: z.number().int().positive().nullable().optional(),
    language: optionalText(80),
    dimensions: optionalText(100),
    weightGrams: z.number().int().positive().nullable().optional(),
    publisherId: idSchema.nullable().optional(),
    primaryCategoryId: idSchema.nullable().optional(),
    categoryIds: z.array(idSchema).max(100).default([]),
    authorIds: z.array(idSchema).max(100).default([]),
    isNew: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    publicationState: publicationStateSchema.optional(),
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.categoryIds).size !== value.categoryIds.length ||
      new Set(value.authorIds).size !== value.authorIds.length
    )
      context.addIssue({ code: 'custom', message: 'Relation IDs must be unique' });
  });

export const variantSchema = z
  .object({
    sku: text(64)
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z0-9_-]+$/.test(value)),
    isbn: z.string().trim().max(20).nullable().optional(),
    name: text(120),
    coverType: optionalText(30),
    costPrice: money,
    listPrice: money.positive(),
    salePrice: money.positive(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.salePrice <= value.listPrice, { message: 'Invalid price' });
export const variantPatchSchema = z
  .object({
    isbn: z.string().trim().max(20).nullable().optional(),
    name: text(120).optional(),
    coverType: optionalText(30),
    costPrice: money.optional(),
    listPrice: money.positive().optional(),
    salePrice: money.positive().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const listQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: z.string().trim().max(160).optional(),
    author: z.string().trim().max(200).optional(),
    publisher: z.string().trim().max(200).optional(),
    isNew: z.enum(['true', 'false']).optional(),
    isFeatured: z.enum(['true', 'false']).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    minPrice: z.coerce.number().int().safe().nonnegative().optional(),
    maxPrice: z.coerce.number().int().safe().nonnegative().optional(),
    sort: z
      .enum([
        'newest',
        'name_asc',
        'name_desc',
        'price_asc',
        'price_desc',
        'name-asc',
        'name-desc',
        'price-asc',
        'price-desc',
      ])
      .default('newest')
      .transform((value) => value.replaceAll('-', '_')),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice);

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;

export const productPatchSchema = z
  .object({
    name: text(255).optional(),
    slug: text(255).optional(),
    shortDescription: optionalText(1000),
    description: z.string().max(100_000).nullable().optional(),
    releaseDate: z.iso.date().nullable().optional(),
    pageCount: z.number().int().positive().nullable().optional(),
    language: optionalText(80),
    dimensions: optionalText(100),
    weightGrams: z.number().int().positive().nullable().optional(),
    publisherId: idSchema.nullable().optional(),
    primaryCategoryId: idSchema.nullable().optional(),
    categoryIds: z.array(idSchema).max(100).optional(),
    authorRelations: z
      .array(z.object({ authorId: idSchema, sortOrder: z.number().int().nonnegative() }).strict())
      .max(100)
      .optional(),
    isNew: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    publicationState: publicationStateSchema.optional(),
    seoTitle: optionalText(70),
    seoDescription: optionalText(170),
  })
  .strict()
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0)
      context.addIssue({ code: 'custom', message: 'Empty patch' });
    if (value.categoryIds && new Set(value.categoryIds).size !== value.categoryIds.length)
      context.addIssue({ code: 'custom', message: 'Duplicate category' });
    if (
      value.authorRelations &&
      new Set(value.authorRelations.map((a) => a.authorId)).size !== value.authorRelations.length
    )
      context.addIssue({ code: 'custom', message: 'Duplicate author' });
  });

export const imageAttachSchema = z
  .object({
    url: z.url(),
    publicId: z.string().min(1).max(255),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
    productVariantId: idSchema.nullable().optional(),
    altText: z.string().trim().max(255).default(''),
    sortOrder: z.number().int().nonnegative().default(0),
    isPrimary: z.boolean().default(false),
  })
  .strict();
export const imagePatchSchema = z
  .object({
    altText: z.string().trim().max(255).optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export type ProductPatchInput = z.infer<typeof productPatchSchema>;
export type ImageAttachInput = z.infer<typeof imageAttachSchema>;
