# M7.1B Website Experience Polish Report

Status: IMPLEMENTATION COMPLETE

Scope boundary:

- Frontend, UI/UX, CSS, demo data, accessibility, responsive behavior, image fallback, tests, and documentation only.
- No Commerce Core redesign.
- No database schema change.
- No checkout, inventory ledger, order snapshot, or API contract change.
- No chatbot, SEO milestone, public deployment, commit, or push.

## Executive Summary

M7.1B addressed the approved M7.1A website experience findings with focused polish rather than redesign.

Primary outcomes:

- Customer-facing demo seed data now reads like a real local bookstore instead of milestone scaffolding.
- Product images have safer fallback behavior for missing, fake, and unusable Open Library 1px covers.
- Mobile header navigation now has an explicit menu affordance with keyboard Escape support.
- Product detail facts wrap long metadata values on tablet/mobile.
- Admin catalog/product/taxonomy/order copy is more consistently Vietnamese.
- Demo accounts remain deterministic for Customer, Staff, and Admin.
- Quality gates pass after stopping local dev servers that were locking Prisma generated files.

Recommendation: READY FOR TECHNICAL LEAD REVIEW.

## Finding Reconciliation

| Finding ID | Severity | Area | Current Status | Planned Fix | Verification | Source Document |
|---|---|---|---|---|---|---|
| M7.1A-F01 | High | Demo product content | FIXED | Replace visible milestone/test copy with customer-facing Vietnamese demo content while preserving slugs/SKUs/contracts. | Seed integration tests passed; API smoke showed titles such as `Sổ Tay Đọc Sách Chậm`, `Cho Tôi Xin Một Vé Đi Tuổi Thơ`, `Frankenstein`. | `docs/48`, `docs/51`, `docs/54` |
| M7.1A-F02 | High | Deferred routes | DEFERRED | Do not implement routes outside approved capability scope; document status. | No new routes added; build route list unchanged for deferred surfaces. | `docs/48`, `docs/54` |
| M7.1A-F03 | High | Product images | PARTIALLY FIXED | Keep internal placeholder, detect fake/example URLs and Open Library 1px covers, preserve aspect ratio and alt text. | `features/catalog/product-card.test.tsx` covers fallback and Open Library 1px behavior. | `docs/48`, `docs/51` |
| M7.1A-F04 | High | Demo shoppability | PARTIALLY FIXED | Curate demo content without redesigning inventory distribution. | Seed validation blocking=false; purchasable demo products remain available. | `docs/48`, `docs/51` |
| M7.1A-F05 | Medium | Product facts overflow | FIXED | Add wrapping policy for product fact values. | CSS updated with `overflow-wrap:anywhere`; runtime desktop/tablet/mobile route smoke had no horizontal overflow. | `docs/48`, `docs/49`, `docs/52` |
| M7.1A-F06 | Medium | Mobile header nav | FIXED | Replace hidden horizontal-scroll assumption with explicit mobile menu button. | `features/shell/site-header.test.tsx` and Playwright smoke verified open/close and Escape behavior. | `docs/48`, `docs/50`, `docs/52`, `docs/53`, `docs/54` |
| M7.1A-F07 | Medium | Admin terminology | FIXED | Apply Vietnamese-facing glossary to admin catalog/product/taxonomy/order surfaces. | Admin tests updated; runtime admin catalog/product/order smoke passed. | `docs/48`, `docs/49`, `docs/50`, `docs/54` |
| M7.1A-F08 | Medium | LCP dev warning | PARTIALLY FIXED | Set product detail primary image to eager; document remaining dev-only card/home warnings. | Product detail code updated; browser smoke still recorded Next dev LCP warnings for other above-fold images. Deferred to M7 performance. | `docs/48`, `docs/54` |
| M7.1A-F09 | Medium | Dedicated search route | DEFERRED | Keep catalog query search as current search experience. | `/san-pham?q=atomic` runtime smoke passed; no `/tim-kiem` route added. | `docs/48`, `docs/54` |
| M7.1A-F10 | Low | Product thumbnail alt | NOT REPRODUCIBLE | Keep decorative thumbnail images because buttons have labels. | No blocking accessibility regression found in current UI model. | `docs/48`, `docs/53` |

