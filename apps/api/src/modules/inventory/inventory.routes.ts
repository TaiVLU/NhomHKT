import { Router, type Response } from 'express';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import type { TokenService } from '../auth/token.service.js';
import { inventoryAdjustmentSchema, variantIdSchema } from './inventory.schema.js';
import type { InventoryService } from './inventory.service.js';

const ok = (response: Response, data: unknown, status = 200) =>
  response.status(status).json({
    success: true,
    data,
    requestId: response.locals.requestId as string,
  });

export const createAdminInventoryRouter = (
  service: InventoryService,
  tokens: TokenService,
): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('PRODUCT_READ'));
  router.get('/variants/:variantId', async (request, response) =>
    ok(response, await service.detail(variantIdSchema.parse(request.params.variantId))),
  );
  router.post(
    '/adjustments',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(inventoryAdjustmentSchema),
    async (request, response) =>
      ok(
        response,
        await service.adjust(inventoryAdjustmentSchema.parse(request.body), getPrincipal(response)),
        201,
      ),
  );
  return router;
};
