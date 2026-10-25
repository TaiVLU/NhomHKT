import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CountRow = { count: bigint };

const count = async (sql: string): Promise<string> => {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return (rows[0]?.count ?? 0n).toString();
};

const isJsonArrayExpression =
  "ISJSON([authorNamesSnapshot]) = 1 AND LEFT(LTRIM([authorNamesSnapshot]), 1) = '['";

try {
  const report = {
    activeProductsWithoutValidPrimaryCategory: await count(`
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
    `),
    orderItemsMissingMandatorySnapshots: await count(`
      SELECT COUNT_BIG(1) AS [count]
      FROM [dbo].[OrderItem]
      WHERE [productTitleSnapshot] IS NULL
         OR [productSlugSnapshot] IS NULL
         OR [variantNameSnapshot] IS NULL
         OR [skuSnapshot] IS NULL
         OR [unitListPrice] IS NULL
         OR [unitEffectivePrice] IS NULL
         OR [lineTotal] IS NULL
    `),
    invalidPublicationStateValues: await count(`
      SELECT COUNT_BIG(1) AS [count]
      FROM [dbo].[Product]
      WHERE [publicationState] NOT IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')
    `),
    productIsActiveMirrorMismatches: await count(`
      SELECT COUNT_BIG(1) AS [count]
      FROM [dbo].[Product]
      WHERE [isActive] <> CASE WHEN [publicationState] = 'ACTIVE' THEN 1 ELSE 0 END
    `),
    malformedAuthorSnapshotJson: await count(`
      SELECT COUNT_BIG(1) AS [count]
      FROM [dbo].[OrderItem]
      WHERE [authorNamesSnapshot] IS NOT NULL
        AND NOT (${isJsonArrayExpression})
    `),
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
