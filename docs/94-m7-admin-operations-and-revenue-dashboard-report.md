# M7.4E Admin Operations and Revenue Center

Status: implementation complete; final runtime and quality-gate evidence is recorded below.

## Admin information architecture

The privileged area is one responsive Operations Center with stable navigation:

1. `/admin/dashboard` — Tổng quan;
2. `/admin/revenue` — Doanh thu;
3. `/admin/product-statistics` — Thống kê sản phẩm;
4. `/admin/orders` — Đơn hàng;
5. `/admin/catalog` — Sản phẩm;
6. `/admin/inventory` — Tồn kho.

The shared shell owns active-route state, Admin/Staff mode, logout, desktop sidebar and mobile navigation. `/admin/login` and `/admin/403` remain outside the shell. Privileged login lands on `/admin/dashboard`. The public Typebot widget remains excluded from every `/admin/*` route.

## Revenue policy

The executable order lifecycle uses `PENDING_CONFIRMATION`, `CONFIRMED`, `PACKING`, `SHIPPING`, `COMPLETED`, and `CANCELLED`. The current implementation's `COMPLETED` state is the operational equivalent of the older approved `DELIVERED` wording.

- recognized status: `COMPLETED` only;
- excluded statuses: `PENDING_CONFIRMATION`, `CONFIRMED`, `PACKING`, `SHIPPING`, and `CANCELLED`;
- authoritative order revenue: immutable `Order.grandTotal`;
- product/category history: `OrderItem.quantity`, `lineTotal`, `productTitleSnapshot`, `productSlugSnapshot`, and `primaryCategoryNameSnapshot`;
- missing historical category: `Không xác định`;
- current product price, title, activation and deletion never recompute historical revenue.

`grandTotal` includes the checkout snapshots `subtotal + shippingFee - discount`. The current Prisma schema contains no ReturnRequest, ReturnItem, Refund or Payment transaction models, so M7.4E does not fabricate refund adjustments. Refund-aware net revenue remains blocked until that approved domain is implemented.

## Date and comparison contract

All reporting endpoints accept an optional paired `from`/`to` query using strict `YYYY-MM-DD`:

- both fields are required together;
- calendar-invalid, reversed and unknown queries are rejected;
- maximum range is 366 inclusive days;
- day boundaries use `Asia/Ho_Chi_Minh` (`UTC+07:00`);
- database timestamps remain UTC `DateTime2` values;
- the default is the latest 30 Vietnam calendar days;
- comparison is the immediately preceding period with equal inclusive duration;
- missing time-series days are returned as numeric zero buckets;
- undefined percentage change is `null`; zero versus zero is `0`.

## Reporting API

Read-only endpoints:

- `GET /api/v1/admin/dashboard/overview`;
- `GET /api/v1/admin/dashboard/revenue`;
- `GET /api/v1/admin/dashboard/product-statistics`.

They require authenticated `ADMIN_ACCESS`, which is already held by Admin and Staff. Customer and anonymous access is rejected. There are no reporting mutation routes.

The service/read-model boundary returns numeric summary metrics, quick revenue, zero-filled time series, all actual order statuses, top products, category aggregates, inventory summaries and five recent order-safe records. It never returns customer identity, email, phone, address, credentials, cookies or tokens. Route handlers contain no Prisma access.

## Dashboard and analytics UI

`/admin/dashboard` provides today/7-day/30-day revenue, selected-period orders, processing/completed counts, average order value, items sold, low/out-of-stock counts, daily trend, latest orders, top products and shortcuts.

`/admin/revenue` provides preset and custom dates, equal-period comparison, revenue/order/item metrics, daily trend, accessible data table, status distribution, and top products by quantity and revenue.

`/admin/product-statistics` separates analysis from Catalog CRUD. It provides top, high-revenue, low-selling and no-sale products, category quantity/revenue, and low/out-of-stock lists. No cost or margin field is returned to Staff.

`/admin/inventory` provides a read-only paged-friendly inventory operations view. Existing Admin-only adjustment behavior stays in the product editor and retains its original RBAC and audit rules.

## Orders, catalog and state reliability

`/admin/orders` uses the existing server pagination, search, status/payment/method/date filters and deterministic sort. The canonical detail path is `/admin/orders/:orderNumber`; the previous Vietnamese route remains available for compatibility. Request cancellation prevents stale navigation results. Loading always transitions to loaded, empty, invalid, unauthorized, forbidden or safe retryable error. Retry creates a new request rather than refreshing a stale client component.

Catalog now uses a compact thumbnail/card hierarchy, status, active variant count, selling price, availability, role-sensitive cost, view/edit actions and real server pagination metadata. The service counts rows and returns `page`, `pageSize`, `total`, and `totalPages`. Existing create/edit/hide behavior remains unchanged. Staff remains read-only and receives no cost price.

## Demo reporting data

The original four M6 orders are preserved. Four new fixed-number M7E `COMPLETED` orders provide multiple dates and two comparison periods using separate order numbers and immutable snapshots. Seed behavior is idempotent, updates no existing historical order timestamp, and aggregates repeated SKU inventory deltas safely.

