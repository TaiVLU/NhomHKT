import type { Prisma, PrismaClient, User } from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';
import type { Environment } from '../../config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  MAX_ACTIVE_SESSION_FAMILIES,
  MAX_OTP_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  RESET_TOKEN_TTL_SECONDS,
} from './auth.constants.js';
import {
  hashOpaqueToken,
  hashOtp,
  hashPassword,
  randomFamilyId,
  randomOpaqueToken,
  randomOtp,
  safeHashEqual,
  verifyPassword,
} from './auth.crypto.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';
import type { Mailer } from './mailer.js';
import { TokenService } from './token.service.js';

export interface RequestContext {
  ip: string | undefined;
  userAgent: string | undefined;
  requestId: string | undefined;
}
export interface SafeUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}
export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

const safeUser = (user: User): SafeUser => ({
  id: user.id.toString(),
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
});
const addSeconds = (seconds: number): Date => new Date(Date.now() + seconds * 1000);
const usernameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0] ?? '';
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_');
  const base = normalized.replace(/^_+|_+$/g, '') || 'user';
  return base.length >= 5 ? base.slice(0, 15) : `${base}${'user'.slice(0, 5 - base.length)}`;
};

export class AuthService {
  readonly tokens: TokenService;
  constructor(
    private readonly prisma: PrismaClient,
    private readonly environment: Environment,
    private readonly mailer: Mailer,
  ) {
    this.tokens = new TokenService(environment);
  }

