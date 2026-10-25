import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const requestId = (request: Request, response: Response, next: NextFunction): void => {
  const incoming = request.header('x-request-id');
  const id = incoming && incoming.length <= 100 ? incoming : randomUUID();
  response.locals.requestId = id;
  response.setHeader('x-request-id', id);
  next();
};
