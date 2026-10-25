# M7.1A Website Experience Audit

Status: AUDIT ONLY

Milestone: M7.1A - Website Experience Audit

Scope boundary:

- Frontend and website experience only.
- No backend architecture review.
- No Commerce Core change.
- No source code, UI, SEO, performance, chatbot, package, migration, commit, or push change.

Repository evidence reviewed:

- `CODEX_START_HERE.md`
- `docs/00-document-map.md`
- Full `docs/` set in filename order.
- `apps/web/app`
- `apps/web/features`
- `apps/web/services`
- `apps/web/app/globals.css`
- Runtime local web: `http://localhost:3000`
- Runtime local API: `http://127.0.0.1:4000/api/v1`

Runtime audit evidence:

- Dev web server started with `npm run dev:web`.
- Dev API server started with `npm run dev:api`.
- Chromium audit covered desktop `1366x850`, tablet `768x900`, and mobile `390x844`.
- Routes returning expected content included `/`, `/san-pham`, `/san-pham?q=atomic`, `/danh-muc`, `/danh-muc/m6-demo-van-hoc`, `/sach/m6-demo-regular-in-stock`, `/sach/m6-demo-out-of-stock-visible`, `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/gio-hang`, `/thanh-toan`, `/thanh-toan/thanh-cong`, and `/khong-ton-tai`.
- Authenticated customer smoke reached `/tai-khoan/don-hang` after UI login as the local demo customer.
- Authenticated admin smoke reached `/admin/catalog` and `/admin/don-hang` after UI login as the local demo admin.

## Executive Summary

RoSach has a coherent editorial storefront and a usable local demo frontend. The customer shopping path, catalog browsing, product detail, cart entry, checkout entry, account orders, admin catalog, product-level inventory, and admin orders are present and visually aligned enough for the next UX planning step.

The site is not yet a polished final customer experience. The biggest experience gaps are content/data quality in the demo catalog, missing dedicated Author/Publisher/Search pages from the original sitemap, several deferred admin surfaces, heavy reliance on Open Library cover images, and inconsistent UI language in admin/product authoring areas. No Critical frontend blocker was found during M7.1A, but several High priority UX and data presentation issues should be addressed in M7.1B or a later approved polish sprint.

## Capability Coverage

