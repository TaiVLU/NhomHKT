import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
import type { Environment } from './config/environment.js';
import { requestId } from './middlewares/request-id.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import type { HealthService } from './modules/health/health.service.js';
import type { AuthService } from './modules/auth/auth.service.js';
import { createAuthRouter, createMeAuthRouter } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import type { CatalogService } from './modules/catalog/catalog.service.js';
import {
  createAdminCatalogRouter,
  createPublicCatalogRouter,
} from './modules/catalog/catalog.routes.js';
import type { ProductImageAdapter } from './modules/catalog/product-image.service.js';
import { createProductUploadRouter } from './modules/catalog/upload.routes.js';
import type { AccountService } from './modules/account/account.service.js';
import { createAccountRouter } from './modules/account/account.routes.js';
import { createDocsRouter } from './modules/docs/docs.routes.js';
import { createDiagnosticsRouter } from './modules/health/diagnostics.routes.js';
import type { CartService } from './modules/cart/cart.service.js';
import { createCartRouter } from './modules/cart/cart.routes.js';
import type { CheckoutService } from './modules/checkout/checkout.service.js';
import { createCheckoutRouter } from './modules/checkout/checkout.routes.js';
import type { OrdersService } from './modules/orders/orders.service.js';
import { createAdminOrdersRouter, createOrdersRouter } from './modules/orders/orders.routes.js';
import type { InventoryService } from './modules/inventory/inventory.service.js';
import { createAdminInventoryRouter } from './modules/inventory/inventory.routes.js';
import { createChatbotRouter } from './modules/chatbot/chatbot.routes.js';
import type { ReportingService } from './modules/reporting/reporting.service.js';
import { createAdminReportingRouter } from './modules/reporting/reporting.routes.js';

interface AppDependencies {
  environment: Environment;
  healthService: HealthService;
  authService?: AuthService;
  catalogService?: CatalogService;
  productImageAdapter?: ProductImageAdapter;
  accountService?: AccountService;
  cartService?: CartService;
  checkoutService?: CheckoutService;
  ordersService?: OrdersService;
  inventoryService?: InventoryService;
  reportingService?: ReportingService;
}

export const createApp = ({
  environment,
  healthService,
  authService,
  catalogService,
  productImageAdapter,
  accountService,
  cartService,
  checkoutService,
  ordersService,
  inventoryService,
  reportingService,
}: AppDependencies): Express => {
  const app = express();
  app.set('trust proxy', environment.TRUST_PROXY_HOPS ?? 0);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: environment.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestId);
  app.use('/docs', createDocsRouter());
  app.use('/api/v1/health', createHealthRouter(healthService));
  if (authService) {
    app.use('/api/v1/diagnostics', createDiagnosticsRouter(healthService, authService.tokens));
    app.use('/api/v1/auth', createAuthRouter(authService, environment));
    app.use('/api/v1/me', createMeAuthRouter(authService, environment));
    if (accountService)
      app.use('/api/v1/me', createAccountRouter(accountService, authService.tokens));
    if (cartService) app.use('/api/v1/cart', createCartRouter(cartService, authService.tokens));
    if (checkoutService)
      app.use('/api/v1/checkout', createCheckoutRouter(checkoutService, authService.tokens));
    if (ordersService) {
      app.use('/api/v1/orders', createOrdersRouter(ordersService, authService.tokens));
      app.use('/api/v1/admin/orders', createAdminOrdersRouter(ordersService, authService.tokens));
    }
    if (inventoryService)
      app.use(
        '/api/v1/admin/inventory',
        createAdminInventoryRouter(inventoryService, authService.tokens),
      );
    if (reportingService)
      app.use(
        '/api/v1/admin/dashboard',
        createAdminReportingRouter(reportingService, authService.tokens),
      );
  }
  if (catalogService) {
    app.use('/api/v1/chatbot', createChatbotRouter(catalogService, environment.WEB_ORIGIN));
    app.use('/api/v1', createPublicCatalogRouter(catalogService));
    if (authService) {
      app.use('/api/v1/admin', createAdminCatalogRouter(catalogService, authService.tokens));
      if (productImageAdapter)
        app.use(
          '/api/v1/admin/uploads',
          createProductUploadRouter(authService.tokens, productImageAdapter, catalogService),
        );
    }
  }
  app.use(errorHandler);
  return app;
};
