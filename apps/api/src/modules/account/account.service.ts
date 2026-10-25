import { Prisma, type Address, type PrismaClient, type User } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import type { RequestContext } from '../auth/auth.service.js';
import type { AddressInput, AddressPatchInput, ProfilePatchInput } from './account.schema.js';

export const profileDto = (user: User) => ({
  id: user.id.toString(),
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  birthday: user.birthday?.toISOString().slice(0, 10) ?? null,
  gender: user.gender,
  status: user.status,
  createdAt: user.createdAt.toISOString(),
});
export const addressDto = (address: Address) => ({
  id: address.id.toString(),
  recipientName: address.recipientName,
  phone: address.phone,
  line1: address.line1,
  ward: address.ward,
  district: address.district,
  province: address.province,
  postalCode: address.postalCode,
  isDefault: address.isDefault,
  createdAt: address.createdAt.toISOString(),
  updatedAt: address.updatedAt.toISOString(),
});

export class AccountService {
  constructor(private readonly prisma: PrismaClient) {}

  private audit(
    tx: Prisma.TransactionClient,
    action: string,
    userId: bigint,
    entityType: string,
    entityId: bigint,
    context: RequestContext,
    fields?: string[],
  ) {
    return tx.auditLog.create({
      data: {
        actorUserId: userId,
        action,
        entityType,
        entityId: entityId.toString(),
        requestId: context.requestId ?? null,
        ip: context.ip ?? null,
        metadataJson: fields ? JSON.stringify({ fields }) : null,
      },
    });
  }

  async profile(userId: bigint) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Không tìm thấy hồ sơ.');
    return profileDto(user);
  }

  async updateProfile(userId: bigint, input: ProfilePatchInput, context: RequestContext) {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const data: Prisma.UserUpdateInput = {
          ...(input.fullName !== undefined
            ? { fullName: input.fullName.replace(/\s+/g, ' ') }
            : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.birthday !== undefined
            ? { birthday: input.birthday ? new Date(`${input.birthday}T00:00:00.000Z`) : null }
            : {}),
        };
        const updated = await tx.user.update({
          where: { id: userId },
          data,
        });
        await this.audit(
          tx,
          'PROFILE_UPDATED',
          userId,
          'User',
          userId,
          context,
          Object.keys(input),
        );
        return updated;
      });
      return profileDto(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new AppError(409, 'PROFILE_PHONE_CONFLICT', 'Số điện thoại đã được sử dụng.');
      throw error;
    }
  }

  async addresses(userId: bigint) {
    return (
      await this.prisma.address.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      })
    ).map(addressDto);
  }

  private async owned(tx: Prisma.TransactionClient, userId: bigint, id: bigint) {
    const address = await tx.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    return address;
  }

  async address(userId: bigint, id: bigint) {
    const address = await this.prisma.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!address) throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
    return addressDto(address);
  }

  async createAddress(userId: bigint, input: AddressInput, context: RequestContext) {
    const address = await this.prisma.$transaction(async (tx) => {
      const activeCount = await tx.address.count({ where: { userId, deletedAt: null } });
      const makeDefault = activeCount === 0 || input.isDefault === true;
      if (makeDefault)
        await tx.address.updateMany({
          where: { userId, deletedAt: null, isDefault: true },
          data: { isDefault: false },
        });
      const created = await tx.address.create({
        data: {
          userId,
          recipientName: input.recipientName,
          phone: input.phone,
          line1: input.line1,
          ward: input.ward,
          district: input.district,
          province: input.province,
          ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
          isDefault: makeDefault,
        },
      });
      await this.audit(tx, 'ADDRESS_CREATED', userId, 'Address', created.id, context);
      return created;
    });
    return addressDto(address);
  }

  async updateAddress(
    userId: bigint,
    id: bigint,
    input: AddressPatchInput,
    context: RequestContext,
  ) {
    const address = await this.prisma.$transaction(async (tx) => {
      await this.owned(tx, userId, id);
      const data: Prisma.AddressUpdateInput = {
        ...(input.recipientName !== undefined ? { recipientName: input.recipientName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
        ...(input.ward !== undefined ? { ward: input.ward } : {}),
        ...(input.district !== undefined ? { district: input.district } : {}),
        ...(input.province !== undefined ? { province: input.province } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      };
      const updated = await tx.address.update({ where: { id }, data });
      await this.audit(tx, 'ADDRESS_UPDATED', userId, 'Address', id, context, Object.keys(input));
      return updated;
    });
    return addressDto(address);
  }

  async setDefault(userId: bigint, id: bigint, context: RequestContext) {
    const address = await this.prisma.$transaction(
      async (tx) => {
        await this.owned(tx, userId, id);
        await tx.address.updateMany({
          where: { userId, deletedAt: null, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
        const updated = await tx.address.update({ where: { id }, data: { isDefault: true } });
        await this.audit(tx, 'ADDRESS_DEFAULT_CHANGED', userId, 'Address', id, context);
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return addressDto(address);
  }

  async deleteAddress(userId: bigint, id: bigint, context: RequestContext) {
    await this.prisma.$transaction(async (tx) => {
      const current = await this.owned(tx, userId, id);
      await tx.address.update({
        where: { id },
        data: { deletedAt: new Date(), isDefault: false },
      });
      if (current.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId, deletedAt: null },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });
        if (replacement)
          await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
      await this.audit(tx, 'ADDRESS_DELETED', userId, 'Address', id, context);
    });
  }
}
