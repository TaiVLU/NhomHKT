# M7.1A Navigation and UX Audit

Status: AUDIT ONLY

## Navigation Inventory

| Navigation area | Status | Evidence | Notes |
|---|---|---|---|
| Header | PASS | Links to Home, Categories, Products, Promotion, Cart, Auth/Account | Clear desktop navigation |
| Header mobile | WARN | Horizontal scroll at `390px` | Functional but not discoverable |
| Footer | PASS | Home, Products, Account | Minimal but useful |
| Breadcrumb | PASS | Category/product/admin order detail use breadcrumbs | Good orientation |
| Catalog filters | PASS | Category, author, publisher, price, availability, flags, sort | Complete for current frontend |
| Search | WARN | Catalog query search works | Dedicated `/tim-kiem` route absent |
| Pagination | PASS | Catalog numbered pagination exists | Good |
| Back navigation | PASS | Order/admin details link back to list | Good |
| Account sidebar | PASS | Overview, profile, addresses, orders, password | Usable |
| Admin navigation | WARN | Header exposes catalog/orders for privileged users | No dedicated admin sidebar/dashboard |

## User Flow Audit

Guest -> Register -> Login -> Browse Book -> Search -> Product Detail -> Cart -> Checkout -> Order Success -> Order History -> Logout

| Step | Status | Evidence | UX notes |
|---|---|---|---|
| Guest home | PASS | `/` 200, hero and sections render | Good first impression |
| Register | PASS | `/dang-ky` 200 | Form is straightforward |
| Login | PASS | `/dang-nhap` 200; customer UI login succeeded | Good |
| Browse catalog | PASS | `/san-pham` 200 | Filters are robust |
| Search | PASS | `/san-pham?q=atomic` 200 | Dedicated search route absent |
| Product detail | WARN | `/sach/m6-demo-regular-in-stock` 200 | Synthetic product copy and some image issues reduce polish |
| Cart | PASS | `/gio-hang` 200 | Guest state clear; authenticated state exists |
| Checkout | PASS | `/thanh-toan` redirects guest to login; checkout UI exists | Full checkout UX should be tested again in M7.1B |
| Order success | WARN | `/thanh-toan/thanh-cong` safe fallback renders | Fallback is safe but not useful after refresh |
| Order history | PASS | UI login reached `/tai-khoan/don-hang` with demo orders | Good |
| Logout | PASS | Header exposes logout when authenticated | Good |

## Admin UX Audit

| Area | Status | Evidence | Notes |
|---|---|---|---|
| Admin login | PASS | `/admin/login` UI login succeeded as `m6admin` | Good |
| Admin catalog list | PASS | `/admin/catalog` rendered 20 rows | Dense but usable |
| Taxonomy management | PASS | `TaxonomyManager` included on catalog page | Current UI is colocated with catalog |
| Product editor | PASS | `/admin/catalog/[id]` has metadata, categories, authors, publisher, variants, images, inventory | Powerful but dense |
| Inventory adjustment | PASS | Product-level inventory panel exists | Standalone inventory page absent |
| Inventory ledger | PASS | Product editor includes ledger section | Good for current scope |
| Admin orders list | PASS | `/admin/don-hang` rendered 19 results | Good filters |
| Admin order detail | PASS | Detail component includes transitions/history | Detail route exists |
| Admin dashboard | WARN | `/admin/dashboard` 404 | Deferred/accepted debt in M6 docs |
| Admin users/roles/settings | WARN | Routes return 404 | Static RBAC only |

## Missing or Deferred Navigation Surfaces

| Route/surface | Runtime result | Documented context | M7.1A status |
|---|---|---|---|
| `/tim-kiem` | 404 | Original sitemap target | WARN: catalog query search substitutes current need |
| `/tac-gia/[slug]` | 404 | Author filtering exists; dedicated route not in M6 final capability | WARN |
| `/nha-xuat-ban/[slug]` | 404 | Publisher filtering exists; dedicated route not in M6 final capability | WARN |
| `/dat-hang-thanh-cong/[orderCode]` | 404 | Original sitemap target | WARN: current success route is `/thanh-toan/thanh-cong` |
| `/admin/dashboard` | 404 | Deferred/partial dashboard | WARN |
| `/admin/inventory` | 404 | Product-level inventory is current scope | WARN, not a blocker |
| `/admin/users` | 404 | User/role UI deferred | WARN |
| `/admin/roles` | 404 | Static RBAC current scope | WARN |
| `/admin/settings` | 404 | Deferred | WARN |

