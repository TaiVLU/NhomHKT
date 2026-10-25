import { Router, type Response } from 'express';
import type { TokenService } from '../auth/token.service.js';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from './cart.schema.js';
import type { CartService } from './cart.service.js';

const ok = (response: Response, data: unknown, status = 200) =>
  response
    .status(status)
    .json({ success: true, data, requestId: response.locals.requestId as string });

export const createCartRouter = (service: CartService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('CART_SELF'));
  router.get('/', async (_request, response) =>
    ok(response, await service.get(getPrincipal(response).userId)),
  );
  router.post('/items', validateBody(addCartItemSchema), async (request, response) =>
    ok(
      response,
      await service.addItem(getPrincipal(response).userId, addCartItemSchema.parse(request.body)),
      201,
    ),
  );
  router.patch('/items/:id', validateBody(updateCartItemSchema), async (request, response) =>
    ok(
      response,
      await service.updateItem(
        getPrincipal(response).userId,
        cartItemIdSchema.parse(request.params.id),
        updateCartItemSchema.parse(request.body),
      ),
    ),
  );
  router.delete('/items/:id', async (request, response) =>
    ok(
      response,
      await service.removeItem(
        getPrincipal(response).userId,
        cartItemIdSchema.parse(request.params.id),
      ),
    ),
  );
  router.delete('/', async (_request, response) =>
    ok(response, await service.clear(getPrincipal(response).userId)),
  );
  return router;
};
