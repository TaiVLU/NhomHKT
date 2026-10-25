import { Router, type Response } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import type { TokenService } from '../auth/token.service.js';
import { reportingRangeSchema } from './reporting.schema.js';
import type { ReportingService } from './reporting.service.js';
import { AppError } from '../../shared/errors/app-error.js';

const ok = (response: Response, data: unknown) =>
  response.status(200).json({
    success: true,
    data,
    requestId: response.locals.requestId as string,
  });

const parseRange = (query: unknown) => {
  const result = reportingRangeSchema.safeParse(query);
  if (!result.success)
    throw new AppError(400, 'REPORTING_INVALID_RANGE', 'Khoảng ngày báo cáo không hợp lệ.');
  return result.data;
};

export const createAdminReportingRouter = (
  service: ReportingService,
  tokens: TokenService,
): Router => {
  const router = Router();
  router.use(authenticate(tokens), requirePermission('ADMIN_ACCESS'));
  router.get('/overview', async (request, response) =>
    ok(response, await service.report(parseRange(request.query))),
  );
  router.get('/revenue', async (request, response) =>
    ok(response, await service.report(parseRange(request.query))),
  );
  router.get('/product-statistics', async (request, response) =>
    ok(response, await service.report(parseRange(request.query))),
  );
  return router;
};
