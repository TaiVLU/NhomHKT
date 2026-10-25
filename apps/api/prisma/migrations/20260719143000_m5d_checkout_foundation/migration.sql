CREATE TABLE [dbo].[Order] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [orderNumber] VARCHAR(32) NOT NULL,
    [customerId] BIGINT NOT NULL,
    [status] VARCHAR(40) NOT NULL CONSTRAINT [Order_status_df] DEFAULT 'PENDING_CONFIRMATION',
    [subtotal] DECIMAL(19,0) NOT NULL,
    [total] DECIMAL(19,0) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Order_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Order_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Order_orderNumber_key] UNIQUE NONCLUSTERED ([orderNumber])
);

CREATE TABLE [dbo].[OrderItem] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [orderId] BIGINT NOT NULL,
    [variantId] BIGINT NOT NULL,
    [quantity] INT NOT NULL,
    [unitPrice] DECIMAL(19,0) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OrderItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OrderItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [Order_customerId_createdAt_idx] ON [dbo].[Order]([customerId], [createdAt]);
CREATE NONCLUSTERED INDEX [Order_status_createdAt_idx] ON [dbo].[Order]([status], [createdAt]);
CREATE NONCLUSTERED INDEX [OrderItem_orderId_idx] ON [dbo].[OrderItem]([orderId]);
CREATE NONCLUSTERED INDEX [OrderItem_variantId_idx] ON [dbo].[OrderItem]([variantId]);

ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_customerId_fkey]
FOREIGN KEY ([customerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_orderId_fkey]
FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[OrderItem] ADD CONSTRAINT [OrderItem_variantId_fkey]
FOREIGN KEY ([variantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
