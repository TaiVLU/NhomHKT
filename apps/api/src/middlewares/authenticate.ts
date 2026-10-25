import type { NextFunction, Request, Response } from 'express';
import type { TokenService } from '../modules/auth/token.service.js';
import { isRole } from '../modules/rbac/permissions.js';
import { AppError } from '../shared/errors/app-error.js';

export interface AuthPrincipal {
  userId: bigint;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  familyId: string;
}
export const getPrincipal = (response: Response): AuthPrincipal =>
  response.locals.principal as AuthPrincipal;

export const authenticate =
  (tokens: TokenService) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer '))
      return next(new AppError(401, 'AUTH_UNAUTHORIZED', 'Cần đăng nhập.'));
    try {
      const payload = tokens.verifyAccessToken(header.slice(7));
      if (!/^\d+$/.test(payload.sub) || !isRole(payload.role)) throw new Error('principal');
      response.locals.principal = {
        userId: BigInt(payload.sub),
        role: payload.role,
        familyId: payload.sid,
      } satisfies AuthPrincipal;
      next();
    } catch (error: unknown) {
      next(error);
    }
  };
