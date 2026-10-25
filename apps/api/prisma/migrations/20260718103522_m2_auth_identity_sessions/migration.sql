BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [username] VARCHAR(15) NOT NULL,
    [fullName] NVARCHAR(120) NOT NULL,
    [email] VARCHAR(254) NOT NULL,
    [phone] VARCHAR(20) NOT NULL,
    [passwordHash] VARCHAR(255) NOT NULL,
    [role] VARCHAR(20) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CUSTOMER',
    [status] VARCHAR(20) NOT NULL CONSTRAINT [User_status_df] DEFAULT 'ACTIVE',
    [birthday] DATE,
    [gender] VARCHAR(20),
    [cancellationCount] INT NOT NULL CONSTRAINT [User_cancellationCount_df] DEFAULT 0,
    [riskFlag] BIT NOT NULL CONSTRAINT [User_riskFlag_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_phone_key] UNIQUE NONCLUSTERED ([phone]),
    CONSTRAINT [User_role_check] CHECK ([role] IN ('CUSTOMER', 'STAFF', 'ADMIN')),
    CONSTRAINT [User_status_check] CHECK ([status] IN ('ACTIVE', 'LOCKED')),
    CONSTRAINT [User_cancellationCount_check] CHECK ([cancellationCount] >= 0)
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [userId] BIGINT NOT NULL,
    [tokenHash] CHAR(64) NOT NULL,
    [familyId] VARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [revokedAt] DATETIME2,
    [revocationReason] NVARCHAR(255),
    [replacedByTokenId] BIGINT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastUsedAt] DATETIME2,
    [createdIp] VARCHAR(45),
    [userAgent] NVARCHAR(500),
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResetOtp] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [userId] BIGINT NOT NULL,
    [otpHash] CHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [attemptCount] INT NOT NULL CONSTRAINT [PasswordResetOtp_attemptCount_df] DEFAULT 0,
    [verifiedAt] DATETIME2,
    [resetTokenHash] CHAR(64),
    [resetTokenExpiresAt] DATETIME2,
    [consumedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetOtp_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResetOtp_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResetOtp_attemptCount_check] CHECK ([attemptCount] >= 0 AND [attemptCount] <= 5)
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [actorUserId] BIGINT,
    [action] VARCHAR(100) NOT NULL,
    [entityType] VARCHAR(80) NOT NULL,
    [entityId] VARCHAR(100),
    [metadataJson] NVARCHAR(max),
    [requestId] VARCHAR(100),
    [ip] VARCHAR(45),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_userId_expiresAt_revokedAt_idx] ON [dbo].[RefreshToken]([userId], [expiresAt], [revokedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefreshToken_familyId_revokedAt_idx] ON [dbo].[RefreshToken]([familyId], [revokedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PasswordResetOtp_userId_expiresAt_consumedAt_idx] ON [dbo].[PasswordResetOtp]([userId], [expiresAt], [consumedAt]);

-- SQL Server unique constraints allow only one NULL; reset tokens need a filtered unique index.
CREATE UNIQUE NONCLUSTERED INDEX [PasswordResetOtp_resetTokenHash_key]
ON [dbo].[PasswordResetOtp]([resetTokenHash])
WHERE [resetTokenHash] IS NOT NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_actorUserId_createdAt_idx] ON [dbo].[AuditLog]([actorUserId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_action_createdAt_idx] ON [dbo].[AuditLog]([action], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_createdAt_idx] ON [dbo].[AuditLog]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_replacedByTokenId_fkey] FOREIGN KEY ([replacedByTokenId]) REFERENCES [dbo].[RefreshToken]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResetOtp] ADD CONSTRAINT [PasswordResetOtp_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_actorUserId_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
