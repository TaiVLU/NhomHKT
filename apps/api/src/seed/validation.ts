import type { PrismaClient } from '@prisma/client';
import {
  approvedPublicAuthorNames,
  approvedPublicCategoryNames,
  approvedPublicPublisherNames,
  demoAdmin,
  demoCustomer,
  demoOrderNumbers,
  demoProducts,
  demoStaff,
} from './demo-data.js';

export type SeedValidationSeverity = 'BLOCKER' | 'INFO';

export interface SeedValidationIssue {
  readonly code: string;
  readonly severity: SeedValidationSeverity;
  readonly count: string;
  readonly message: string;
}

export interface SeedValidationReport {
  readonly issues: readonly SeedValidationIssue[];
  readonly blocking: boolean;
}

type CountRow = { count: bigint };

const count = async (prisma: PrismaClient, sql: string): Promise<string> => {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return (rows[0]?.count ?? 0n).toString();
};

const issue = (
  code: string,
  severity: SeedValidationSeverity,
  countValue: string,
  message: string,
): SeedValidationIssue => ({ code, severity, count: countValue, message });

export const validateSeedData = async (prisma: PrismaClient): Promise<SeedValidationReport> => {
  const demoSlugs = demoProducts
    .map((product) => `'${product.slug.replaceAll("'", "''")}'`)
    .join(',');
  const publicDemoSlugs = demoProducts
    .filter((product) => product.publicationState === 'ACTIVE')
    .map((product) => `'${product.slug.replaceAll("'", "''")}'`)
    .join(',');
  const approvedCategoryNames = approvedPublicCategoryNames
    .map((name) => `N'${name.replaceAll("'", "''")}'`)
    .join(',');
  const approvedAuthorNames = approvedPublicAuthorNames
    .map((name) => `N'${name.replaceAll("'", "''")}'`)
    .join(',');
  const approvedPublisherNames = approvedPublicPublisherNames
    .map((name) => `N'${name.replaceAll("'", "''")}'`)
    .join(',');
  const demoSkus = demoProducts
    .flatMap((product) => product.variants.map((variant) => variant.sku))
    .map((sku) => `'${sku.replaceAll("'", "''")}'`)
    .join(',');
  const demoOrders = demoOrderNumbers.map((orderNumber) => `'${orderNumber}'`).join(',');
  const demoAccounts = [
    { username: demoCustomer.username, role: 'CUSTOMER' },
    { username: demoStaff.username, role: 'STAFF' },
    { username: demoAdmin.username, role: 'ADMIN' },
  ] as const;
  const demoAccountValues = demoAccounts
    .map(
      (account) =>
        `('${account.username.replaceAll("'", "''")}','${account.role.replaceAll("'", "''")}')`,
    )
    .join(',');
  const checks: SeedValidationIssue[] = [
    issue(
      'ACTIVE_PRODUCTS_INVALID_PRIMARY_CATEGORY',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product] p
          LEFT JOIN [dbo].[Category] c ON c.[id] = p.[primaryCategoryId]
          LEFT JOIN [dbo].[ProductCategory] pc
            ON pc.[productId] = p.[id] AND pc.[categoryId] = p.[primaryCategoryId]
          WHERE p.[publicationState] = 'ACTIVE'
            AND p.[deletedAt] IS NULL
            AND (
              p.[primaryCategoryId] IS NULL
              OR c.[id] IS NULL
              OR c.[isActive] <> 1
              OR c.[deletedAt] IS NOT NULL
              OR pc.[categoryId] IS NULL
            )
        `,
      ),
      'ACTIVE Products must have an active assigned primary category.',
    ),
    issue(
      'PUBLIC_QA_FIXTURE_VISIBLE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product] p
          WHERE p.[publicationState] = 'ACTIVE'
            AND p.[deletedAt] IS NULL
            AND (
              p.[slug] LIKE 'cart-test-%'
              OR p.[slug] LIKE 'checkout-%'
              OR p.[slug] LIKE 'inventory-%'
              OR p.[slug] LIKE 'm6-e2e-%'
              OR p.[name] LIKE 'Cart Test %'
              OR p.[name] LIKE 'Checkout %'
              OR EXISTS (
                SELECT 1
                FROM [dbo].[ProductVariant] v
                WHERE v.[productId] = p.[id] AND v.[sku] LIKE 'M5A-%'
              )
            )
        `,
      ),
      'Public catalog must not expose QA fixtures or the superseded M5A dataset.',
    ),
    issue(
      'PUBLIC_QA_CATEGORY_VISIBLE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Category]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND (
              [slug] LIKE 'cart-category-%'
              OR [slug] LIKE 'checkout-%'
              OR [slug] LIKE 'm6-e2e-category-%'
              OR [slug] LIKE 'm6-demo-%'
              OR [slug] = 'uncategorized'
            )
        `,
      ),
      'Public taxonomy must not expose QA, technical, or internal categories.',
    ),
    issue(
      'PUBLIC_QA_AUTHOR_VISIBLE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Author]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND ([slug] LIKE 'm3-ui-author%' OR [slug] LIKE 'm6-e2e-author-%')
        `,
      ),
      'Public author taxonomy must not expose bounded UI or E2E fixtures.',
    ),
    issue(
      'PUBLIC_QA_PUBLISHER_VISIBLE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Publisher]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND ([slug] LIKE 'm3-ui-publisher%' OR [slug] LIKE 'm6-e2e-publisher-%')
        `,
      ),
      'Public publisher taxonomy must not expose bounded UI or E2E fixtures.',
    ),
    issue(
      'PUBLIC_DEMO_IMAGE_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product] p
          WHERE p.[slug] IN (${publicDemoSlugs})
            AND NOT EXISTS (
              SELECT 1 FROM [dbo].[ProductImage] i
              WHERE i.[productId] = p.[id]
                AND i.[productVariantId] IS NULL
                AND i.[isPrimary] = 1
                AND NULLIF(LTRIM(RTRIM(i.[url])), '') IS NOT NULL
            )
        `,
      ),
      'Every public demo product must have a stable primary image.',
    ),
    issue(
      'PUBLIC_DEMO_GALLERY_INCOMPLETE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product] p
          WHERE p.[slug] IN (${publicDemoSlugs})
            AND (
              SELECT COUNT_BIG(1) FROM [dbo].[ProductImage] i
              WHERE i.[productId] = p.[id]
                AND i.[productVariantId] IS NULL
                AND i.[url] LIKE '/product-images/%'
            ) < 4
        `,
      ),
      'Every public demo product must have the four approved repository-owned gallery images.',
    ),
    issue(
      'PUBLIC_DEMO_DESCRIPTION_TOO_SHORT',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product]
          WHERE [slug] IN (${publicDemoSlugs})
            AND (
              LEN(LTRIM(RTRIM(COALESCE([description], '')))) < 400
              OR [description] NOT LIKE '%' + CHAR(10) + CHAR(10) + '%'
            )
        `,
      ),
      'Every public demo product description must contain at least 400 characters and paragraph breaks.',
    ),
    issue(
      'APPROVED_PUBLIC_CATEGORY_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (VALUES ${approvedPublicCategoryNames
            .map((name) => `(N'${name.replaceAll("'", "''")}')`)
            .join(',')}) expected([name])
          LEFT JOIN [dbo].[Category] c
            ON c.[name] = expected.[name]
            AND c.[isActive] = 1
            AND c.[deletedAt] IS NULL
          WHERE c.[id] IS NULL
        `,
      ),
      'All approved Vietnamese public categories must exist and be active.',
    ),
    issue(
      'UNAPPROVED_PUBLIC_CATEGORY_NAME',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Category]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND [name] NOT IN (${approvedCategoryNames})
        `,
      ),
      'Local demo public taxonomy must remain bounded to the approved category list.',
    ),
    issue(
      'UNAPPROVED_PUBLIC_AUTHOR_NAME',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Author]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND [name] NOT IN (${approvedAuthorNames})
        `,
      ),
      'Local demo public taxonomy must remain bounded to the approved author list.',
    ),
    issue(
      'UNAPPROVED_PUBLIC_PUBLISHER_NAME',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Publisher]
          WHERE [isActive] = 1
            AND [deletedAt] IS NULL
            AND [name] NOT IN (${approvedPublisherNames})
        `,
      ),
      'Local demo public taxonomy must remain bounded to the approved publisher list.',
    ),
    issue(
      'INVALID_PUBLICATION_STATE',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product]
          WHERE [publicationState] NOT IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')
        `,
      ),
      'Product publicationState must be one of the approved lifecycle values.',
    ),
    issue(
      'IS_ACTIVE_MIRROR_MISMATCH',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product]
          WHERE [isActive] <> CASE WHEN [publicationState] = 'ACTIVE' THEN 1 ELSE 0 END
        `,
      ),
      'Product.isActive must mirror publicationState.',
    ),
    issue(
      'DUPLICATE_PRODUCT_SLUG',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (
            SELECT [slug]
            FROM [dbo].[Product]
            GROUP BY [slug]
            HAVING COUNT_BIG(1) > 1
          ) duplicates
        `,
      ),
      'Product slugs must be unique.',
    ),
    issue(
      'DUPLICATE_VARIANT_SKU',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (
            SELECT [sku]
            FROM [dbo].[ProductVariant]
            GROUP BY [sku]
            HAVING COUNT_BIG(1) > 1
          ) duplicates
        `,
      ),
      'Variant SKUs must be unique.',
    ),
    issue(
      'VARIANT_WITHOUT_PRODUCT',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[ProductVariant] v
          LEFT JOIN [dbo].[Product] p ON p.[id] = v.[productId]
          WHERE p.[id] IS NULL
        `,
      ),
      'Every variant must belong to a Product.',
    ),
    issue(
      'INVENTORY_WITHOUT_VARIANT',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Inventory] i
          LEFT JOIN [dbo].[ProductVariant] v ON v.[id] = i.[productVariantId]
          WHERE v.[id] IS NULL
        `,
      ),
      'Every inventory row must belong to a variant.',
    ),
    issue(
      'NEGATIVE_STOCK',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Inventory]
          WHERE [onHandQuantity] < 0 OR [reservedQuantity] < 0
        `,
      ),
      'Inventory quantities must not be negative.',
    ),
    issue(
      'RESERVED_EXCEEDS_ON_HAND',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Inventory]
          WHERE [reservedQuantity] > [onHandQuantity]
        `,
      ),
      'Reserved stock must not exceed on-hand stock.',
    ),
    issue(
      'SALE_PRICE_VIOLATION',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[ProductVariant]
          WHERE [listPrice] < 0 OR [salePrice] < 0 OR [salePrice] > [listPrice]
        `,
      ),
      'Variant prices must be non-negative and salePrice cannot exceed listPrice.',
    ),
    issue(
      'INCOMPLETE_ORDER_ITEM_SNAPSHOT',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[OrderItem]
          WHERE [productTitleSnapshot] IS NULL
             OR [productSlugSnapshot] IS NULL
             OR [variantNameSnapshot] IS NULL
             OR [skuSnapshot] IS NULL
             OR [unitListPrice] IS NULL
             OR [unitEffectivePrice] IS NULL
             OR [lineTotal] IS NULL
        `,
      ),
      'OrderItems must include mandatory immutable snapshots.',
    ),
    issue(
      'MALFORMED_AUTHOR_SNAPSHOT_JSON',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[OrderItem]
          WHERE [authorNamesSnapshot] IS NOT NULL
            AND NOT (
              ISJSON([authorNamesSnapshot]) = 1
              AND LEFT(LTRIM([authorNamesSnapshot]), 1) = '['
            )
        `,
      ),
      'Author snapshots must be NULL or a JSON array.',
    ),
    issue(
      'DEMO_PRODUCTS_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (VALUES ${demoProducts.map((product) => `('${product.slug}')`).join(',')}) expected([slug])
          LEFT JOIN [dbo].[Product] p ON p.[slug] = expected.[slug]
          WHERE p.[id] IS NULL
        `,
      ),
      'All deterministic demo products must exist after demo seed.',
    ),
    issue(
      'DEMO_ORDERS_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (VALUES ${demoOrders
            .split(',')
            .map((orderNumber) => `(${orderNumber})`)
            .join(',')}) expected([orderNumber])
          LEFT JOIN [dbo].[Order] o ON o.[orderNumber] = expected.[orderNumber]
          WHERE o.[id] IS NULL
        `,
      ),
      'All deterministic demo orders must exist after demo seed.',
    ),
    issue(
      'DEMO_ACCOUNTS_MISSING_OR_INVALID',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM (VALUES ${demoAccountValues}) expected([username], [role])
          LEFT JOIN [dbo].[User] u ON u.[username] = expected.[username]
          WHERE u.[id] IS NULL
            OR u.[role] <> expected.[role]
            OR u.[status] <> 'ACTIVE'
        `,
      ),
      'Customer, Staff, and Admin demo accounts must exist with active deterministic roles.',
    ),
    issue(
      'DEMO_PRODUCT_DUPLICATE_LOGICAL_KEYS',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Product]
          WHERE [slug] IN (${demoSlugs})
          GROUP BY [slug]
          HAVING COUNT_BIG(1) > 1
        `,
      ),
      'Deterministic demo product slugs must not duplicate.',
    ),
    issue(
      'DEMO_INVENTORY_LEDGER_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[ProductVariant] v
          JOIN [dbo].[Inventory] i ON i.[productVariantId] = v.[id]
          WHERE v.[sku] IN (${demoSkus})
            AND i.[onHandQuantity] > 0
            AND NOT EXISTS (
              SELECT 1
              FROM [dbo].[InventoryLedger] l
              WHERE l.[inventoryId] = i.[productVariantId]
            )
        `,
      ),
      'Demo variants with stock must expose inventory ledger history.',
    ),
    issue(
      'DEMO_ORDER_LEDGER_MISSING',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Order] o
          JOIN [dbo].[OrderItem] oi ON oi.[orderId] = o.[id]
          WHERE o.[orderNumber] IN (${demoOrders})
            AND NOT EXISTS (
              SELECT 1
              FROM [dbo].[InventoryLedger] l
              WHERE l.[inventoryId] = oi.[variantId]
                AND l.[reason] LIKE '%' + o.[orderNumber] + '%'
            )
        `,
      ),
      'Demo orders must have matching inventory ledger movement history.',
    ),
    issue(
      'DEMO_LEDGER_RECONSTRUCTION_MISMATCH',
      'BLOCKER',
      await count(
        prisma,
        `
          SELECT COUNT_BIG(1) AS [count]
          FROM [dbo].[Inventory] i
          JOIN [dbo].[ProductVariant] v ON v.[id] = i.[productVariantId]
          OUTER APPLY (
            SELECT COALESCE(SUM(l.[quantityDelta]), 0) AS [ledgerQuantity]
            FROM [dbo].[InventoryLedger] l
            WHERE l.[inventoryId] = i.[productVariantId]
          ) ledger
          WHERE v.[sku] IN (${demoSkus})
            AND ledger.[ledgerQuantity] <> i.[onHandQuantity]
        `,
      ),
      'Demo inventory on-hand quantity must reconstruct from ledger deltas.',
    ),
  ];

  return {
    issues: checks,
    blocking: checks.some((item) => item.severity === 'BLOCKER' && item.count !== '0'),
  };
};

export const printSeedValidationReport = (report: SeedValidationReport): void => {
  process.stdout.write(
    JSON.stringify({ blocking: report.blocking, issues: report.issues }, null, 2),
  );
  process.stdout.write('\n');
};
