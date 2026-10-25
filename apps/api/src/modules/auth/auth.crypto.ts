import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcrypt';
import { BCRYPT_COST } from './auth.constants.js';

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_COST);
export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
export const randomOpaqueToken = (): string => randomBytes(32).toString('base64url');
export const randomFamilyId = (): string => randomBytes(24).toString('base64url');
export const randomOtp = (): string =>
  String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
export const hashOpaqueToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
export const hashOtp = (otp: string, pepper: string): string =>
  createHmac('sha256', pepper).update(otp).digest('hex');
export const safeHashEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};
