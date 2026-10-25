ALTER TABLE [dbo].[Order] ADD
    [shippingAddressId] BIGINT NULL,
    [paymentMethod] VARCHAR(20) NOT NULL CONSTRAINT [Order_paymentMethod_df] DEFAULT 'COD',
    [paymentStatus] VARCHAR(20) NOT NULL CONSTRAINT [Order_paymentStatus_df] DEFAULT 'UNPAID',
    [shippingRecipientName] NVARCHAR(120) NOT NULL CONSTRAINT [Order_shippingRecipientName_df] DEFAULT N'',
    [shippingPhone] VARCHAR(20) NOT NULL CONSTRAINT [Order_shippingPhone_df] DEFAULT '',
    [shippingLine1] NVARCHAR(255) NOT NULL CONSTRAINT [Order_shippingLine1_df] DEFAULT N'',
    [shippingWard] NVARCHAR(120) NOT NULL CONSTRAINT [Order_shippingWard_df] DEFAULT N'',
    [shippingDistrict] NVARCHAR(120) NOT NULL CONSTRAINT [Order_shippingDistrict_df] DEFAULT N'',
    [shippingProvince] NVARCHAR(120) NOT NULL CONSTRAINT [Order_shippingProvince_df] DEFAULT N'',
    [shippingPostalCode] VARCHAR(20) NULL,
    [deliveryNote] NVARCHAR(500) NULL,
    [shippingFee] DECIMAL(19,0) NOT NULL CONSTRAINT [Order_shippingFee_df] DEFAULT 0,
    [discount] DECIMAL(19,0) NOT NULL CONSTRAINT [Order_discount_df] DEFAULT 0,
    [grandTotal] DECIMAL(19,0) NOT NULL CONSTRAINT [Order_grandTotal_df] DEFAULT 0;

EXEC sp_executesql N'UPDATE [dbo].[Order] SET [grandTotal] = [total] WHERE [grandTotal] = 0';

ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingRecipientName_df];
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingPhone_df];
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingLine1_df];
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingWard_df];
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingDistrict_df];
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_shippingProvince_df];

CREATE TABLE [dbo].[CheckoutIdempotency] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [customerId] BIGINT NOT NULL,
    [key] VARCHAR(160) NOT NULL,
    [requestHash] CHAR(64) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [CheckoutIdempotency_status_df] DEFAULT 'IN_PROGRESS',
    [orderId] BIGINT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CheckoutIdempotency_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CheckoutIdempotency_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CheckoutIdempotency_orderId_key] UNIQUE NONCLUSTERED ([orderId]),
    CONSTRAINT [CheckoutIdempotency_customerId_key_key] UNIQUE NONCLUSTERED ([customerId], [key])
);

CREATE NONCLUSTERED INDEX [Order_shippingAddressId_idx] ON [dbo].[Order]([shippingAddressId]);
CREATE NONCLUSTERED INDEX [CheckoutIdempotency_customerId_createdAt_idx] ON [dbo].[CheckoutIdempotency]([customerId], [createdAt]);
CREATE NONCLUSTERED INDEX [CheckoutIdempotency_status_createdAt_idx] ON [dbo].[CheckoutIdempotency]([status], [createdAt]);

ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_shippingAddressId_fkey]
FOREIGN KEY ([shippingAddressId]) REFERENCES [dbo].[Address]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[CheckoutIdempotency] ADD CONSTRAINT [CheckoutIdempotency_customerId_fkey]
FOREIGN KEY ([customerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[CheckoutIdempotency] ADD CONSTRAINT [CheckoutIdempotency_orderId_fkey]
FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
