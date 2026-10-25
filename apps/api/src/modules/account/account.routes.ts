import { Router, type Request, type Response } from 'express';
import type { TokenService } from '../auth/token.service.js';
import type { RequestContext } from '../auth/auth.service.js';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  addressIdSchema,
  addressPatchSchema,
  addressSchema,
  profilePatchSchema,
} from './account.schema.js';
import type { AccountService } from './account.service.js';

const contextOf = (request: Request, response: Response): RequestContext => ({
  ip: request.ip,
  userAgent: request.header('user-agent'),
  requestId: response.locals.requestId as string,
});
const ok = (response: Response, data: unknown, status = 200) =>
  response
    .status(status)
    .json({ success: true, data, requestId: response.locals.requestId as string });

export const createAccountRouter = (service: AccountService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens));
  router.get('/profile', requirePermission('PROFILE_SELF'), async (_request, response) =>
    ok(response, await service.profile(getPrincipal(response).userId)),
  );
  router.patch(
    '/profile',
    requirePermission('PROFILE_SELF'),
    validateBody(profilePatchSchema),
    async (request, response) =>
      ok(
        response,
        await service.updateProfile(
          getPrincipal(response).userId,
          profilePatchSchema.parse(request.body),
          contextOf(request, response),
        ),
      ),
  );
  router.get('/addresses', requirePermission('ADDRESS_SELF'), async (_request, response) =>
    ok(response, await service.addresses(getPrincipal(response).userId)),
  );
  router.post(
    '/addresses',
    requirePermission('ADDRESS_SELF'),
    validateBody(addressSchema),
    async (request, response) =>
      ok(
        response,
        await service.createAddress(
          getPrincipal(response).userId,
          addressSchema.parse(request.body),
          contextOf(request, response),
        ),
        201,
      ),
  );
  router.get('/addresses/:id', requirePermission('ADDRESS_SELF'), async (request, response) =>
    ok(
      response,
      await service.address(
        getPrincipal(response).userId,
        BigInt(addressIdSchema.parse(request.params.id)),
      ),
    ),
  );
  router.patch(
    '/addresses/:id',
    requirePermission('ADDRESS_SELF'),
    validateBody(addressPatchSchema),
    async (request, response) =>
      ok(
        response,
        await service.updateAddress(
          getPrincipal(response).userId,
          BigInt(addressIdSchema.parse(request.params.id)),
          addressPatchSchema.parse(request.body),
          contextOf(request, response),
        ),
      ),
  );
  router.put(
    '/addresses/:id/default',
    requirePermission('ADDRESS_SELF'),
    async (request, response) =>
      ok(
        response,
        await service.setDefault(
          getPrincipal(response).userId,
          BigInt(addressIdSchema.parse(request.params.id)),
          contextOf(request, response),
        ),
      ),
  );
  router.delete('/addresses/:id', requirePermission('ADDRESS_SELF'), async (request, response) => {
    await service.deleteAddress(
      getPrincipal(response).userId,
      BigInt(addressIdSchema.parse(request.params.id)),
      contextOf(request, response),
    );
    response.status(204).end();
  });
  return router;
};
