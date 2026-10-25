import { Router } from 'express';
import multer from 'multer';
import type { TokenService } from '../auth/token.service.js';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { AppError } from '../../shared/errors/app-error.js';
import { validateProductImage, type ProductImageAdapter } from './product-image.service.js';
import type { CatalogService } from './catalog.service.js';

export const createProductUploadRouter = (
  tokens: TokenService,
  adapter: ProductImageAdapter,
  service: CatalogService,
): Router => {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });
  router.post(
    '/images',
    authenticate(tokens),
    requirePermission('PRODUCT_MANAGE'),
    upload.single('file'),
    async (request, response) => {
      const body: unknown = request.body;
      const uploadPurpose =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>).uploadPurpose
          : undefined;
      if (uploadPurpose !== 'PRODUCT' || !request.file)
        throw new AppError(
          400,
          'CATALOG_IMAGE_INVALID',
          'uploadPurpose PRODUCT và file là bắt buộc.',
        );
      const mime = await validateProductImage(request.file);
      const asset = await adapter.upload(request.file.buffer, mime);
      const record = body as Record<string, unknown>;
      const productId = typeof record.productId === 'string' ? record.productId : '';
      const productVariantId =
        typeof record.productVariantId === 'string' ? record.productVariantId : null;
      const altText = typeof record.altText === 'string' ? record.altText.trim().slice(0, 255) : '';
      const sortOrder =
        typeof record.sortOrder === 'string' && /^\d+$/.test(record.sortOrder)
          ? Number(record.sortOrder)
          : 0;
      const isPrimary = record.isPrimary === 'true';
      const attached = await service.attachUploadedAsset(
        productId,
        asset,
        { productVariantId, altText, sortOrder, isPrimary },
        getPrincipal(response),
        {
          ip: request.ip,
          userAgent: request.header('user-agent'),
          requestId: response.locals.requestId as string,
        },
      );
      response
        .status(201)
        .json({ success: true, data: attached, requestId: response.locals.requestId as string });
    },
  );
  return router;
};
