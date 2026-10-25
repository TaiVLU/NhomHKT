import { Router } from 'express';
import type { Request, Response } from 'express';
import type { TokenService } from '../auth/token.service.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import type { HealthService } from './health.service.js';

const startedAt = Date.now();

export const createDiagnosticsRouter = (
  healthService: HealthService,
  tokens: TokenService,
): Router => {
  const router = Router();
  router.get(
    '/',
    authenticate(tokens),
    requirePermission('API_DIAGNOSTICS'),
    async (_request: Request, response: Response) => {
      const health = await healthService.check();
      const componentStatus = health.database.status === 'up' ? 'up' : 'down';
      const status = health.status === 'ok' ? 'up' : 'degraded';
      response.status(health.status === 'ok' ? 200 : 503).json({
        success: health.status === 'ok',
        data: {
          status,
          api: 'up',
          environment: 'valid',
          database: componentStatus,
          prisma: componentStatus,
          modules: {
            auth: 'up',
            account: 'up',
            catalog: 'up',
            admin: 'up',
            staff: 'up',
            docs: 'up',
          },
          apiVersion: 'v1',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        },
        requestId: response.locals.requestId as string,
      });
    },
  );
  return router;
};
