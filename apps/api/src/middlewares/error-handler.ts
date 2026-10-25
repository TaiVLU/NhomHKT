import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next;
  const appError =
    error instanceof AppError ? error : new AppError(500, 'INTERNAL_ERROR', 'Đã có lỗi xảy ra.');
  response.status(appError.status).json({
    success: false,
    error: { code: appError.code, message: appError.message },
    requestId: response.locals.requestId as string,
  });
};
