import type { NextFunction, Request, Response } from 'express';
import { getPrincipal } from './authenticate.js';
import { hasPermission } from '../modules/rbac/permissions.js';
import type { Permission } from '../modules/rbac/permissions.js';
import { AppError } from '../shared/errors/app-error.js';

export const requirePermission =
  (permission: Permission) =>
  (_request: Request, response: Response, next: NextFunction): void => {
    if (!hasPermission(getPrincipal(response).role, permission))
      return next(
        new AppError(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này.'),
      );
    next();
  };