## Performance and accessibility

- ranges are bounded to 366 days;
- status and monetary summaries use Prisma count/aggregate/groupBy;
- top lists are capped at 10 and recent orders at 5;
- inventory/catalog relations are fetched in bounded relation selections without N+1 route calls;
- tables use captions, column headers and controlled horizontal scrolling;
- charts have an accessible table fallback and do not communicate status by color alone;
- desktop, tablet and mobile layouts keep controls reachable and focusable.

The current schema indexes `Order(status, createdAt)` and `OrderItem(orderId/variantId)`. No index or migration was added. Production-scale query telemetry remains a deployment concern.

## Tests and certification

Focused API tests cover strict ranges, Vietnam boundaries, equal comparison, recognized/excluded revenue, zero-fill, snapshots, deleted product history, category fallback, inventory states, no PII, Admin/Staff access, customer/anonymous rejection, stable errors and absence of mutations.

Focused Web tests cover the shell navigation, active state, role label, logout, login exclusion, dashboard metrics, shortcuts, loading/error/retry, date presets, chart tables, product/category analytics, inventory and sensitive-field exclusion. Existing login, orders, detail and catalog regression tests were updated to the canonical route and pagination envelope.

## Runtime verification evidence

The production build was started locally with the repository's existing `start` scripts. API health returned HTTP 200 before UI verification. The canonical browser origin was `http://localhost:3000`; API calls used the existing `http://localhost:4000/api/v1` configuration without changing CORS.

Admin production verification covered the complete SPA route matrix:

| Route | H1 | Admin navigation | Tables | Horizontal page overflow | Typebot |
| --- | --- | ---: | ---: | --- | --- |
| `/admin/dashboard` | `Tổng quan vận hành` | 6 | 2 | no | absent |
| `/admin/revenue` | `Doanh thu` | 6 | 4 | no | absent |
| `/admin/product-statistics` | `Thống kê sản phẩm` | 6 | 6 | no | absent |
| `/admin/orders` | `Quản lý đơn hàng` | 6 | 1 | no | absent |
| `/admin/catalog` | `Quản lý catalog` | 6 | 0 | no | absent |
| `/admin/inventory` | `Tồn kho` | 6 | 1 | no | absent |

The mobile dashboard was checked at the browser's 390 x 844 device override (375 CSS-pixel content viewport after browser chrome/scrollbar): all six navigation entries remained reachable through the intentional horizontal navigation scroller, document-level horizontal overflow was absent, metric cards reflowed, and Typebot remained absent.

Staff logged in through the same production shell and received `Nhân viên · chỉ đọc`. Staff could read the reporting API and dashboard, while Catalog exposed no create, stock-adjustment, delete or cost-price control. Direct API authorization checks returned Staff 200, Customer 403 and anonymous 401.

Five API ranges were exercised against local SQL Server:

| Vietnam calendar range | HTTP | Recognized revenue | Recognized orders | Local response time |
| --- | ---: | ---: | ---: | ---: |
| 2026-07-16..2026-07-22 | 200 | 1,024,000 | 4 | 137 ms |
| 2026-06-23..2026-07-22 | 200 | 1,024,000 | 4 | 45 ms |
| 2026-07-01..2026-07-22 | 200 | 1,024,000 | 4 | 46 ms |
| 2026-06-15..2026-07-22 | 200 | 1,349,000 | 6 | 59 ms |
| 2025-01-01..2025-01-07 | 200 | 0 | 0 | 43 ms |

A separate read-only Prisma query for the custom range independently returned six `COMPLETED` orders and `grandTotal` sum 1,349,000, exactly matching the API. The rows retained one immutable OrderItem snapshot each. No raw SQL mutation or production data rewrite was used.

## Quality-gate results

- `npm run format:check`: PASS;
- `npm run lint`: PASS;
- `npm run type-check`: PASS;
- focused reporting API: 2 files, 7 tests PASS;
- focused Admin Web: 6 files, 21 tests PASS;
- full `npm run test`: API 27 files/185 tests, Web 46 files/234 tests, Shared 1 file/1 test, all PASS;
- SEO regression: 9 files/48 tests PASS;
- `npm run seed:validate -w @rosach/api`: PASS, `blocking: false`, every issue count `0`;
- `npm run build`: PASS for API, Next.js production Web and Shared; Next.js compiled with native Turbopack;
- production API/Web audit processes: stopped after verification;
- final `git diff --check`: PASS.

## Scope verification

- package installed or package file changed: NO;
- Prisma schema or migration: NO;
- Commerce Core or historical existing order totals changed: NO;
- Typebot/chatbot/global CORS: unchanged;
- deployment, commit or push: NO.

## Known limitations

- refund/partial-return adjustment cannot be implemented until the approved Return/Refund schema exists;
- the current reporting implementation is intentionally bounded but still materializes recognized order-item snapshots for a maximum 366-day range to build snapshot-correct product/category rankings;
- no new database index was authorized; production telemetry must determine whether a later index review is needed;
- charts are dependency-free semantic bar summaries, not a third-party visualization package.
