BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Inventory] (
    [productVariantId] BIGINT NOT NULL,
    [onHandQuantity] INT NOT NULL,
    [reservedQuantity] INT NOT NULL CONSTRAINT [Inventory_reservedQuantity_df] DEFAULT 0,
    [lowStockThreshold] INT NOT NULL CONSTRAINT [Inventory_lowStockThreshold_df] DEFAULT 5,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Inventory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Inventory_pkey] PRIMARY KEY CLUSTERED ([productVariantId]),
    CONSTRAINT [Inventory_productVariantId_fkey] FOREIGN KEY ([productVariantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Backfill existing variants so public catalog can compute availability after rollout.
INSERT INTO [dbo].[Inventory] ([productVariantId], [onHandQuantity], [reservedQuantity], [lowStockThreshold], [updatedAt])
SELECT [id], 12, 0, 5, SYSUTCDATETIME()
FROM [dbo].[ProductVariant]
WHERE [id] NOT IN (SELECT [productVariantId] FROM [dbo].[Inventory]);

-- M5A SQL Server constraints approved by Technical Lead.
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_onHandQuantity_check] CHECK ([onHandQuantity] >= 0);
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_reservedQuantity_check] CHECK ([reservedQuantity] >= 0);
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_lowStockThreshold_check] CHECK ([lowStockThreshold] >= 0);
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_reserved_lte_onHand_check] CHECK ([reservedQuantity] <= [onHandQuantity]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
