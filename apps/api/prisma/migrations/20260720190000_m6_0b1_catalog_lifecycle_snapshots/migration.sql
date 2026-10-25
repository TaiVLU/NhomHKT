-- M6.0B-1: catalog lifecycle, primary category, and order item snapshots.
-- SQL Server does not support Prisma enum fields in this project connector, so
-- publicationState is stored as VARCHAR with a database CHECK constraint.

ALTER TABLE [dbo].[Product]
ADD [publicationState] VARCHAR(20) NOT NULL CONSTRAINT [Product_publicationState_df] DEFAULT 'DRAFT',
    [primaryCategoryId] BIGINT NULL;

EXEC(N'
ALTER TABLE [dbo].[Product]
ADD CONSTRAINT [Product_publicationState_ck]
CHECK ([publicationState] IN (''DRAFT'', ''ACTIVE'', ''INACTIVE'', ''ARCHIVED''));
');

EXEC(N'
UPDATE [dbo].[Product]
SET [publicationState] = CASE
  WHEN [deletedAt] IS NOT NULL THEN ''ARCHIVED''
  WHEN [isActive] = 1 THEN ''ACTIVE''
  ELSE ''INACTIVE''
END;
');

EXEC(N'
UPDATE p
SET [primaryCategoryId] = chosen.[categoryId]
FROM [dbo].[Product] p
CROSS APPLY (
  SELECT TOP 1 pc.[categoryId]
  FROM [dbo].[ProductCategory] pc
  JOIN [dbo].[Category] c ON c.[id] = pc.[categoryId]
  WHERE pc.[productId] = p.[id]
  ORDER BY
    CASE WHEN c.[isActive] = 1 AND c.[deletedAt] IS NULL THEN 0 ELSE 1 END,
    c.[sortOrder] ASC,
    c.[name] ASC,
    c.[id] ASC
) chosen
WHERE p.[primaryCategoryId] IS NULL;
');

EXEC(N'
ALTER TABLE [dbo].[Product]
ADD CONSTRAINT [Product_primaryCategoryId_fkey]
FOREIGN KEY ([primaryCategoryId]) REFERENCES [dbo].[Category]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;
');

EXEC(N'
CREATE INDEX [Product_publicationState_deletedAt_createdAt_idx]
ON [dbo].[Product]([publicationState], [deletedAt], [createdAt]);
');

EXEC(N'
CREATE INDEX [Product_primaryCategoryId_idx]
ON [dbo].[Product]([primaryCategoryId]);
');

ALTER TABLE [dbo].[OrderItem]
ADD [productTitleSnapshot] NVARCHAR(255) NULL,
    [productSlugSnapshot] VARCHAR(255) NULL,
    [variantNameSnapshot] NVARCHAR(120) NULL,
    [skuSnapshot] VARCHAR(64) NULL,
    [isbnSnapshot] VARCHAR(20) NULL,
    [languageSnapshot] NVARCHAR(80) NULL,
    [coverImageUrlSnapshot] NVARCHAR(1000) NULL,
    [primaryCategoryNameSnapshot] NVARCHAR(120) NULL,
    [authorNamesSnapshot] NVARCHAR(MAX) NULL,
    [publisherNameSnapshot] NVARCHAR(160) NULL,
    [unitListPrice] DECIMAL(19, 0) NULL,
    [unitSalePrice] DECIMAL(19, 0) NULL,
    [unitEffectivePrice] DECIMAL(19, 0) NULL,
    [lineTotal] DECIMAL(19, 0) NULL;

EXEC(N'
UPDATE oi
SET
  [productTitleSnapshot] = p.[name],
  [productSlugSnapshot] = p.[slug],
  [variantNameSnapshot] = v.[name],
  [skuSnapshot] = v.[sku],
  [isbnSnapshot] = v.[isbn],
  [languageSnapshot] = p.[language],
  [coverImageUrlSnapshot] = imagePick.[url],
  [primaryCategoryNameSnapshot] = pcPrimary.[name],
  [authorNamesSnapshot] = authorJson.[names],
  [publisherNameSnapshot] = pub.[name],
  [unitListPrice] = v.[listPrice],
  [unitSalePrice] = v.[salePrice],
  [unitEffectivePrice] = oi.[unitPrice],
  [lineTotal] = oi.[unitPrice] * oi.[quantity]
FROM [dbo].[OrderItem] oi
JOIN [dbo].[ProductVariant] v ON v.[id] = oi.[variantId]
JOIN [dbo].[Product] p ON p.[id] = v.[productId]
LEFT JOIN [dbo].[Publisher] pub ON pub.[id] = p.[publisherId] AND pub.[isActive] = 1 AND pub.[deletedAt] IS NULL
LEFT JOIN [dbo].[Category] pcPrimary ON pcPrimary.[id] = p.[primaryCategoryId] AND pcPrimary.[isActive] = 1 AND pcPrimary.[deletedAt] IS NULL
OUTER APPLY (
  SELECT CASE
    WHEN COUNT_BIG(1) = 0 THEN NULL
    ELSE CONCAT(
      ''['',
      STRING_AGG(CONCAT(''"'', STRING_ESCAPE(a.[name], ''json''), ''"''), '','')
        WITHIN GROUP (ORDER BY pa.[sortOrder] ASC, a.[name] ASC),
      '']''
    )
  END AS [names]
  FROM [dbo].[ProductAuthor] pa
  JOIN [dbo].[Author] a ON a.[id] = pa.[authorId]
  WHERE pa.[productId] = p.[id] AND a.[isActive] = 1 AND a.[deletedAt] IS NULL
) authorJson
OUTER APPLY (
  SELECT TOP 1 img.[url]
  FROM [dbo].[ProductImage] img
  WHERE img.[productId] = p.[id]
  ORDER BY
    CASE WHEN img.[productVariantId] = v.[id] THEN 0 ELSE 1 END,
    CASE WHEN img.[isPrimary] = 1 AND img.[productVariantId] IS NULL THEN 0 ELSE 1 END,
    img.[sortOrder] ASC,
    img.[id] ASC
) imagePick
;
');

-- Operational report query for deployment verification:
-- SELECT COUNT_BIG(1) AS activeWithoutPrimaryCategory
-- FROM [dbo].[Product]
-- WHERE [publicationState] = 'ACTIVE' AND [deletedAt] IS NULL AND [primaryCategoryId] IS NULL;
--
-- SELECT COUNT_BIG(1) AS legacyOrderItemsWithoutSnapshots
-- FROM [dbo].[OrderItem]
-- WHERE [productTitleSnapshot] IS NULL OR [productSlugSnapshot] IS NULL
--    OR [variantNameSnapshot] IS NULL OR [skuSnapshot] IS NULL
--    OR [authorNamesSnapshot] IS NULL OR [unitEffectivePrice] IS NULL OR [lineTotal] IS NULL;