| Capability | Frontend route/component | Status | Evidence | Notes |
|---|---|---:|---|---|
| Home | `/`, `apps/web/app/page.tsx` | PASS | 200 on desktop/tablet/mobile; H1 rendered naturally | Hero typography defect did not reproduce; computed `word-spacing: 0px`, `text-align: start` |
| Catalog listing | `/san-pham` | PASS | 200; 20 images on first page; filters and pagination visible | Mobile uses filter drawer and horizontal header nav |
| Category list | `/danh-muc` | PASS | 200; category cards render | No images needed |
| Category detail | `/danh-muc/[slug]` | PASS | 200 for `m6-demo-van-hoc` | Breadcrumb and product grid present |
| Author browsing | `/san-pham?author=...` | WARN | Filter exists in catalog | Dedicated `/tac-gia/[slug]` route returns 404 |
| Publisher browsing | `/san-pham?publisher=...` | WARN | Filter exists in catalog | Dedicated `/nha-xuat-ban/[slug]` route returns 404 |
| Search | `/san-pham?q=atomic` | WARN | 200 and filtered result renders | Dedicated `/tim-kiem` route returns 404 |
| Product detail | `/sach/[slug]` | WARN | 200, gallery, variant, quantity, add-to-cart UI | Product metadata table can overflow on tablet for long ISBN |
| Legacy product redirect | `/san-pham/[slug]` | PASS | Next redirect configured | Redirects to `/sach/[slug]` |
| Login | `/dang-nhap` | PASS | 200; UI customer login succeeded | Vietnamese rendering appears correct at runtime |
| Register | `/dang-ky` | PASS | 200; form present | Password guidance can be improved later |
| Forgot/reset password | `/quen-mat-khau`, `/dat-lai-mat-khau` | PASS | 200; forms present | OTP UX depends on local mail mode |
| Cart | `/gio-hang` | PASS | Guest empty/auth prompt state renders | Authenticated cart flow not changed in audit |
| Checkout | `/thanh-toan` | PASS | Guest redirects to login UI; auth checkout exists | Checkout usability should be rechecked in M7.1B |
| Order success | `/thanh-toan/thanh-cong` | WARN | Safe fallback page renders | Original sitemap route `/dat-hang-thanh-cong/[orderCode]` is absent |
| Customer account | `/tai-khoan` and nested routes | PASS | Customer login reached order history | Sidebar is usable; mobile splits into two-column nav |
| Customer order history/detail | `/tai-khoan/don-hang`, `/tai-khoan/don-hang/[orderNumber]` | PASS | Order history rendered after UI login | Snapshot detail should remain a regression scenario |
| Admin login | `/admin/login` | PASS | Admin UI login succeeded | Redirects to admin catalog |
| Admin catalog | `/admin/catalog` | PASS | 20 product rows rendered after admin login | Admin list is functional but visually dense |
| Admin product editor | `/admin/catalog/[id]` | PASS | Component contains taxonomy, variants, images, inventory sections | Product-level inventory is current approved scope |
| Admin inventory | Product editor inventory panel | WARN | Standalone `/admin/inventory` returns 404 | Current scope is product-level inventory management |
| Admin orders | `/admin/don-hang`, `/admin/don-hang/[orderNumber]` | PASS | Admin order list rendered; 19 local results | Text says "Giai đoạn này chỉ đọc" although transitions exist in detail UI |
| Admin dashboard | `/admin/dashboard` | WARN | Route returns 404 | M6 docs classify standalone dashboard as accepted debt/deferred |
| Admin users/roles/settings | `/admin/users`, `/admin/roles`, `/admin/settings` | WARN | Routes return 404 | Static RBAC remains current implementation |
| Wishlist/favorites | None | WARN | Original requirements include Wishlist | Deferred in M6 documents |
| 404 | `/khong-ton-tai` | PASS | 404 with custom title/H1 | Works on all viewports |
| Dialogs | Cart confirmation, checkout address selector, admin transitions | PASS | Dialog components use `role=dialog` or `alertdialog` | Focus trap not verified as implemented |
| Toast | Cart provider toast region | PASS | `aria-live=polite`, close button | Toast UX appears locally scoped to cart provider |
| Empty states | Catalog/category/cart/orders/checkout/success fallback | PASS | Empty/fallback components found and several runtime states verified | Some empty copy can be more polished |

## Summary Score Table

| Hạng mục | PASS | WARN | FAIL | Priority |
|---|---:|---:|---:|---|
| Typography | 8 | 3 | 0 | Medium |
| UI consistency | 7 | 5 | 0 | Medium |
| CSS consistency | 7 | 4 | 0 | Medium |
| Product images | 5 | 4 | 0 | High |
| Product content | 5 | 5 | 0 | High |
| Responsive | 7 | 3 | 0 | Medium |
| Navigation | 6 | 5 | 0 | High |
| Accessibility | 6 | 4 | 0 | Medium |
| UX flow | 7 | 4 | 0 | High |
| Loading | 6 | 3 | 0 | Medium |
| Console/runtime | 8 | 2 | 0 | Low |
| Overall | 72 | 42 | 0 | High |

## Website Experience Scores

| Area | Score | Status |
|---|---:|---|
| Typography | 8.0/10 | PASS with polish needed |
| UI | 7.5/10 | WARN |
| CSS | 7.5/10 | WARN |
| Images | 6.5/10 | WARN |
| Content | 6.5/10 | WARN |
| Responsive | 7.5/10 | WARN |
| Navigation | 7.0/10 | WARN |
| Accessibility | 7.0/10 | WARN |
| UX | 7.0/10 | WARN |
| Loading | 7.0/10 | WARN |
| Overall | 7.2/10 | WARN |

