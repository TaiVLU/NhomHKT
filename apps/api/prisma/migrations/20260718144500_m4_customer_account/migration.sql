CREATE TABLE [dbo].[Address] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [userId] BIGINT NOT NULL,
    [recipientName] NVARCHAR(120) NOT NULL,
    [phone] VARCHAR(20) NOT NULL,
    [line1] NVARCHAR(255) NOT NULL,
    [ward] NVARCHAR(120) NOT NULL,
    [district] NVARCHAR(120) NOT NULL,
    [province] NVARCHAR(120) NOT NULL,
    [postalCode] VARCHAR(20),
    [isDefault] BIT NOT NULL CONSTRAINT [Address_isDefault_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Address_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    CONSTRAINT [Address_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Address_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [Address_userId_deletedAt_isDefault_idx]
ON [dbo].[Address]([userId], [deletedAt], [isDefault]);

CREATE NONCLUSTERED INDEX [Address_userId_createdAt_idx]
ON [dbo].[Address]([userId], [createdAt]);

CREATE UNIQUE NONCLUSTERED INDEX [Address_one_active_default_per_user]
ON [dbo].[Address]([userId])
WHERE [isDefault] = 1 AND [deletedAt] IS NULL;