## UX Findings

| Severity | Finding | User impact | Recommendation |
|---|---|---|---|
| High | Public catalog content looks like internal demo data | New users see `M6 Demo...` records | Create content cleanup plan before public-facing demo polish |
| High | Missing dedicated sitemap routes can confuse reviewers comparing docs to app | Reviewer may expect `/tim-kiem`, author, publisher, dashboard pages | Reconcile scope explicitly before implementation |
| Medium | Mobile header nav is not obvious | Users may not realize nav can scroll | Improve mobile nav affordance |
| Medium | Product detail has minor tablet overflow | Metadata feels less polished | Wrap fact values |
| Medium | Admin catalog/product editor is dense | Admin demo requires guidance | Add microcopy or progressive grouping later |
| Medium | Order success fallback after refresh is safe but weak | User loses confirmation details on refresh | Later order lookup can improve |
| Low | Some empty states are functional but plain | Less polished demo feel | UX writing pass |

## Console Audit

| Signal | Status | Evidence |
|---|---|---|
| React runtime errors | PASS | None observed in Chromium audit |
| Hydration warnings | PASS | None observed |
| Network request failures | PASS | None observed in tested routes |
| Dev-only logs | PASS | React DevTools and HMR messages appeared in dev mode |
| Next image warning | WARN | Product detail LCP image warning appeared in dev console |

## Overall Navigation and UX Rating

Score: 7.0/10.

Conclusion: RoSach is navigable and demo-usable. The next milestone should focus on polishing mobile navigation, route-scope clarity, content quality, and high-value customer guidance before adding the AI Receptionist.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Public catalog content looks like internal demo data | FIXED | Curated deterministic demo content to read like bookstore content. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts` | Seed validation passed; customer browser smoke saw curated catalog/product detail content. | Deterministic `m6-demo` slugs remain. |
| Missing dedicated sitemap routes can confuse reviewers | DEFERRED | Documented route scope; did not implement unapproved routes. | Documentation only | Build route output and runtime smoke confirm current route set. | Dedicated search/author/publisher/dashboard/inventory/users/roles/settings remain deferred/accepted debt. |
| Mobile header nav is not obvious | FIXED | Added explicit mobile menu and keyboard behavior. | `apps/web/features/shell/site-header.tsx`, `apps/web/app/globals.css`, `apps/web/features/shell/site-header.test.tsx` | Runtime keyboard check passed for Tab, Enter, Space, Escape, link click, route change, no trap. | No global admin sidebar or full drawer redesign. |
| Product detail has minor tablet overflow | FIXED | Added product fact wrapping. | `apps/web/app/globals.css` | Runtime responsive smoke reported no horizontal overflow. | None for reproduced case. |
| Admin catalog/product editor is dense | PARTIALLY FIXED | Improved terminology and guidance text without redesigning admin layout. | `apps/web/app/admin/catalog/page.tsx`, `apps/web/app/admin/catalog/[id]/page.tsx`, `apps/web/features/catalog/taxonomy-manager.tsx`, `apps/web/features/admin-orders/admin-orders-page.tsx` | Admin browser smoke passed catalog, product inventory panel, and orders. | Admin editor remains dense by design; broader IA redesign is out of M7.1B scope. |
| Order success fallback after refresh is safe but weak | DEFERRED | No order success flow change. | No source change | Customer smoke reached checkout and orders; no blocking runtime error. | Order lookup/stronger confirmation can be future UX work. |
| Some empty states are functional but plain | DEFERRED | No broad empty-state copy redesign. | No source change | Runtime route smoke passed. | Optional UX writing pass later. |
| Next image warning in dev console | PARTIALLY FIXED | Product detail primary image uses eager loading; image fallback was hardened. | `apps/web/features/catalog/product-detail-experience.tsx`, `apps/web/features/catalog/product-image.tsx` | Runtime console had no blocking errors; some dev-only LCP warnings can still appear for other above-fold images. | Remaining LCP work belongs to M7 performance. |
