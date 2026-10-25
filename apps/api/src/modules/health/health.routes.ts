import { Router } from 'express';
import type { Request, Response } from 'express';
import type { HealthService } from './health.service.js';

export const createHealthRouter = (healthService: HealthService): Router => {
  const router = Router();

  router.get('/', async (request: Request, response: Response) => {
    const data = await healthService.check();
    response.status(data.status === 'ok' ? 200 : 503).json({
      success: data.status === 'ok',
      data,
      requestId: response.locals.requestId as string,
    });
  });

  return router;
};
