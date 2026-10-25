const idSchema = {
  type: 'string',
  pattern: '^\\d+$',
  description: 'BIGINT serialized as a JSON string. Never parse this value as a JavaScript number.',
} as const;

const successEnvelope = (schema: Record<string, unknown>) => ({
  type: 'object',
  required: ['success', 'data', 'requestId'],
  properties: {
    success: { type: 'boolean', example: true },
    data: schema,
    requestId: { type: 'string', format: 'uuid' },
  },
});

const errorEnvelope = {
  type: 'object',
  required: ['success', 'error', 'requestId'],
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: { code: { type: 'string' }, message: { type: 'string' } },
    },
    requestId: { type: 'string', format: 'uuid' },
  },
} as const;

const bearer = [{ bearerAuth: [] }];
const response = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: { 'application/json': { schema } },
});
const protectedResponse = {
  401: response('Bearer token is missing or invalid.', errorEnvelope),
  403: response('Authenticated user lacks the documented permission.', errorEnvelope),
};

export const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'HKT Store API',
    version: 'v1',
    description:
      'HKT Store local API. All database BIGINT identifiers are serialized as strings in JSON. This specification intentionally contains no credentials, tokens, or sensitive example values.',
  },
  servers: [{ url: 'http://localhost:4000/api/v1', description: 'Local development API' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Account' },
    { name: 'Address' },
    { name: 'Checkout' },
    { name: 'Orders' },
    { name: 'Admin Orders' },
    { name: 'Public Catalog' },
    { name: 'Admin Catalog' },
    { name: 'Staff Catalog' },
    { name: 'Admin Inventory' },
    { name: 'Upload' },
    { name: 'Diagnostics' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Public liveness and database health check',
        responses: {
          200: response('API and database are up.', successEnvelope({ type: 'object' })),
          503: response(
            'API is up but database is unavailable.',
            successEnvelope({ type: 'object' }),
          ),
        },
      },
    },
    '/diagnostics': {
      get: {
        tags: ['Diagnostics'],
        summary: 'Admin-only safe diagnostics',
        security: bearer,
        description:
          'Requires API_DIAGNOSTICS (Admin). Returns component state without configuration values, secrets, paths, sessions, or stack traces.',
        responses: {
          200: response('Diagnostics snapshot.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'fullName', 'email', 'phone', 'password'],
                properties: {
                  username: { type: 'string' },
                  fullName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          201: response('Account and session created.', successEnvelope({ type: 'object' })),
          400: response('Validation error.', errorEnvelope),
          409: response('Identity conflict.', errorEnvelope),
          429: response('Rate limited.', errorEnvelope),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Customer login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: response('Session created.', successEnvelope({ type: 'object' })),
          401: response('Invalid credentials.', errorEnvelope),
          429: response('Rate limited.', errorEnvelope),
        },
      },
    },
    '/auth/admin/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin or Staff login',
        description:
          'Accepts either email or username plus password. The local Admin/Staff UI uses email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                additionalProperties: false,
                properties: {
                  email: { type: 'string', format: 'email' },
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: response('Privileged session created.', successEnvelope({ type: 'object' })),
          401: response('Invalid or non-privileged credentials.', errorEnvelope),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        description: 'Uses the httpOnly refresh cookie and CSRF protection.',
        responses: {
          200: response('Rotated session.', successEnvelope({ type: 'object' })),
          401: response('Invalid refresh session.', errorEnvelope),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out current refresh session',
        responses: {
          204: { description: 'Session cleared.' },
          403: response('CSRF validation failed.', errorEnvelope),
        },
      },
    },
    '/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Read current session',
        security: bearer,
        responses: {
          200: response('Current user.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
    },
    '/me/profile': {
      get: {
        tags: ['Account'],
        summary: 'Read own profile',
        security: bearer,
        responses: {
          200: response('Profile.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
      patch: {
        tags: ['Account'],
        summary: 'Update own profile',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          200: response('Profile updated.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
    },
    '/me/password': {
      patch: {
        tags: ['Account'],
        summary: 'Change own password',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', format: 'password' },
                  newPassword: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: response('Password and session updated.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
    },
    '/me/addresses': {
      get: {
        tags: ['Address'],
        summary: 'List own addresses',
        security: bearer,
        responses: {
          200: response(
            'Addresses.',
            successEnvelope({ type: 'array', items: { type: 'object', properties: { id: idSchema } } }),
          ),
          ...protectedResponse,
        },
      },
      post: {
        tags: ['Address'],
        summary: 'Create own address',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          201: response(
            'Address created.',
            successEnvelope({ type: 'object', properties: { id: idSchema } }),
          ),
          ...protectedResponse,
        },
      },
    },
    '/me/addresses/{id}': {
      get: {
        tags: ['Address'],
        summary: 'Read one owned address',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: idSchema }],
        responses: {
          200: response('Address.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
      patch: {
        tags: ['Address'],
        summary: 'Update one owned address',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: idSchema }],
        responses: {
          200: response('Address updated.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
      delete: {
        tags: ['Address'],
        summary: 'Soft-delete one owned address',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: idSchema }],
        responses: { 204: { description: 'Address deleted.' }, ...protectedResponse },
      },
    },
    '/me/addresses/{id}/default': {
      put: {
        tags: ['Address'],
        summary: 'Set default owned address',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: idSchema }],
        responses: {
          200: response('Default address updated.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
    },
    '/checkout': {
      post: {
        tags: ['Checkout'],
        summary: 'Create an order from the authenticated customer cart',
        security: bearer,
        description:
          'Requires CHECKOUT_SELF and Idempotency-Key. Body accepts only shippingAddressId, paymentMethod=COD, and optional deliveryNote. Backend owns cart lookup, price validation, inventory consumption, shipping/payment/total snapshots, order creation, and cart clearing. Reusing the same key with the same request returns the original order; reusing it with a different request returns 409.',
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            schema: { type: 'string', minLength: 8, maxLength: 160 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingAddressId', 'paymentMethod'],
                additionalProperties: false,
                properties: {
                  shippingAddressId: idSchema,
                  paymentMethod: { type: 'string', enum: ['COD'] },
                  deliveryNote: { type: ['string', 'null'], maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: response(
            'Order confirmation.',
            successEnvelope({
              type: 'object',
              required: [
                'orderNumber',
                'orderStatus',
                'paymentMethod',
                'paymentStatus',
                'shippingAddress',
                'items',
                'subtotal',
                'shippingFee',
                'discount',
                'grandTotal',
                'createdAt',
              ],
              properties: {
                orderNumber: { type: 'string' },
                orderStatus: { type: 'string' },
                paymentMethod: { type: 'string', enum: ['COD'] },
                paymentStatus: { type: 'string', enum: ['UNPAID'] },
                shippingAddress: { type: 'object' },
                items: { type: 'array', items: { type: 'object' } },
                subtotal: { type: 'number' },
                shippingFee: { type: 'number' },
                discount: { type: 'number' },
                grandTotal: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            }),
          ),
          400: response(
            'Invalid request, empty cart, stock, or unavailable product/variant.',
            errorEnvelope,
          ),
          404: response('Shipping address not owned by customer.', errorEnvelope),
          409: response(
            'Idempotency conflict, price change, or transaction conflict.',
            errorEnvelope,
          ),
          ...protectedResponse,
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List current customer orders',
        security: bearer,
        description:
          'Requires ORDER_SELF. Returns only orders owned by the authenticated customer, newest first.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
        ],
        responses: {
          200: response(
            'Owned order page.',
            successEnvelope({ type: 'array', items: { type: 'object' } }),
          ),
          ...protectedResponse,
        },
      },
    },
    '/orders/{orderNumber}': {
      get: {
        tags: ['Orders'],
        summary: 'Read one current customer order',
        security: bearer,
        description:
          'Requires ORDER_SELF. Ownership is enforced server-side; another customer order returns the same safe 404 as a missing order.',
        parameters: [
          { name: 'orderNumber', in: 'path', required: true, schema: { type: 'string', maxLength: 32 } },
        ],
        responses: {
          200: response('Owned order detail.', successEnvelope({ type: 'object' })),
          404: response('Order not found or not owned by current customer.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/orders': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Read-only admin order list',
        security: bearer,
        description:
          'Requires ORDER_READ. Supports page, pageSize, search, orderStatus, paymentStatus, paymentMethod, dateFrom, dateTo, and sort. dateFrom is inclusive; dateTo includes the supplied Vietnam calendar day.',
        responses: {
          200: response(
            'Admin order page.',
            successEnvelope({ type: 'array', items: { type: 'object' } }),
          ),
          ...protectedResponse,
        },
      },
    },
    '/admin/orders/{orderNumber}': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Read-only admin order detail with status history',
        security: bearer,
        description:
          'Requires ORDER_READ. Uses immutable checkout shipping and total snapshots; item unit prices are historical OrderItem snapshots. Returns full admin-safe statusHistory with actor snapshots and internal notes.',
        parameters: [
          { name: 'orderNumber', in: 'path', required: true, schema: { type: 'string', maxLength: 32 } },
        ],
        responses: {
          200: response(
            'Admin order detail.',
            successEnvelope({
              type: 'object',
              properties: {
                statusHistory: { type: 'array', items: { type: 'object' } },
                allowedTransitions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED'],
                  },
                },
              },
            }),
          ),
          404: response('Order not found.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/orders/{orderNumber}/transitions': {
      post: {
        tags: ['Admin Orders'],
        summary: 'Execute an order status transition',
        security: bearer,
        description:
          'Requires ORDER_MANAGE. This is a command endpoint; arbitrary status patching is not supported. Valid workflow: PENDING_CONFIRMATION->CONFIRMED/CANCELLED, CONFIRMED->PACKING/CANCELLED, PACKING->SHIPPING/CANCELLED, SHIPPING->COMPLETED. expectedCurrentStatus provides optimistic concurrency protection for stale admin screens. Cancellation restores inventory inside the same transaction. COMPLETED marks COD paymentStatus as PAID.',
        parameters: [
          { name: 'orderNumber', in: 'path', required: true, schema: { type: 'string', maxLength: 32 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetStatus'],
                additionalProperties: false,
                properties: {
                  targetStatus: {
                    type: 'string',
                    enum: ['CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED'],
                  },
                  expectedCurrentStatus: {
                    type: 'string',
                    enum: [
                      'PENDING_CONFIRMATION',
                      'CONFIRMED',
                      'PACKING',
                      'SHIPPING',
                      'COMPLETED',
                      'CANCELLED',
                    ],
                  },
                  note: {
                    type: 'string',
                    maxLength: 500,
                    description: 'Required for cancellation, optional otherwise.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: response('Updated admin order detail.', successEnvelope({ type: 'object' })),
          400: response('Invalid transition or missing cancellation reason.', errorEnvelope),
          409: response('Status conflict or inventory restoration failure.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/dashboard/overview': {
      get: {
        tags: ['Admin Reporting'],
        summary: 'Operational dashboard overview',
        security: bearer,
        description:
          'Requires ADMIN_ACCESS. Read-only for Admin and Staff. Accepts an optional paired from/to range in strict YYYY-MM-DD, inclusive in Asia/Ho_Chi_Minh, maximum 366 days. Revenue recognizes only current COMPLETED orders and uses immutable Order.grandTotal and OrderItem snapshots. Aggregate responses contain no customer PII.',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: response('Dashboard report.', successEnvelope({ type: 'object' })),
          400: response('Invalid or excessive date range.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/dashboard/revenue': {
      get: {
        tags: ['Admin Reporting'],
        summary: 'Revenue analytics',
        security: bearer,
        description:
          'Same bounded range and revenue policy as overview. Returns numeric summary metrics, equal-duration comparison, zero-filled daily buckets, status distribution, and bounded top-product lists.',
        responses: {
          200: response('Revenue report.', successEnvelope({ type: 'object' })),
          400: response('Invalid or excessive date range.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/dashboard/product-statistics': {
      get: {
        tags: ['Admin Reporting'],
        summary: 'Product and inventory statistics',
        security: bearer,
        description:
          'Read-only snapshot-based product/category sales and current inventory analytics. Historical products remain reportable; missing category snapshots use Không xác định. No cost or margin fields are returned.',
        responses: {
          200: response('Product statistics report.', successEnvelope({ type: 'object' })),
          400: response('Invalid or excessive date range.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/products': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public product listing',
        description:
          'Public. Supports q, category, author, publisher, sort, page and pageSize query parameters.',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          200: response(
            'Product page.',
            successEnvelope({ type: 'array', items: { type: 'object', properties: { id: idSchema } } }),
          ),
        },
      },
    },
    '/products/search-suggestions': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public search suggestions',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
        ],
        responses: {
          200: response('Suggestions.', successEnvelope({ type: 'array', items: { type: 'object' } })),
          429: response('Rate limited.', errorEnvelope),
        },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public product detail',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: response(
            'Product.',
            successEnvelope({ type: 'object', properties: { id: idSchema } }),
          ),
          404: response('Product not found.', errorEnvelope),
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public category list',
        responses: {
          200: response(
            'Categories.',
            successEnvelope({ type: 'array', items: { type: 'object', properties: { id: idSchema } } }),
          ),
        },
      },
    },
    '/authors': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public author list',
        responses: {
          200: response(
            'Authors.',
            successEnvelope({ type: 'array', items: { type: 'object', properties: { id: idSchema } } }),
          ),
        },
      },
    },
    '/publishers': {
      get: {
        tags: ['Public Catalog'],
        summary: 'Public publisher list',
        responses: {
          200: response(
            'Publishers.',
            successEnvelope({ type: 'array', items: { type: 'object', properties: { id: idSchema } } }),
          ),
        },
      },
    },
    '/admin/products': {
      get: {
        tags: ['Admin Catalog', 'Staff Catalog'],
        summary: 'List catalog products for Admin/Staff',
        security: bearer,
        description: 'Requires PRODUCT_READ. Staff is read-only.',
        responses: {
          200: response('Catalog product page.', successEnvelope({ type: 'array' })),
          ...protectedResponse,
        },
      },
      post: {
        tags: ['Admin Catalog'],
        summary: 'Create product',
        security: bearer,
        description: 'Requires PRODUCT_MANAGE (Admin).',
        responses: {
          201: response(
            'Product created.',
            successEnvelope({ type: 'object', properties: { id: idSchema } }),
          ),
          ...protectedResponse,
        },
      },
    },
    '/admin/products/{id}': {
      get: {
        tags: ['Admin Catalog', 'Staff Catalog'],
        summary: 'Read catalog product',
        security: bearer,
        parameters: [{ name: 'id', in: 'path', required: true, schema: idSchema }],
        responses: {
          200: response('Catalog product.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
      patch: {
        tags: ['Admin Catalog'],
        summary: 'Update product',
        security: bearer,
        description: 'Requires PRODUCT_MANAGE (Admin).',
        responses: {
          200: response('Product updated.', successEnvelope({ type: 'object' })),
          ...protectedResponse,
        },
      },
      delete: {
        tags: ['Admin Catalog'],
        summary: 'Soft-delete product',
        security: bearer,
        description: 'Requires PRODUCT_MANAGE (Admin).',
        responses: { 204: { description: 'Product deleted.' }, ...protectedResponse },
      },
    },
    '/admin/inventory/variants/{variantId}': {
      get: {
        tags: ['Admin Inventory'],
        summary: 'Read inventory and immutable adjustment ledger for one variant',
        security: bearer,
        description:
          'Requires PRODUCT_READ. Returns current on-hand, reserved, available quantities and the newest ledger entries. Staff with product read permission can inspect history but cannot adjust stock.',
        parameters: [{ name: 'variantId', in: 'path', required: true, schema: idSchema }],
        responses: {
          200: response(
            'Inventory detail and ledger.',
            successEnvelope({
              type: 'object',
              required: [
                'variantId',
                'onHandQuantity',
                'reservedQuantity',
                'availableQuantity',
                'ledger',
              ],
              properties: {
                variantId: idSchema,
                sku: { type: 'string' },
                onHandQuantity: { type: 'integer' },
                reservedQuantity: { type: 'integer' },
                availableQuantity: { type: 'integer' },
                ledger: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: idSchema,
                      adjustmentType: {
                        type: 'string',
                        enum: ['RECEIVE_STOCK', 'MANUAL_INCREASE', 'MANUAL_DECREASE', 'CORRECTION'],
                      },
                      quantityDelta: { type: 'integer' },
                      beforeQuantity: { type: 'integer' },
                      afterQuantity: { type: 'integer' },
                      reason: { type: 'string' },
                      actorName: { type: ['string', 'null'] },
                      actorEmail: { type: ['string', 'null'] },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            }),
          ),
          404: response('Inventory not found for variant.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/inventory/adjustments': {
      post: {
        tags: ['Admin Inventory'],
        summary: 'Execute an auditable inventory adjustment command',
        security: bearer,
        description:
          'Requires PRODUCT_MANAGE. This is a transactional command endpoint; direct stock PATCH editing is not supported. expectedOnHandQuantity is optional optimistic concurrency input from the current admin screen. The API rejects zero/negative quantities, blank reasons, negative resulting stock, and stock below reserved quantity.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['variantId', 'type', 'quantity', 'reason'],
                additionalProperties: false,
                properties: {
                  variantId: idSchema,
                  type: {
                    type: 'string',
                    enum: ['RECEIVE_STOCK', 'MANUAL_INCREASE', 'MANUAL_DECREASE', 'CORRECTION'],
                  },
                  quantity: { type: 'integer', minimum: 1 },
                  reason: { type: 'string', minLength: 1, maxLength: 500 },
                  expectedOnHandQuantity: { type: 'integer', minimum: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: response(
            'Inventory adjusted and ledger row created.',
            successEnvelope({
              type: 'object',
              properties: { inventory: { type: 'object' }, ledgerEntry: { type: 'object' } },
            }),
          ),
          400: response(
            'Validation error, negative stock, or reserved-stock conflict.',
            errorEnvelope,
          ),
          404: response('Inventory not found for variant.', errorEnvelope),
          409: response('Concurrent inventory adjustment conflict.', errorEnvelope),
          ...protectedResponse,
        },
      },
    },
    '/admin/uploads/images': {
      post: {
        tags: ['Upload'],
        summary: 'Upload and attach a product image',
        security: bearer,
        description:
          'Requires PRODUCT_MANAGE (Admin). multipart/form-data must include uploadPurpose=PRODUCT and file; no other purpose is accepted by this endpoint.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['uploadPurpose', 'file', 'productId'],
                properties: {
                  uploadPurpose: { type: 'string', enum: ['PRODUCT'] },
                  productId: idSchema,
                  productVariantId: idSchema,
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: response(
            'Image attached.',
            successEnvelope({ type: 'object', properties: { id: idSchema } }),
          ),
          ...protectedResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: { BigIntId: idSchema, ErrorEnvelope: errorEnvelope },
  },
} as const;