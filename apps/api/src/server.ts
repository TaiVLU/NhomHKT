import { createServer } from 'node:http';
import { createApp } from './app.js';
import { parseEnvironment } from './config/environment.js';
import { disconnectPrisma, prisma } from './database/prisma.js';
import { createHealthService } from './modules/health/health.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { createMailer } from './modules/auth/mailer.js';
import { CatalogService } from './modules/catalog/catalog.service.js';
import {
  CloudinaryProductImageAdapter,
  FakeProductImageAdapter,
} from './modules/catalog/product-image.service.js';
import { AccountService } from './modules/account/account.service.js';
import { CartService } from './modules/cart/cart.service.js';
import { CheckoutService } from './modules/checkout/checkout.service.js';
import { OrdersService } from './modules/orders/orders.service.js';
import { InventoryService } from './modules/inventory/inventory.service.js';
import { ReportingService } from './modules/reporting/reporting.service.js';

const environment = parseEnvironment(process.env);
const authService = new AuthService(prisma, environment, createMailer(environment));
const productImageAdapter =
  environment.PRODUCT_IMAGE_ADAPTER === 'fake'
    ? new FakeProductImageAdapter()
    : new CloudinaryProductImageAdapter(environment);
const catalogService = new CatalogService(prisma, productImageAdapter);
const accountService = new AccountService(prisma);
const cartService = new CartService(prisma);
const checkoutService = new CheckoutService(prisma);
const ordersService = new OrdersService(prisma);
const inventoryService = new InventoryService(prisma);
const reportingService = new ReportingService(prisma);
const app = createApp({
  environment,
  healthService: createHealthService(prisma),
  authService,
  catalogService,
  productImageAdapter,
  accountService,
  cartService,
  checkoutService,
  ordersService,
  inventoryService,
  reportingService,
});
const server = createServer(app);

server.listen(environment.API_PORT, environment.API_HOST, () => {
  process.stdout.write(
    `HKTStore API listening on http://${environment.API_HOST}:${environment.API_PORT}\n`,
  );
});

const shutdown = (): void => {
  server.close(() => {
    void disconnectPrisma().then(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
