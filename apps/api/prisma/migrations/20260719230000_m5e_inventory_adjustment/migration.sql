CREATE TABLE [dbo].[InventoryLedger] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [inventoryId] BIGINT NOT NULL,
    [adjustmentType] VARCHAR(40) NOT NULL,
    [quantityDelta] INT NOT NULL,
    [beforeQuantity] INT NOT NULL,
    [afterQuantity] INT NOT NULL,
    [reason] NVARCHAR(500) NOT NULL,
    [actorUserId] BIGINT NULL,
    [actorNameSnapshot] NVARCHAR(120) NULL,
    [actorEmailSnapshot] VARCHAR(254) NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InventoryLedger_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [InventoryLedger_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE INDEX [InventoryLedger_inventoryId_createdAt_idx] ON [dbo].[InventoryLedger]([inventoryId], [createdAt]);
CREATE INDEX [InventoryLedger_actorUserId_createdAt_idx] ON [dbo].[InventoryLedger]([actorUserId], [createdAt]);
CREATE INDEX [InventoryLedger_adjustmentType_createdAt_idx] ON [dbo].[InventoryLedger]([adjustmentType], [createdAt]);

ALTER TABLE [dbo].[InventoryLedger]
ADD CONSTRAINT [InventoryLedger_inventoryId_fkey]
FOREIGN KEY ([inventoryId]) REFERENCES [dbo].[Inventory]([productVariantId])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[InventoryLedger]
ADD CONSTRAINT [InventoryLedger_actorUserId_fkey]
FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;