## Technical Lead Review Closure

### Documentation Reconciliation Result

All M7.1A audit documents now preserve the original findings and include M7.1B resolution sections:

- `docs/48-m7-website-experience-audit.md`
- `docs/49-m7-typography-audit.md`
- `docs/50-m7-ui-consistency-audit.md`
- `docs/51-m7-product-content-audit.md`
- `docs/52-m7-responsive-audit.md`
- `docs/53-m7-accessibility-audit.md`
- `docs/54-m7-navigation-and-ux-audit.md`

Resolution statuses use only `FIXED`, `PARTIALLY FIXED`, `DEFERRED`, and `NOT REPRODUCIBLE`.

### Post-Implementation Product Metrics

Source: local API after `npm run seed -w @rosach/api` and `npm run seed:validate -w @rosach/api`.

| Metric | Value |
|---|---:|
| Total public products | 30 |
| Products with valid primary image URL | 23 |
| Products using placeholder | 7 |
| Products still using Open Library URLs | 23 |
| Open Library 1px images actually displayed after runtime fallback | 0 |
| Purchasable products | 5 |
| Out-of-stock products | 25 |
| Purchasable ratio | 16.7% |

The purchasable ratio remains low, but M7.1B intentionally did not change inventory business rules to make the catalog look fuller. This is accepted because the local demo has enough checkout-capable products:

- `m6-demo-regular-in-stock`
- `m6-demo-discounted-in-stock`
- `m6-demo-low-stock`
- `m6-demo-multi-author-edition`
- `m6-demo-optional-metadata-missing`

Therefore M7.1A-F04 remains `PARTIALLY FIXED`.

### Accessibility Keyboard Evidence

Runtime check: `http://localhost:3000/`, mobile viewport `390x844`.

| Check | Result |
|---|---|
| Tab reaches Menu button | PASS |
| Enter opens menu | PASS, `aria-expanded=true` |
| Space opens menu | PASS, `aria-expanded=true` |
| Escape closes menu | PASS, `aria-expanded=false` |
| Focus returns to Menu after Escape | PASS |
| Tab and Shift+Tab move through links | PASS |
| Link click closes menu | PASS |
| Route change closes menu | PASS |
| Keyboard trap | PASS, no trap observed |
| Blocking console error | PASS, none observed |
| Failed network requests | PASS, none observed |

Small source closure added after review:

- `apps/web/features/shell/site-header.tsx` now returns focus to the Menu button after Escape closes the mobile menu.
- `apps/web/features/shell/site-header.test.tsx` now covers Escape focus restoration and link-click close.

### Quality Gates Rerun

Quality gates were rerun after the review closure source/doc updates:

