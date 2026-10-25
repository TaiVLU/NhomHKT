import { Router, type Response } from 'express';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { TokenService } from '../auth/token.service.js';
import { checkoutSchema, idempotencyKeySchema } from './checkout.schema.js';
import type { CheckoutService } from './checkout.service.js';

const ok = (response: Response, data: unknown, status = 200) =>
  response
    .status(status)
    .json({ success: true, data, requestId: response.locals.requestId as string });

const idempotencyKeyOf = (value: string | undefined) => {
  if (!value)
    throw new AppError(
      400,
      'CHECKOUT_IDEMPOTENCY_KEY_REQUIRED',
      'Idempotency-Key header is required for checkout.',
    );
  const parsed = idempotencyKeySchema.safeParse(value);
  if (!parsed.success)
    throw new AppError(
      400,
      'CHECKOUT_IDEMPOTENCY_KEY_INVALID',
      'Idempotency-Key header is invalid.',
    );
  return parsed.data;
};

export const createCheckoutRouter = (service: CheckoutService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('CHECKOUT_SELF'));
  router.post('/', validateBody(checkoutSchema), async (request, response) =>
    ok(
      response,
      await service.checkout(
        getPrincipal(response).userId,
        checkoutSchema.parse(request.body),
        idempotencyKeyOf(request.header('idempotency-key')),
      ),
      201,
    ),
  );
  return router;
};