  private async audit(
    tx: Prisma.TransactionClient,
    action: string,
    actorUserId: bigint | null,
    context: RequestContext,
    metadata?: Record<string, string>,
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action,
        actorUserId,
        entityType: 'User',
        entityId: actorUserId?.toString() ?? null,
        requestId: context.requestId ?? null,
        ip: context.ip ?? null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  private async createSession(
    tx: Prisma.TransactionClient,
    user: User,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const active = await tx.refreshToken.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      select: { familyId: true },
    });
    const families = [...new Set(active.map((item) => item.familyId))];
    while (families.length >= MAX_ACTIVE_SESSION_FAMILIES) {
      const oldest = families.shift();
      if (oldest)
        await tx.refreshToken.updateMany({
          where: { userId: user.id, familyId: oldest, revokedAt: null },
          data: { revokedAt: new Date(), revocationReason: 'SESSION_LIMIT' },
        });
    }
    const familyId = randomFamilyId();
    const refreshToken = randomOpaqueToken();
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(refreshToken),
        familyId,
        expiresAt: addSeconds(REFRESH_TOKEN_TTL_SECONDS),
        createdIp: context.ip ?? null,
        userAgent: context.userAgent ?? null,
      },
    });
    return { refreshToken, accessToken: this.tokens.signAccessToken(user.id, user.role, familyId) };
  }

  async register(input: RegisterInput, context: RequestContext): Promise<AuthResult> {
    let username = input.username ?? usernameFromEmail(input.email);
    if (!input.username) {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const taken = await this.prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });
        if (!taken) break;
        const suffix = `${attempt + 1}`.padStart(2, '0');
        username = `${usernameFromEmail(input.email).slice(0, 15 - suffix.length)}${suffix}`;
      }
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email: input.email }, { phone: input.phone }] },
      select: { username: true, email: true, phone: true },
    });
    if (existing?.username === username)
      throw new AppError(409, 'AUTH_USERNAME_CONFLICT', 'Tên đăng nhập đã được sử dụng.');
    if (existing?.email === input.email)
      throw new AppError(409, 'AUTH_EMAIL_CONFLICT', 'Email đã được sử dụng.');
    if (existing?.phone === input.phone)
      throw new AppError(409, 'AUTH_PHONE_CONFLICT', 'Số điện thoại đã được sử dụng.');
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            passwordHash,
            role: 'CUSTOMER',
            status: 'ACTIVE',
          },
        });
        return { user: safeUser(user), ...(await this.createSession(tx, user, context)) };
      });
    } catch (error: unknown) {
      if (error instanceof PrismaNamespace.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new AppError(
          409,
          'AUTH_IDENTIFIER_EXISTS',
          'Username, email hoặc số điện thoại đã được sử dụng.',
        );
      throw error;
    }
  }

  async login(input: LoginInput, admin: boolean, context: RequestContext): Promise<AuthResult> {
    const user = input.email
      ? await this.prisma.user.findUnique({ where: { email: input.email } })
      : await this.prisma.user.findUnique({ where: { username: input.username ?? '' } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash)))
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Thông tin đăng nhập không hợp lệ.');
    if ((admin && user.role === 'CUSTOMER') || (!admin && user.role !== 'CUSTOMER'))
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Thông tin đăng nhập không hợp lệ.');
    if (user.status === 'LOCKED') {
      await this.prisma.$transaction((tx) =>
        this.audit(tx, 'AUTH_LOCKED_LOGIN_ATTEMPT', user.id, context),
      );
      throw new AppError(403, 'AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa.');
    }
    const session = await this.prisma.$transaction((tx) => this.createSession(tx, user, context));
    return { user: safeUser(user), ...session };
  }

  async refresh(rawToken: string, context: RequestContext): Promise<AuthResult> {
    const tokenHash = hashOpaqueToken(rawToken);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
          });
          if (!current)
            throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Phiên đăng nhập không hợp lệ.');
          if (current.user.status === 'LOCKED') {
            await tx.refreshToken.updateMany({
              where: { userId: current.userId, revokedAt: null },
              data: { revokedAt: new Date(), revocationReason: 'ACCOUNT_LOCKED' },
            });
            await this.audit(tx, 'AUTH_LOCKED_REFRESH_ATTEMPT', current.userId, context);
            throw new AppError(403, 'AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa.');
          }
          if (current.revokedAt || current.expiresAt <= new Date()) {
            if (current.revokedAt) {
              await tx.refreshToken.updateMany({
                where: { familyId: current.familyId, revokedAt: null },
                data: { revokedAt: new Date(), revocationReason: 'REUSE_DETECTED' },
              });
              await this.audit(tx, 'AUTH_REFRESH_FAMILY_REVOKED_REUSE', current.userId, context, {
                familyId: current.familyId,
              });
            }
            throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Phiên đăng nhập không hợp lệ.');
          }
          const replacementRaw = randomOpaqueToken();
          const replacement = await tx.refreshToken.create({
            data: {
              userId: current.userId,
              tokenHash: hashOpaqueToken(replacementRaw),
              familyId: current.familyId,
              expiresAt: addSeconds(REFRESH_TOKEN_TTL_SECONDS),
              createdIp: context.ip ?? null,
              userAgent: context.userAgent ?? null,
            },
          });
          const won = await tx.refreshToken.updateMany({
            where: { id: current.id, revokedAt: null },
            data: {
              revokedAt: new Date(),
              revocationReason: 'ROTATED',
              lastUsedAt: new Date(),
              replacedByTokenId: replacement.id,
            },
          });
          if (won.count !== 1)
            throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Phiên đăng nhập không hợp lệ.');
          return {
            user: safeUser(current.user),
            refreshToken: replacementRaw,
            accessToken: this.tokens.signAccessToken(
              current.userId,
              current.user.role,
              current.familyId,
            ),
          };
        },
        { isolationLevel: PrismaNamespace.TransactionIsolationLevel.Serializable },
      );
    } catch (error: unknown) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Phiên đăng nhập không hợp lệ.');
      }
      throw error;
    }
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashOpaqueToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: 'LOGOUT' },
    });
  }

  async session(userId: bigint): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE')
      throw new AppError(401, 'AUTH_UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.');
    return safeUser(user);
  }

  async changePassword(
    userId: bigint,
    currentPassword: string,
    newPassword: string,
    context: RequestContext,
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash)))
      throw new AppError(400, 'PROFILE_CURRENT_PASSWORD_INVALID', 'Mật khẩu hiện tại không đúng.');
    if (await verifyPassword(newPassword, user.passwordHash))
      throw new AppError(
        400,
        'PROFILE_PASSWORD_UNCHANGED',
        'Mật khẩu mới phải khác mật khẩu hiện tại.',
      );
    const passwordHash = await hashPassword(newPassword);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: 'PASSWORD_CHANGED' },
      });
      await this.audit(tx, 'PASSWORD_CHANGED', userId, context);
      return { user: safeUser(updated), ...(await this.createSession(tx, updated, context)) };
    });
  }

  async forgotPassword(email: string, context: RequestContext): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return;
    const latest = await this.prisma.passwordResetOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000)
      return;
    const otp = randomOtp();
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetOtp.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.passwordResetOtp.create({
        data: {
          userId: user.id,
          otpHash: hashOtp(otp, this.environment.OTP_PEPPER),
          expiresAt: addSeconds(OTP_TTL_SECONDS),
        },
      });
    });
    await this.mailer.sendPasswordResetOtp(user.email, otp);
    void context;
  }

  async verifyOtp(email: string, otp: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new AppError(400, 'AUTH_OTP_INVALID', 'OTP không hợp lệ hoặc đã hết hạn.');
    return this.prisma.$transaction(
      async (tx) => {
        const record = await tx.passwordResetOtp.findFirst({
          where: { userId: user.id, consumedAt: null },
          orderBy: { createdAt: 'desc' },
        });
        if (
          !record ||
          record.expiresAt <= new Date() ||
          record.attemptCount >= MAX_OTP_ATTEMPTS ||
          record.verifiedAt
        )
          throw new AppError(400, 'AUTH_OTP_INVALID', 'OTP không hợp lệ hoặc đã hết hạn.');
        const valid = safeHashEqual(record.otpHash, hashOtp(otp, this.environment.OTP_PEPPER));
        if (!valid) {
          await tx.passwordResetOtp.updateMany({
            where: { id: record.id, attemptCount: record.attemptCount, consumedAt: null },
            data: { attemptCount: { increment: 1 } },
          });
          throw new AppError(400, 'AUTH_OTP_INVALID', 'OTP không hợp lệ hoặc đã hết hạn.');
        }
        const raw = randomOpaqueToken();
        const updated = await tx.passwordResetOtp.updateMany({
          where: {
            id: record.id,
            attemptCount: record.attemptCount,
            verifiedAt: null,
            consumedAt: null,
          },
          data: {
            verifiedAt: new Date(),
            resetTokenHash: hashOpaqueToken(raw),
            resetTokenExpiresAt: addSeconds(RESET_TOKEN_TTL_SECONDS),
          },
        });
        if (updated.count !== 1)
          throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Vui lòng thử lại.');
        return raw;
      },
      { isolationLevel: PrismaNamespace.TransactionIsolationLevel.Serializable },
    );
  }

  async resetPassword(
    rawResetToken: string,
    newPassword: string,
    context: RequestContext,
  ): Promise<void> {
    const tokenHash = hashOpaqueToken(rawResetToken);
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction(
      async (tx) => {
        const record = await tx.passwordResetOtp.findFirst({
          where: { resetTokenHash: tokenHash },
          include: { user: true },
        });
        if (
          !record ||
          !record.verifiedAt ||
          record.consumedAt ||
          !record.resetTokenExpiresAt ||
          record.resetTokenExpiresAt <= new Date()
        )
          throw new AppError(
            400,
            'AUTH_RESET_TOKEN_INVALID',
            'Reset token không hợp lệ hoặc đã hết hạn.',
          );
        const consumed = await tx.passwordResetOtp.updateMany({
          where: { id: record.id, consumedAt: null, resetTokenHash: tokenHash },
          data: { consumedAt: new Date(), resetTokenHash: null },
        });
        if (consumed.count !== 1)
          throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Vui lòng thử lại.');
        await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
        await tx.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date(), revocationReason: 'PASSWORD_RESET' },
        });
        await this.audit(tx, 'AUTH_PASSWORD_RESET', record.userId, context);
      },
      { isolationLevel: PrismaNamespace.TransactionIsolationLevel.Serializable },
    );
  }
}