| Gate | Result |
|---|---|
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run test` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS, with existing Windows CRLF conversion warnings only |

Additional validation:

- `npm run seed -w @rosach/api`: PASS.
- `npm run seed:validate -w @rosach/api`: PASS, `blocking=false`, all blocker counts `0`.
- Runtime keyboard closure check: PASS.
- Runtime image fallback check: PASS, 0 complete Open Library 1px images displayed.

### Final Recommendation

M7.1B review closure is READY FOR FINAL TECHNICAL LEAD APPROVAL.

## Implemented Changes

### Curated Demo Data

- Replaced active demo category names with `Tổng hợp`, `Văn học`, `Kinh doanh`, `Khoa học`, and `Thiếu nhi`.
- Replaced demo author/publisher display names with customer-facing names.
- Replaced public active demo products with bookstore-like titles and natural Vietnamese descriptions.
- Added customer-facing fallback descriptions and SEO descriptions in seed generation.
- Preserved deterministic slugs, SKUs, and order numbers to avoid contract/regression churn.
- Added deterministic local Admin demo account alongside Customer and Staff.
- Made seed address update reuse an existing default address to preserve idempotency.
- Kept `coverType` stored as ASCII domain values because the current schema uses `VarChar`; frontend maps these values to Vietnamese display labels.

### Product Images

- Product image fallback now treats fake/example URLs as unusable.
- Open Library 1px responses are detected on image load and replaced with the internal placeholder.
- Fallback alt text is Vietnamese and product-specific.
- Product detail primary image requests eager loading.

### Mobile Navigation and Accessibility

- Header now exposes a mobile `Menu` button with `aria-controls` and `aria-expanded`.
- Menu closes on route change, link click, and Escape.
- Mobile nav uses visible grid links instead of requiring a user to infer horizontal scroll.

### Typography and Responsive

- Product fact values now wrap long content to prevent tablet overflow.
- Product detail maps `paperback`/`hardcover` values to Vietnamese display labels.

### Admin UI Terminology

- Admin catalog, product editor, taxonomy manager, and admin order page copy were changed toward Vietnamese terms:
  `sản phẩm`, `phiên bản`, `tồn kho`, `lịch sử`, `ẩn`, `ngừng hiển thị`, and `quản trị`.

## Before / After

| Area | Before | After |
|---|---|---|
| Demo data | Public names included `M6 Demo...` and synthetic descriptions. | Public seed data has bookstore-style Vietnamese names and descriptions. |
| Product image fallback | Broken/1px Open Library covers could appear as loaded images. | 1px Open Library covers and fake/example URLs fall back to `/book-placeholder.svg`. |
| Mobile nav | Header navigation could appear hidden behind horizontal scroll. | Mobile users get an explicit menu button and visible navigation panel. |
| Product facts | Long ISBN/metadata values could overflow tablet layout. | Fact values wrap within their container. |
| Admin language | Mixed English/Vietnamese labels such as Product, Variant, Soft-delete. | User-facing labels use Vietnamese wording consistently enough for demo. |

## Regression

Runtime local smoke:

- Desktop `1366x850`: PASS.
- Tablet `768x900`: PASS.
- Mobile `390x844`: PASS.
- Guest routes: PASS.
- Customer login/catalog/product/cart/checkout/orders smoke: PASS.
- Admin login/catalog/product inventory/orders smoke: PASS.
- Failed network requests: 0.
- Hydration/runtime errors: 0 blocking errors observed.

Remaining runtime warning:

- Next dev LCP warning still appears for some above-fold images outside the product detail primary image path. This is a non-blocking M7 performance follow-up.

## Quality Gate

| Gate | Result | Evidence |
|---|---|---|
| Format | PASS | `npm run format:check` -> all matched files use Prettier style. |
| Lint | PASS | `npm run lint` -> API, Web, Shared passed. |
| Type check | PASS | `npm run type-check` -> API, Web, Shared passed. |
| Tests | PASS | `npm run test` -> API 21 files/104 tests, Web 36 files/173 tests, Shared 1 file/1 test. |
| Build | PASS | `npm run build` passed after stopping local dev servers. Initial retry was needed because the running API watcher locked Prisma generated files on Windows. |
| Prisma validate | PASS | `npm run prisma:validate -w @rosach/api` passed. |
| Prisma migration status | PASS | `npx prisma migrate status` from `apps/api` -> 10 migrations, schema up to date. |
| Seed | PASS | `npm run seed -w @rosach/api` completed against local SQL Server. |
| Seed validation | PASS | `npm run seed:validate -w @rosach/api` -> `blocking=false`, all blocker counts `0`. |
| Catalog contract audit | PASS | `npm run catalog:contract-audit -w @rosach/api` -> all counts `0`. |
| Dependency audit | PASS WITH MODERATE WARNING | `npm audit --audit-level=high` exited 0; reported existing moderate PostCSS advisory through Next. |
| Runtime local | PASS | Web `http://localhost:3000`, API `http://127.0.0.1:4000/api/v1`. |
| Browser console/network | PASS WITH WARNING | No failed requests; no runtime/hydration errors; dev-only Next image LCP warnings remain. |
| Git diff check | PASS | `git diff --check` exited 0; only CRLF conversion warnings from Git on Windows. |

