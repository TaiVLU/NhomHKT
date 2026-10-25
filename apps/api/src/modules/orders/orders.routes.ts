import { Router, type Response } from 'express';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import type { TokenService } from '../auth/token.service.js';
import {
  adminOrderListQuerySchema,
  orderListQuerySchema,
  orderNumberSchema,
  orderTransitionSchema,
} from './orders.schema.js';
import type { OrdersService } from './orders.service.js';

const ok = (response: Response, data: unknown, status = 200, meta?: unknown) =>
  response.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
    requestId: response.locals.requestId as string,
  });

export const createOrdersRouter = (service: OrdersService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('ORDER_SELF'));
  router.get('/', async (request, response) => {
    const result = await service.list(
      getPrincipal(response).userId,
      orderListQuerySchema.parse(request.query),
    );
    ok(response, result.data, 200, result.meta);
  });
  router.get('/:orderNumber', async (request, response) =>
    ok(
      response,
      await service.detail(
        getPrincipal(response).userId,
        orderNumberSchema.parse(request.params.orderNumber),
      ),
    ),
  );
  return router;
};

export const createAdminOrdersRouter = (service: OrdersService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('ORDER_READ'));
  router.get('/', async (request, response) => {
    const result = await service.adminList(adminOrderListQuerySchema.parse(request.query));
    ok(response, result.data, 200, result.meta);
  });
  router.post(
    '/:orderNumber/transitions',
    requirePermission('ORDER_MANAGE'),
    validateBody(orderTransitionSchema),
    async (request, response) =>
      ok(
        response,
        await service.transition(
          orderNumberSchema.parse(request.params.orderNumber),
          orderTransitionSchema.parse(request.body),
          getPrincipal(response),
        ),
      ),
  );
  router.get('/:orderNumber', async (request, response) =>
    ok(response, await service.adminDetail(orderNumberSchema.parse(request.params.orderNumber))),
  );
  return router;
};
