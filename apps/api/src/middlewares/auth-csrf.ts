import type { NextFunction, Request, Response } from 'express';
import type { Environment } from '../config/environment.js';
import { AppError } from '../shared/errors/app-error.js';

export const authCsrf =
  (environment: Environment) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const origin = request.header('origin');
    const referer = request.header('referer');
    const validSource =
      origin === environment.WEB_ORIGIN || referer?.startsWith(`${environment.WEB_ORIGIN}/`);
    if (!validSource || request.header('x-hktstore-client') !== 'web')
      return next(new AppError(403, 'AUTH_CSRF_REJECTED', 'Yêu cầu không hợp lệ'));
    next();
  };