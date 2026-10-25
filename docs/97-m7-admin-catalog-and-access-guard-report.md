# M7.5A Admin Catalog and Access Guard Report

Status: bounded corrective implementation and M7.5A-V1 manual certification completed; awaiting final Technical Lead closure.

## Current architecture

`/admin/layout.tsx` wraps Admin routes in the client `AdminShell`. The shell owns navigation and calls `bootstrapSession()`; API routes independently require bearer authentication and permissions. `PRODUCT_READ` permits Staff catalog reads, while `PRODUCT_MANAGE` is Admin-only for catalog and taxonomy mutations.

## Catalog correction

Product management remains the upper section of `/admin/catalog` with existing search, server pagination, status, variants, availability, role-sensitive cost, create/edit/view/hide actions, and Staff read-only behavior.

Classification management is now a separate lower section with three tabs: Danh mục, Tác giả, and Nhà xuất bản. Each tab uses a semantic table, real fields, explicit headers, wrapped descriptions, usable category sort-order inputs, status text, separate save/toggle/hide actions, and keyboard-associated labels. Loading, empty, error, retry, active, inactive/QA, and all-record views are explicit. The default operational view excludes deleted/inactive rows and recognized technical fixture identities; the all view retains them for audit/history.

## Access policy

| Actor | `/admin/login` | `/admin/dashboard` | `/admin/catalog` | Other operational `/admin/*` |
|---|---|---|---|---|
| Anonymous | Allow | Redirect/deny to `/` | Redirect/deny to `/` | Redirect/deny to `/` |
| CUSTOMER | Deny and redirect `/` | Deny and redirect `/` | Deny and redirect `/` | Deny and redirect `/` |
| STAFF | Redirect `/admin/dashboard` | Allow | Allow read-only | Allow approved read-only routes |
| ADMIN | Redirect `/admin/dashboard` | Allow | Allow | Allow according to RBAC |

Unauthorized UI uses `Không có quyền truy cập`, `Bạn không có quyền truy cập khu vực quản trị.`, and `Về trang chủ`. The protected children and Admin shell are withheld while access is checked. API authorization remains authoritative and unchanged.

## Security and commerce safety

No secret, token, PII, cart, order, pricing, stock, checkout, Typebot, or historical order behavior is changed. The UI guard is a user-experience boundary; direct Admin API calls continue to return the existing 401/403 contracts.

## Verification status

Focused web tests cover the taxonomy table/tabs/filter/retry, Admin/Staff controls, anonymous/customer denial, unknown Admin-route containment, and privileged login redirect. The focused suite passed with 17 tests.

## Final QA evidence

| Area | Evidence | Result |
|---|---|---|
| Format | `npm run format:check` | PASS |
| Lint | `npm run lint` | PASS |
| Type-check | `npm run type-check` | PASS |
| Full tests | `npm run test` | PASS: API 185, Web 241, Shared 1 |
| SEO regression | `npm run test -w '@rosach/web' -- tests/seo` | PASS: 48 tests |
| Seed/data hygiene | `npm run seed:validate -w '@rosach/api'` | PASS: blocking false, blocker counts zero |
| Production build | `npm run build` after stopping RoSach watchers | PASS |
| Diff integrity | `git diff --check` | PASS after documentation update |

Browser route matrix:

- Anonymous `/admin/catalog` withheld protected content and ended at `/`; `/admin/login` remained available.
- Admin login/session reached `/admin/dashboard`; direct `/admin/catalog` rendered the product section and lower taxonomy section.
- Admin taxonomy verification covered `Danh mục`, `Tác giả`, and `Nhà xuất bản`, active/inactive/all filter options, page 2 product navigation, table rows, status text, associated labels, numeric sort-order inputs, and separate mutation controls.
- Staff regular login succeeded; `/admin/catalog` rendered the Admin shell in read-only mode and exposed no `Tạo sản phẩm`, `Lưu`, `Bật/tắt`, or `Ẩn` mutation controls.
- Customer fixture identity was recorded only as `m6***@rosach.local` in the manual evidence; no password was written to documentation. All requested Customer Admin routes were denied without Admin navigation or protected content. Operational routes reached `/`; `/admin/login` remained accessible.
- Customer browser Back/Forward did not reveal catalog or Admin shell content. A direct customer request to `/api/v1/admin/categories` returned HTTP 403. Chrome console error review was empty.

## M7.5A-V1 Mobile Admin Catalog

Chrome responsive viewport: `390x844`.

- Admin mobile header and horizontally scrollable mobile navigation rendered correctly.
- Product area remained usable; primary create action and product pagination were reachable.
- Classification tabs `Danh mục`, `Tác giả`, and `Nhà xuất bản` were reachable and selected successfully.
- Category, author and publisher rows rendered with readable labels and descriptions. The table used the intended bounded horizontal scroll container for wide columns.
- Category sort-order inputs were visible and usable at `88px` width. Checkbox labels and save/toggle/hide controls remained associated and usable.
- A horizontal gesture moved the taxonomy table container while page `scrollX` remained `0`; no effective document-level horizontal scrolling occurred.
- Staff at `390x844` rendered the catalog in read-only mode with zero create/save/toggle/hide mutation controls.
- No console errors were recorded during the mobile certification.

## Scope and repository safety

- Application correction files: `apps/web/app/admin/page.tsx`, `apps/web/app/admin/[...path]/page.tsx`, `apps/web/app/admin/not-found.tsx`, `apps/web/features/catalog/taxonomy-manager.tsx`, `apps/web/features/admin/admin-shell.tsx`, `apps/web/features/auth/login-page.tsx`, and the related global CSS section.
- Test files cover the corrected catalog/access behavior. One test helper was adjusted to satisfy the repository lint rule without changing runtime behavior.
- No schema, migration, API contract, Commerce Core, Typebot flow, deployment setting, package, or database record was changed during M7.5A QA.
- No commit or push was performed. Existing milestone dirty files remain untouched and are not reclassified as M7.5A work.

## Final recommendation

M7.5A bounded defects are corrected, the required Customer and `390x844` mobile certifications are complete, and the evidence is sufficient for final Technical Lead closure. `M75-PERF-001` remains a LOW deferred performance observation and does not block closure.