## Tests Added or Updated

- `apps/web/features/catalog/product-card.test.tsx`
  - Added regression for Open Library 1px cover fallback.
- `apps/web/features/shell/site-header.test.tsx`
  - Added mobile menu open and Escape close assertions.
- `apps/web/app/admin/catalog/page.test.tsx`
  - Updated for Vietnamese admin terminology.
- `apps/web/app/admin/catalog/[id]/page.test.tsx`
  - Updated for Vietnamese labels and Staff read-only copy.
- `apps/api/test/seed.integration.test.ts`
  - Updated seed expectations for curated local demo data, deterministic Admin account, and local demo ledger reasons.

## Known Deferred Items

- Dedicated `/tim-kiem`, author detail, publisher detail, standalone admin dashboard, standalone inventory, user/role/settings pages remain deferred or accepted debt per scope reconciliation.
- Full owned cover asset strategy remains deferred; current milestone only ensures stable fallback and no broken visual state.
- Broader image/LCP optimization remains M7 performance work.
- Formal contrast tooling and deeper accessibility audit remain follow-up work.

## Remaining Risks

| Risk | Severity | Status |
|---|---|---|
| Next dev LCP warning for some above-fold images | Medium | Accepted for M7 performance follow-up; not a functional blocker. |
| Some non-M7.1B legacy/demo slugs still contain `m6-demo` for deterministic contracts | Low | Intentional; display names are customer-facing. |
| Open Library remains external for non-curated imported catalog images | Medium | Mitigated by fallback; owned assets deferred. |

## Files Created

- `docs/46-m7-design-principles.md`
- `docs/47-m7-definition-of-done.md`
- `docs/55-m7-website-experience-polish-report.md`

## Files Modified for M7.1B

- `docs/00-document-map.md` - added M7.1/M7.1B document entries.
- `docs/48-m7-website-experience-audit.md` - added M7.1B status update.
- `apps/api/src/seed/demo-data.ts` - curated demo names/content/accounts while preserving stable identifiers.
- `apps/api/src/seed/demo-seed.ts` - customer-facing fallback copy, deterministic Admin account, seed idempotency, local demo ledger descriptions.
- `apps/api/test/seed.integration.test.ts` - updated seed regression expectations.
- `apps/web/app/globals.css` - mobile menu styles and product fact wrapping.
- `apps/web/features/shell/site-header.tsx` - accessible mobile menu state and close behavior.
- `apps/web/features/shell/site-header.test.tsx` - mobile menu regression coverage.
- `apps/web/features/catalog/product-image.tsx` - image fallback and Open Library 1px handling.
- `apps/web/features/catalog/product-card.test.tsx` - image fallback regression coverage.
- `apps/web/features/catalog/product-detail-experience.tsx` - eager primary image and Vietnamese cover-type display labels.
- `apps/web/app/admin/catalog/page.tsx` - Vietnamese admin catalog terminology.
- `apps/web/app/admin/catalog/page.test.tsx` - updated assertions.
- `apps/web/app/admin/catalog/[id]/page.tsx` - Vietnamese product editor terminology and messages.
- `apps/web/app/admin/catalog/[id]/page.test.tsx` - updated assertions.
- `apps/web/features/catalog/taxonomy-manager.tsx` - Vietnamese taxonomy management copy.
- `apps/web/features/admin-orders/admin-orders-page.tsx` - removed stale read-only admin wording.

## Recommendation

M7.1B is READY FOR TECHNICAL LEAD REVIEW.

Do not proceed to M7.2 until Technical Lead review is complete.
