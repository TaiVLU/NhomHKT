import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { TokenService } from '../auth/token.service.js';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { validateBody } from '../../middlewares/validate.js';
import type { CatalogService } from './catalog.service.js';
import {
  listQuerySchema,
  imagePatchSchema,
  productSchema,
  productPatchSchema,
  taxonomyPatchSchema,
  taxonomySchema,
  variantPatchSchema,
  variantSchema,
} from './catalog.schema.js';
import type { RequestContext } from '../auth/auth.service.js';

const context = (request: Request, response: Response): RequestContext => ({
  ip: request.ip,
  userAgent: request.header('user-agent'),
  requestId: response.locals.requestId as string,
});
const param = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : '';
const ok = (response: Response, data: unknown, status = 200, meta?: unknown) =>
  response.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
    requestId: response.locals.requestId as string,
  });

export const createPublicCatalogRouter = (service: CatalogService): Router => {
  const router = Router();
  router.get(
    '/products/search-suggestions',
    rateLimit({ windowMs: 60_000, limit: 60 }),
    async (request, response) => {
      const q = typeof request.query.q === 'string' ? request.query.q.trim() : '';
      if (q.length < 2 || q.length > 120) return ok(response, []);
      return ok(response, await service.suggestions(q));
    },
  );
  router.get('/products', async (request, response) => {
    const query = listQuerySchema.parse(request.query);
    const result = await service.publicProducts(query);
    return ok(response, result.data, 200, result.meta);
  });
  router.get('/products/:slug', async (request, response) =>
    ok(response, await service.publicProduct(param(request.params.slug))),
  );
  router.get('/categories', async (_request, response) =>
    ok(response, await service.publicTaxonomy('category')),
  );
  router.get('/categories/:slug', async (request, response) =>
    ok(response, await service.publicTaxonomyDetail('category', param(request.params.slug))),
  );
  router.get('/authors', async (_request, response) =>
    ok(response, await service.publicTaxonomy('author')),
  );
  router.get('/authors/:slug', async (request, response) =>
    ok(response, await service.publicTaxonomyDetail('author', param(request.params.slug))),
  );
  router.get('/publishers', async (_request, response) =>
    ok(response, await service.publicTaxonomy('publisher')),
  );
  router.get('/publishers/:slug', async (request, response) =>
    ok(response, await service.publicTaxonomyDetail('publisher', param(request.params.slug))),
  );
  return router;
};

export const createAdminCatalogRouter = (service: CatalogService, tokens: TokenService): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('PRODUCT_READ'));
  router.get('/products', async (request, response) => {
    const page = Math.max(1, Number(request.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize) || 20));
    const result = await service.adminProducts(getPrincipal(response), { page, pageSize });
    return ok(response, result.data, 200, result.meta);
  });
  router.get('/products/:id', async (request, response) =>
    ok(response, await service.adminProduct(param(request.params.id), getPrincipal(response))),
  );
  router.post(
    '/products',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(productSchema),
    async (request, response) =>
      ok(
        response,
        await service.createProduct(
          productSchema.parse(request.body),
          getPrincipal(response),
          context(request, response),
        ),
        201,
      ),
  );
  router.patch(
    '/products/:id',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(productPatchSchema),
    async (request, response) =>
      ok(
        response,
        await service.patchProduct(
          param(request.params.id),
          productPatchSchema.parse(request.body),
          getPrincipal(response),
          context(request, response),
        ),
      ),
  );
  router.delete('/products/:id', requirePermission('PRODUCT_MANAGE'), async (request, response) => {
    await service.softDeleteProduct(
      param(request.params.id),
      getPrincipal(response),
      context(request, response),
    );
    response.status(204).end();
  });
  router.get('/products/:productId/variants', async (request, response) =>
    ok(
      response,
      (await service.adminProduct(param(request.params.productId), getPrincipal(response)))
        .variants,
    ),
  );
  router.get('/products/:productId/images', async (request, response) =>
    ok(response, await service.listImages(param(request.params.productId))),
  );
  router.patch(
    '/products/:productId/images/:imageId',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(imagePatchSchema),
    async (request, response) =>
      ok(
        response,
        await service.patchImage(
          param(request.params.productId),
          param(request.params.imageId),
          imagePatchSchema.parse(request.body),
          getPrincipal(response),
          context(request, response),
        ),
      ),
  );
  router.delete(
    '/products/:productId/images/:imageId',
    requirePermission('PRODUCT_MANAGE'),
    async (request, response) => {
      await service.deleteImage(
        param(request.params.productId),
        param(request.params.imageId),
        getPrincipal(response),
        context(request, response),
      );
      response.status(204).end();
    },
  );
  router.post(
    '/products/:productId/variants',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(variantSchema),
    async (request, response) =>
      ok(
        response,
        await service.createVariant(
          param(request.params.productId),
          variantSchema.parse(request.body),
          getPrincipal(response),
          context(request, response),
        ),
        201,
      ),
  );
  router.patch(
    '/products/:productId/variants/:variantId',
    requirePermission('PRODUCT_MANAGE'),
    validateBody(variantPatchSchema),
    async (request, response) =>
      ok(
        response,
        await service.setVariantActive(
          param(request.params.productId),
          param(request.params.variantId),
          variantPatchSchema.parse(request.body) as Parameters<
            CatalogService['setVariantActive']
          >[2],
          getPrincipal(response),
          context(request, response),
        ),
      ),
  );
  router.delete(
    '/products/:productId/variants/:variantId',
    requirePermission('PRODUCT_MANAGE'),
    async (request, response) =>
      ok(
        response,
        await service.setVariantActive(
          param(request.params.productId),
          param(request.params.variantId),
          { isActive: false },
          getPrincipal(response),
          context(request, response),
        ),
      ),
  );
  for (const kind of ['category', 'author', 'publisher'] as const) {
    const path = `/${kind === 'category' ? 'categories' : `${kind}s`}`;
    router.get(path, async (_request, response) => ok(response, await service.adminTaxonomy(kind)));
    router.post(
      path,
      requirePermission('PRODUCT_MANAGE'),
      validateBody(taxonomySchema),
      async (request, response) =>
        ok(
          response,
          await service.createTaxonomy(
            kind,
            taxonomySchema.parse(request.body) as Parameters<CatalogService['createTaxonomy']>[1],
            getPrincipal(response),
            context(request, response),
          ),
          201,
        ),
    );
    router.patch(
      `${path}/:id`,
      requirePermission('PRODUCT_MANAGE'),
      validateBody(taxonomyPatchSchema),
      async (request, response) =>
        ok(
          response,
          await service.patchTaxonomy(
            kind,
            param(request.params.id),
            taxonomyPatchSchema.parse(request.body),
            getPrincipal(response),
            context(request, response),
          ),
        ),
    );
    router.delete(`${path}/:id`, requirePermission('PRODUCT_MANAGE'), async (request, response) => {
      await service.softDeleteTaxonomy(
        kind,
        param(request.params.id),
        getPrincipal(response),
        context(request, response),
      );
      response.status(204).end();
    });
  }
  return router;
};