## Top 10 Findings

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| High | Demo product content is visibly synthetic in several public screens | Product/category/author names include `M6 Demo...`; API returned 30 products with local demo/test records | M7.1B should define a curated display dataset or content cleanup plan |
| High | Several original sitemap surfaces remain absent | `/tim-kiem`, `/tac-gia/james-clear`, `/nha-xuat-ban/avery`, `/admin/dashboard`, `/admin/inventory`, `/admin/users`, `/admin/roles`, `/admin/settings` returned 404 | Reconcile as deferred or add UX routes in an approved implementation milestone |
| High | Product image coverage is incomplete | 7 of 30 public products have no primary image and fall back to placeholder | Prepare stable local/owned cover-image strategy |
| High | Most public products are out of stock in current local dataset | 25 of 30 products returned `inStock=false`; only 5 are purchasable | Adjust demo data policy later so catalog feels shoppable without changing Commerce Core |
| Medium | Product detail metadata can overflow on tablet | `/sach/m6-demo-regular-in-stock` at 768px showed overflow from ISBN in `.product-facts` | Add wrapping constraints for metadata values in M7.1B |
| Medium | Header mobile navigation relies on horizontal scroll | Mobile audit reports nav overflow with `overflow-x:auto` | Keep if intentional, but improve visual affordance or mobile menu |
| Medium | Admin UI language mixes English and Vietnamese | "Product", "Variant", "Soft-delete", "Active", "Inactive", "Admin" appear in admin views | Create terminology pass for Vietnamese consistency |
| Medium | LCP image warning appears on product detail in Next dev console | Product detail logs Next warning recommending eager loading for above-fold image | Plan image/performance pass under approved performance milestone |
| Medium | Search is implemented as catalog query, not a dedicated experience | `/san-pham?q=atomic` works; `/tim-kiem` 404 | Decide whether dedicated search route is still required |
| Low | Product detail thumbnail images use empty `alt` | Thumbnail buttons have ARIA labels but nested images have `alt=""` | Accept as decorative if button labels remain complete; include in accessibility regression |

## Stop Point

M7.1A is complete as audit documentation only. No source code was changed, no dependency was installed, no chatbot was created, no SEO/performance optimization was performed, and no commit/push was made.

## M7.1B Status Update

Status values:

- `FIXED`: addressed in M7.1B with code, test, or data evidence.
- `PARTIALLY FIXED`: improved, but still has approved remaining scope.
- `DEFERRED`: intentionally not implemented in M7.1B because it is outside approved polish scope.
- `NOT REPRODUCIBLE`: checked again and not observed.

| Finding ID | Source | Severity | Area | M7.1B status | Evidence |
|---|---|---|---|---|---|
| M7.1A-F01 | `docs/48`, `docs/51`, `docs/54` | High | Demo product content | FIXED | Local seed names, authors, publishers, descriptions, metadata fallback, demo account display names, and image alt text were changed from milestone/test wording to customer-facing Vietnamese copy while preserving slugs/SKUs/contracts. |
| M7.1A-F02 | `docs/48`, `docs/54` | High | Deferred routes | DEFERRED | No route was added. `/tim-kiem`, author/publisher detail, standalone inventory, dashboard, users, roles, and settings remain scope/documentation items rather than M7.1B implementation. |
| M7.1A-F03 | `docs/48`, `docs/51` | High | Product images | PARTIALLY FIXED | Product image rendering now treats known fake/example URLs as unusable, falls back to the internal placeholder, and detects Open Library 1px cover responses. Full owned cover-asset replacement is deferred. |
| M7.1A-F04 | `docs/48`, `docs/51` | High | Shoppable demo inventory | PARTIALLY FIXED | Demo catalog content was curated; inventory distribution was not broadly redesigned because Commerce Core and seed scenario behavior must stay stable. |
| M7.1A-F05 | `docs/48`, `docs/49`, `docs/52` | Medium | Product facts overflow | FIXED | `.product-facts dd` now wraps long values with `overflow-wrap:anywhere`. |
| M7.1A-F06 | `docs/48`, `docs/50`, `docs/52`, `docs/53`, `docs/54` | Medium | Mobile header navigation | FIXED | Header now exposes a keyboard-accessible menu button with `aria-expanded`, `aria-controls`, path-change close behavior, and Escape close behavior. |
| M7.1A-F07 | `docs/48`, `docs/49`, `docs/50`, `docs/54` | Medium | Admin terminology | FIXED | Admin catalog, product editor, taxonomy manager, and admin orders copy were moved toward Vietnamese user-facing terms such as `sản phẩm`, `phiên bản`, `tồn kho`, `lịch sử`, `ẩn`, and `ngừng hiển thị`. |
| M7.1A-F08 | `docs/48`, `docs/54` | Medium | Product detail LCP dev warning | PARTIALLY FIXED | Above-fold product detail image now requests eager loading. Broader performance work remains deferred to the M7 performance milestone. |
| M7.1A-F09 | `docs/48`, `docs/54` | Medium | Dedicated search route | DEFERRED | Catalog query search remains the current implemented search experience. No new `/tim-kiem` route was introduced. |
| M7.1A-F10 | `docs/48`, `docs/53` | Low | Thumbnail image alt | NOT REPRODUCIBLE | Thumbnail buttons already carry descriptive `aria-label`; nested `alt=""` remains decorative and did not block screen-reader labeling in the audit model. |

