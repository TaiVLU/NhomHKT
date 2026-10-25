# M7.3A Data Fetching Audit

Status: AUDIT ONLY

## Route Fetch Matrix

| Route | Fetch Function | Server/Client | Endpoint | Sequential/Parallel | Cache Policy | Duplicate Risk | Metadata Duplicate Risk | Refetch Risk | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/` | `getProducts`, `getCategories` | Server | `/products?...`, `/categories` | `Promise.all` | products `no-store`; categories `revalidate:300` | Low within page | Low | No client refetch found | WARN because API unavailable |
| `/san-pham` | `getProducts`, `getCategories`, `getAuthors`, `getPublishers` | Server | `/products`, `/categories`, `/authors`, `/publishers` | `Promise.all` | products `no-store`; taxonomy `revalidate:300` | Low within page | Low | No client refetch; form submit navigation | PASS |
| `/san-pham?q=...` | same | Server | same with query | `Promise.all` | `no-store` product query | Low | Low | Navigation per form submit | PASS |
| `/danh-muc` | `getCategories` | Server | `/categories` | Single | `revalidate:300` | Low | Low | None | WARN because API unavailable |
| `/danh-muc/[slug]` | `getCategory`, `getProducts` | Server | `/categories/:slug`, `/products?category=...` | Page uses `Promise.all` | category `revalidate:300`; products `no-store` | Medium | Yes, `generateMetadata` calls `getCategory` too | None | DUPLICATE FETCH RISK |
| `/sach/[slug]` | `getProduct` | Server | `/products/:slug` | Single | `no-store` | Medium | Yes, `generateMetadata` calls `getProduct` too | Client variant changes do not refetch product | DUPLICATE FETCH RISK |
| `/gio-hang` | `cartApi.get`, `getCartProductMetadata` | Client | `/cart`, `/products/:slug` | Cart metadata uses `Promise.all` per missing slug | Default browser fetch | Medium for metadata enrichment | N/A | Auth/bootstrap/cart refresh can trigger | WARN |
| `/thanh-toan` | `accountApi.addresses`, `checkoutApi.placeOrder`, `refreshCart` | Client | `/me/addresses`, `/checkout`, `/cart` | Mostly sequential because auth/cart/address/checkout are dependent | Default browser fetch | Low | N/A | Address load on mount; refresh on errors | MAINTAIN |
| `/thanh-toan/thanh-cong` | `readCheckoutConfirmation` | Client | sessionStorage | N/A | sessionStorage | Low | N/A | One effect after mount | PASS |
| `/tai-khoan/*` | account/orders APIs | Client | `/me/*`, `/orders*` | Route-specific | Default browser fetch | Low-medium | N/A | Fetch on mount/search param change | REQUIRES AUTH |
| `/admin/catalog/[id]` | admin fetches | Client | `/admin/products/:id`, images, taxonomy, inventory | Product/images/taxonomy parallel; inventory per variant parallel | Default browser fetch | Medium | N/A | Reload after mutations | ADMIN ONLY |

## `generateMetadata` And Page Duplication

Confirmed source risk:

- `apps/web/app/sach/[slug]/page.tsx`: `generateMetadata()` calls `getProduct(slug)`; `ProductPage()` also calls `getProduct(slug)`.
- `apps/web/app/danh-muc/[slug]/page.tsx`: `generateMetadata()` calls `getCategory(slug)`; `CategoryPage()` calls `getCategory(slug)` and `getProducts(...)`.

Interpretation:

- These are public data resources.
- Next may memoize identical native `fetch` calls per request, but this was not runtime-verified because the local API was unavailable.
- Product fetch uses `cache: 'no-store'`, so M7.3B must verify whether same-request dedupe applies before changing.

Status: DUPLICATE FETCH RISK, not FAIL.

## Sequential Fetch

Confirmed good pattern:

- Homepage uses `Promise.all` for featured products, newest products, and categories.
- Catalog uses `Promise.all` for products, categories, authors, and publishers.
- Category detail page uses `Promise.all` for category and product list.
- Cart metadata enrichment uses `Promise.all` for missing product slugs.
- Admin product editor initial load uses `Promise.all` for product, images, categories, authors, publishers, then inventory loads per variant through `Promise.all`.

Candidates:

- Checkout submit intentionally awaits `placeOrder`, then saves confirmation, then `refreshCart`, then navigates. This is sequential by business requirement.
- Account/auth flows are sequential by session requirement.

No `Promise.all` implementation was added in M7.3A.

## Refetch Risk

| Component | Refetch Pattern | Risk | Recommendation |
|---|---|---|---|
| `CartProvider` | bootstraps auth, refreshes cart on auth subscription, enriches product metadata after cart load | Medium | Measure rerender/fetch count with authenticated session before optimizing. |
| `CheckoutPage` | loads addresses on mount; refreshes cart after checkout; refreshes addresses on address-not-found | Medium but business-driven | Maintain unless runtime proves duplicate requests. |
| `OrdersPage` | fetches list on page search param change with cancellation flag | Low-medium | Maintain; consider abort only if measured. |
| `AccountShell` | bootstraps auth on route change and redirects unauthenticated users | Low-medium | Maintain for security. |
| `AdminCatalogEditor` | reloads after mutations | Admin-only medium | Backend/admin follow-up only if admin performance becomes scope. |

## Cache And Freshness

| Data | Current Policy | Freshness Need | User Isolation Risk | M7.3B Guidance |
|---|---|---|---|---|
| Product list | `cache: 'no-store'` | Price/stock/availability freshness | Public, but commerce-sensitive | Do not cache until Technical Lead accepts stale tolerance. |
| Product detail | `cache: 'no-store'` | Price/stock/variant freshness | Public, commerce-sensitive | Memoize same request only if safe; no broad static cache. |
| Categories/authors/publishers | `next: { revalidate: 300 }` | Lower freshness | Public | Maintain; can reuse in route-level optimization. |
| Sitemap providers | SEO controlled | Public URL freshness | Public | Preserve M7.2 sitemap rules. |
| Cart/account/orders/checkout | Default client fetch | User-specific | High | Never shared-cache or static-generate. |
| Admin data | Default client fetch | Permission-specific | High | Never public-cache. |

## Loading And Error Behavior

| Route/Component | Loading Boundary | Error Boundary | Performance Interpretation |
|---|---|---|---|
| `/san-pham` | `app/san-pham/loading.tsx` | `app/san-pham/error.tsx` | Has route-level fallback; layout stability not browser-measured. |
| Cart | `CartSkeleton` | guest/error/empty states | Good perceived-performance structure; INP not measured. |
| Checkout | `CheckoutSkeleton`, section loading states | mapped checkout errors | Business-safe; do not simplify without tests. |
| Account | `AccountShell` busy state | redirect to login | Security-driven. |
| Product/category detail | no route-specific loading/error files | root/notFound handling | Candidate for perceived-performance review only if measured. |

## API Versus Frontend Responsibility

API unavailable during audit is an environment readiness blocker, not a frontend performance failure. Backend follow-up candidates include endpoint response time and DB query profiling for products/categories/orders, but M7.3B should not include backend optimization unless Technical Lead expands scope.

## Findings

Primary data finding: PERF-03 in `docs/75-m7-performance-audit.md`.

Secondary maintain finding: PERF-07 for commerce/private client refetch behavior.

## M7.3A Runtime Baseline Closure — 2026-07-22

The API/database is now ready and fixtures were queried successfully, but browser network observation sees only browser-originated requests. Public page data is server-side SSR, so `/sach/m6-demo-regular-in-stock` and `/danh-muc/m6-demo-van-hoc` produced zero direct browser API requests. This neither proves nor disproves same-render metadata/page request memoization.

PERF-03 is therefore **Not Confirmed / P2 validation-only**. No `cache()`, `Promise.all`, or fetch memoization change is authorized. A future approved measurement must use server/API request logging correlated to a single production navigation and keep public price/stock freshness unchanged.

Anonymous `/khuyen-mai`, `/gio-hang`, and `/thanh-toan` emitted no direct API request or console error in this baseline. Anonymous checkout redirected to login; authenticated cart/checkout/account behavior remains intentionally unmeasured rather than a defect.
## M7.3B duplicate-fetch decision — 2026-07-22

Product and category routes have server metadata/page read paths, while browser instrumentation observes no direct catalog API requests because the reads occur on the server. This does not prove two effective HTTP/database reads. PERF-03 remains `VALIDATION ONLY`; no `cache()`, global cache, or loader change was introduced.
### M7.3B final build-lock closure

Environment-only build-lock resolution did not change fetch behavior or the PERF-03 validation-only decision.
