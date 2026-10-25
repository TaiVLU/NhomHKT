# Final M6 Capability Matrix

| Capability | M6 Status | Evidence / Reason |
|---|---|---|
| Authentication | COMPLETE | Customer email login, admin/staff username login, refresh/logout, protected routes, tests and browser smoke. |
| Customer profile and addresses | COMPLETE | Account pages and address management exist for checkout address selection. |
| Public catalog | COMPLETE | Catalog Read Model powers listing, categories, product detail, active visibility, images, availability. |
| Search/filter/sort/pagination | COMPLETE | Public catalog supports query, filters, sorting, and pagination. |
| Product detail | COMPLETE | Canonical `/sach/[slug]`, variant selection, image fallback, Add to Cart, SEO metadata and structured data. |
| Cart | COMPLETE | Authenticated server cart, duplicate variant handling, update/remove/clear, non-reserving policy. |
| Checkout | COMPLETE | COD checkout, final validation, order snapshot, inventory consumption, ledger movement, cart clearing. |
| Customer order history/detail | COMPLETE | Customer order list/detail render immutable snapshots. |
| Admin catalog | COMPLETE | Admin product list, create, edit, publication state, Staff read-only behavior. |
| Categories | COMPLETE | Admin taxonomy management exists within approved catalog surface. |
| Authors | COMPLETE | Admin taxonomy management exists within approved catalog surface. |
| Publishers | COMPLETE | Admin taxonomy management exists within approved catalog surface. |
| Variants | COMPLETE | Admin variant create/edit/deactivate and public active-variant filtering. |
| Product images | COMPLETE | Admin image management, primary image, fallback handling. |
| Inventory adjustment | COMPLETE | Product-level adjustment through Inventory Movement boundary. |
| Inventory ledger | COMPLETE | Ledger rows exist for manual adjustment, checkout, cancellation, and seed reconstruction. |
| Admin orders | COMPLETE | List/detail and status transition flow exist. |
| Order status transitions | COMPLETE | Valid transitions and stale transition conflict handling verified. |
| Cancellation | COMPLETE | Cancellation restores inventory through ledger and is tested. |
| Admin dashboard | PARTIAL - ACCEPTED TECHNICAL DEBT | Early docs list dashboard; current approved M6 admin demo uses catalog/orders/inventory surfaces. |
| Wishlist/favorites | DEFERRED TO M7 | Listed in early functional scope, explicitly deferred from implemented commerce scope. |
| User/role management UI | PARTIAL - ACCEPTED TECHNICAL DEBT | RBAC policy is implemented; UI management is deferred. |
| SEO | COMPLETE | Metadata, canonical, robots, sitemap, structured data, and regression suite implemented. |
| Local demo readiness | COMPLETE | Runbook, seed, deterministic demo accounts, and validation exist. |
