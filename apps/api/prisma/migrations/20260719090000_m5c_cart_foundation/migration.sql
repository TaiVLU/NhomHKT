CREATE TABLE [dbo].[Cart] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [customerId] BIGINT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cart_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cart_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Cart_customerId_key] UNIQUE NONCLUSTERED ([customerId])
);

CREATE TABLE [dbo].[CartItem] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [cartId] BIGINT NOT NULL,
    [variantId] BIGINT NOT NULL,
    [quantity] INT NOT NULL,
    [unitPrice] DECIMAL(19,0) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CartItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CartItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CartItem_cartId_variantId_key] UNIQUE NONCLUSTERED ([cartId], [variantId])
);

CREATE NONCLUSTERED INDEX [Cart_customerId_updatedAt_idx] ON [dbo].[Cart]([customerId], [updatedAt]);
CREATE NONCLUSTERED INDEX [CartItem_cartId_updatedAt_idx] ON [dbo].[CartItem]([cartId], [updatedAt]);
CREATE NONCLUSTERED INDEX [CartItem_variantId_idx] ON [dbo].[CartItem]([variantId]);

ALTER TABLE [dbo].[Cart] ADD CONSTRAINT [Cart_customerId_fkey]
    FOREIGN KEY ([customerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_cartId_fkey]
    FOREIGN KEY ([cartId]) REFERENCES [dbo].[Cart]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[CartItem] ADD CONSTRAINT [CartItem_variantId_fkey]
    FOREIGN KEY ([variantId]) REFERENCES [dbo].[ProductVariant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
