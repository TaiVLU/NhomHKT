CREATE TABLE [dbo].[OrderStatusHistory] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [orderId] BIGINT NOT NULL,
    [fromStatus] VARCHAR(40) NULL,
    [toStatus] VARCHAR(40) NOT NULL,
    [note] NVARCHAR(500) NULL,
    [changedByUserId] BIGINT NULL,
    [changedByEmailSnapshot] VARCHAR(254) NULL,
    [changedByNameSnapshot] NVARCHAR(120) NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OrderStatusHistory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OrderStatusHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [OrderStatusHistory_orderId_createdAt_idx]
ON [dbo].[OrderStatusHistory]([orderId], [createdAt]);

CREATE NONCLUSTERED INDEX [OrderStatusHistory_changedByUserId_createdAt_idx]
ON [dbo].[OrderStatusHistory]([changedByUserId], [createdAt]);

ALTER TABLE [dbo].[OrderStatusHistory] ADD CONSTRAINT [OrderStatusHistory_orderId_fkey]
FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[OrderStatusHistory] ADD CONSTRAINT [OrderStatusHistory_changedByUserId_fkey]
FOREIGN KEY ([changedByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

INSERT INTO [dbo].[OrderStatusHistory] (
    [orderId],
    [fromStatus],
    [toStatus],
    [note],
    [changedByUserId],
    [changedByEmailSnapshot],
    [changedByNameSnapshot],
    [createdAt]
)
SELECT
    o.[id],
    NULL,
    o.[status],
    N'Order created',
    NULL,
    NULL,
    NULL,
    o.[createdAt]
FROM [dbo].[Order] o
WHERE NOT EXISTS (
    SELECT 1
    FROM [dbo].[OrderStatusHistory] h
    WHERE h.[orderId] = o.[id]
);
