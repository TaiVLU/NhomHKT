BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(120) NOT NULL,
    [slug] VARCHAR(160) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Category_isActive_df] DEFAULT 1,
    [sortOrder] INT NOT NULL CONSTRAINT [Category_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Category_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Author] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(160) NOT NULL,
    [slug] VARCHAR(200) NOT NULL,
    [bio] NVARCHAR(max),
    [isActive] BIT NOT NULL CONSTRAINT [Author_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Author_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Author_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Author_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Publisher] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(160) NOT NULL,
    [slug] VARCHAR(200) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Publisher_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Publisher_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Publisher_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Publisher_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [slug] VARCHAR(255) NOT NULL,
    [shortDescription] NVARCHAR(1000),
    [description] NVARCHAR(max),
    [releaseDate] DATE,
    [pageCount] INT,
    [language] NVARCHAR(80),
    [dimensions] NVARCHAR(100),
    [weightGrams] INT,
    [publisherId] BIGINT,
    [isNew] BIT NOT NULL CONSTRAINT [Product_isNew_df] DEFAULT 0,
    [isFeatured] BIT NOT NULL CONSTRAINT [Product_isFeatured_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [Product_isActive_df] DEFAULT 1,
    [seoTitle] NVARCHAR(70),
    [seoDescription] NVARCHAR(170),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Product_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[ProductVariant] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [productId] BIGINT NOT NULL,
    [sku] VARCHAR(64) NOT NULL,
    [isbn] VARCHAR(20),
    [name] NVARCHAR(120) NOT NULL,
    [coverType] VARCHAR(30),
    [costPrice] DECIMAL(19,0) NOT NULL,
    [listPrice] DECIMAL(19,0) NOT NULL,
    [salePrice] DECIMAL(19,0) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [ProductVariant_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductVariant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductVariant_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductVariant_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[ProductCategory] (
    [productId] BIGINT NOT NULL,
    [categoryId] BIGINT NOT NULL,
    CONSTRAINT [ProductCategory_pkey] PRIMARY KEY CLUSTERED ([productId],[categoryId])
);

-- CreateTable
CREATE TABLE [dbo].[ProductAuthor] (
    [productId] BIGINT NOT NULL,
    [authorId] BIGINT NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductAuthor_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProductAuthor_pkey] PRIMARY KEY CLUSTERED ([productId],[authorId])
);

-- CreateTable
CREATE TABLE [dbo].[ProductImage] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [productId] BIGINT NOT NULL,
    [productVariantId] BIGINT,
    [url] NVARCHAR(1000) NOT NULL,
    [publicId] NVARCHAR(255) NOT NULL,
    [mimeType] VARCHAR(30) NOT NULL,
    [sizeBytes] INT NOT NULL,
    [altText] NVARCHAR(255) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProductImage_sortOrder_df] DEFAULT 0,
    [isPrimary] BIT NOT NULL CONSTRAINT [ProductImage_isPrimary_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductImage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductImage_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductImage_publicId_key] UNIQUE NONCLUSTERED ([publicId])
);

-- CreateTable
CREATE TABLE [dbo].[SlugReservation] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [resourceType] VARCHAR(40) NOT NULL,
    [slug] VARCHAR(255) NOT NULL,
    [resourceId] BIGINT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SlugReservation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SlugReservation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SlugReservation_resourceType_slug_key] UNIQUE NONCLUSTERED ([resourceType],[slug])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Category_isActive_deletedAt_sortOrder_name_idx] ON [dbo].[Category]([isActive], [deletedAt], [sortOrder], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Author_isActive_deletedAt_name_idx] ON [dbo].[Author]([isActive], [deletedAt], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Publisher_isActive_deletedAt_name_idx] ON [dbo].[Publisher]([isActive], [deletedAt], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_isActive_deletedAt_createdAt_idx] ON [dbo].[Product]([isActive], [deletedAt], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_isFeatured_isActive_createdAt_idx] ON [dbo].[Product]([isFeatured], [isActive], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_isNew_isActive_createdAt_idx] ON [dbo].[Product]([isNew], [isActive], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Product_publisherId_isActive_createdAt_idx] ON [dbo].[Product]([publisherId], [isActive], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductVariant_productId_isActive_idx] ON [dbo].[ProductVariant]([productId], [isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductCategory_categoryId_productId_idx] ON [dbo].[ProductCategory]([categoryId], [productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductAuthor_authorId_productId_idx] ON [dbo].[ProductAuthor]([authorId], [productId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productId_sortOrder_idx] ON [dbo].[ProductImage]([productId], [sortOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductImage_productVariantId_sortOrder_idx] ON [dbo].[ProductImage]([productVariantId], [sortOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SlugReservation_resourceType_resourceId_idx] ON [dbo].[SlugReservation]([resourceType], [resourceId]);

-- M3 SQL Server constraints reviewed against the approved catalog dictionary.
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_sortOrder_check] CHECK ([sortOrder] >= 0);
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_pageCount_check] CHECK ([pageCount] IS NULL OR [pageCount] > 0);
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_weightGrams_check] CHECK ([weightGrams] IS NULL OR [weightGrams] > 0);
ALTER TABLE [dbo].[ProductVariant] ADD CONSTRAINT [ProductVariant_sku_check] CHECK ([sku] NOT LIKE '%[^A-Z0-9_-]%');
ALTER TABLE [dbo].[ProductVariant] ADD CONSTRAINT [ProductVariant_price_check] CHECK (
    [costPrice] >= 0 AND [listPrice] > 0 AND [salePrice] > 0 AND [salePrice] <= [listPrice]
    AND [costPrice] <= 9007199254740991 AND [listPrice] <= 9007199254740991 AND [salePrice] <= 9007199254740991
);
ALTER TABLE [dbo].[ProductAuthor] ADD CONSTRAINT [ProductAuthor_sortOrder_check] CHECK ([sortOrder] >= 0);
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_sortOrder_check] CHECK ([sortOrder] >= 0);
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_sizeBytes_check] CHECK ([sizeBytes] > 0 AND [sizeBytes] <= 5242880);
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_mimeType_check] CHECK ([mimeType] IN ('image/jpeg', 'image/png', 'image/webp'));
ALTER TABLE [dbo].[SlugReservation] ADD CONSTRAINT [SlugReservation_resourceType_check] CHECK ([resourceType] IN ('PRODUCT', 'CATEGORY', 'AUTHOR', 'PUBLISHER'));

CREATE UNIQUE NONCLUSTERED INDEX [ProductVariant_isbn_filtered_key]
ON [dbo].[ProductVariant]([isbn]) WHERE [isbn] IS NOT NULL;
CREATE UNIQUE NONCLUSTERED INDEX [ProductImage_product_primary_key]
ON [dbo].[ProductImage]([productId]) WHERE [isPrimary] = 1 AND [productVariantId] IS NULL;
CREATE UNIQUE NONCLUSTERED INDEX [ProductImage_variant_primary_key]
ON [dbo].[ProductImage]([productVariantId]) WHERE [isPrimary] = 1 AND [productVariantId] IS NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [Product_publisherId_fkey] FOREIGN KEY ([publisherId]) REFERENCES [dbo].[Publisher]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductVariant] ADD CONSTRAINT [ProductVariant_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductCategory] ADD CONSTRAINT [ProductCategory_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductCategory] ADD CONSTRAINT [ProductCategory_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductAuthor] ADD CONSTRAINT [ProductAuthor_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductAuthor] ADD CONSTRAINT [ProductAuthor_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[Author]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProductImage] ADD CONSTRAINT [ProductImage_productVariantId_fkey] FOREIGN KEY ([productVariantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
