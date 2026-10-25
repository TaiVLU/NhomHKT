import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../shared/errors/app-error.js';

export const validateBody =
  (schema: ZodType) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success)
      return next(new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.'));
    request.body = result.data;
    next();
  };