### Resolution Evidence Details

| Finding ID | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|
| M7.1A-F01 | Curated public demo categories, authors, publishers, active product names, descriptions, metadata fallback, image alt text, and local demo account display names. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts`, `apps/api/test/seed.integration.test.ts` | `npm run seed -w @rosach/api`; `npm run seed:validate -w @rosach/api`; `npm run test` passed. | Stable slugs/SKUs/order numbers still contain `m6-demo` for deterministic contracts. |
| M7.1A-F02 | Reconciled route scope and intentionally avoided implementing deferred surfaces. | Documentation only: `docs/48-m7-website-experience-audit.md`, `docs/55-m7-website-experience-polish-report.md` | `npm run build` route output confirms no new deferred routes were added. | Dedicated search/author/publisher/admin dashboard/inventory/users/roles/settings remain future scope or accepted debt. |
| M7.1A-F03 | Hardened product image fallback for fake/example URLs, Open Library 1px covers, and already-complete images after hydration. | `apps/web/features/catalog/product-image.tsx`, `apps/web/features/catalog/product-card.test.tsx` | Product-card regression passed; runtime catalog scroll showed 0 complete Open Library 1px images displayed. | Full owned/local cover asset strategy remains deferred. |
| M7.1A-F04 | Kept demo checkout coverage while avoiding business-rule inventory changes. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts` | Public API metrics after seed: 30 public products, 5 purchasable, 25 out of stock, purchasable ratio 16.7%. Demo checkout products are available. | Catalog still reads mostly out of stock; accepted because M7.1B is polish, not inventory redesign. |
| M7.1A-F05 | Added wrapping for long product fact values. | `apps/web/app/globals.css` | Runtime desktop/tablet/mobile route smoke reported 0 page overflow. | None for the reproduced ISBN/fact overflow class. |
| M7.1A-F06 | Added explicit mobile menu, ARIA state, Escape close, focus restoration, link close, and route-change close. | `apps/web/features/shell/site-header.tsx`, `apps/web/features/shell/site-header.test.tsx`, `apps/web/app/globals.css` | Header test passed; runtime keyboard check verified Tab, Enter, Space, Escape, Shift+Tab, link click, route change, no trap, no blocking console error. | Does not add a full drawer overlay; this is intentional polish, not redesign. |
| M7.1A-F07 | Applied Vietnamese user-facing admin terminology. | `apps/web/app/admin/catalog/page.tsx`, `apps/web/app/admin/catalog/[id]/page.tsx`, `apps/web/features/catalog/taxonomy-manager.tsx`, `apps/web/features/admin-orders/admin-orders-page.tsx` | Admin catalog/detail tests passed; runtime admin login/catalog/product inventory/orders smoke passed. | Internal API/domain identifiers remain English. |
| M7.1A-F08 | Set product detail primary image to eager loading. | `apps/web/features/catalog/product-detail-experience.tsx` | Build passed; runtime console had no blocking errors. | Some dev-only LCP warnings remain for other above-fold images and are deferred to M7 performance. |
| M7.1A-F09 | Kept `/san-pham?q=...` as current search route. | No source change | Runtime `/san-pham?q=atomic` smoke passed. | Dedicated `/tim-kiem` remains deferred. |
| M7.1A-F10 | Confirmed thumbnail images remain decorative inside labeled buttons. | No source change | Accessibility review found no blocking label issue for thumbnail buttons. | Deeper screen-reader audit can revisit later. |
