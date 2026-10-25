# RoSach Project Memory

## Current Milestone Baseline

- As of 2026-07-23, **M7.5D is APPROVED / CLOSED** and **M7.6 is READY** under the final Technical Lead and Product Owner scope decision.
- The chatbot is accepted in its current state. Search and canonical product navigation remain unchanged; chatbot image rendering and the no-result retry improvement are out of scope. `M75-CHATBOT-001A` and `M75-CHATBOT-001B` are accepted/closed and do not block deployment.
- The normal catalog image requirement passes: all 24 active public products have exactly one valid origin-relative primary cover with deterministic first sort order and meaningful Vietnamese alt text.

## M7.5A Full System QA, Admin Catalog and Access Guard

- M7.4E Admin Operations and Revenue Center is APPROVED/CLOSED and is the current baseline.
- M7.5A is a bounded full-system audit plus two authorized corrections: the broken lower classification section of `/admin/catalog` and the Admin route-access/unauthorized-user policy.
- Product management remains the upper catalog area. Classification management now has separate category/author/publisher tabs, a semantic table, aligned fields, wrapped descriptions, usable sort order, labelled status controls, distinct save/toggle/hide actions, active/inactive/all filters, and loading/empty/error/retry states.
- Recognized technical taxonomy identities are excluded from the default operational view but remain inspectable through explicit QA/all views. Existing bounded cleanup and `seed:validate` remain authoritative; no raw SQL or broad deletion is permitted.
- The Admin shell now validates both session and role before rendering children. Anonymous and CUSTOMER users cannot render the Admin shell or protected content and are redirected to `/`; CUSTOMER receives the approved denial message. `/admin/login` remains anonymous-accessible, while authenticated ADMIN/STAFF are redirected to `/admin/dashboard`.
- API authorization remains unchanged and authoritative: Staff keeps approved read-only access, Admin-only mutations retain `PRODUCT_MANAGE`, and direct anonymous/customer API calls retain 401/403 behavior.
- M7.5A documents 95-97 are the QA plan, defect register, and corrective report. No package, schema, migration, Commerce Core, historical order, Typebot contract, deployment, commit, or push belongs to this pass.

## M7.3A Performance Audit And Baseline

- M7.2B Technical SEO Implementation is treated as APPROVED/CLOSED, and M7.3A is audit-only.
- M7.3A created docs 73-80 and updated the document map/project memory only; no application source, CSS, config, package, tests, API, database, asset, commit, push, deployment, analytics, or Search Console work was performed.
- Teacher Chapter 8 SEO Audit Checklist workbook was present locally with four sheets: Technical SEO, Onpage SEO, Offpage SEO, and Common Tools. Performance-related teacher criteria remain split across locally measurable source evidence, M7.3B implementation candidates, and M7.5/public deployment validation.
- Baseline quality gates passed before documentation closure: `npm run format:check`, `npm run lint`, `npm run type-check`, `npm run test`, SEO regression command, `npm run build`, and `git diff --check`.
- Local production runtime was started with `npm run start -w @rosach/web -- -p 3100` after build and then stopped. HTTP-only route timing was collected, but it is not a Core Web Vitals/PageSpeed metric.
- API at `http://127.0.0.1:4000/api/v1` was unavailable during runtime measurement; data-driven public route runtime metrics are not certification-grade.
- Production runtime without `NEXT_PUBLIC_SITE_URL` triggered the expected SEO runtime safety guard on root metadata. M7.3B/M7.5 measurement must configure a real non-secret local/public origin instead of weakening the SEO guard.
- Primary M7.3B candidates from audit: split high-level client shell boundary, verify product/category metadata/page duplicate fetch behavior, reassess product image hydration and LCP image priority with browser evidence, measure markdown stack cost on product detail, and only then consider targeted CSS/runtime interaction work.
- Public PageSpeed, Lighthouse certification, mobile-friendly validation, and Core Web Vitals remain NOT MEASURED / REQUIRES PUBLIC DEPLOYMENT unless Technical Lead approves local measurement tooling.

## M7.2B Technical SEO Implementation

- M7.2B implemented approved technical SEO scope after M7.2A closure.
- Site identity is now explicit in the local web app: root metadata has application name, metadataBase from the existing SEO runtime config, manifest link, local icons, viewport, and theme color.
- Local owned assets added for favicon, application icons, apple touch icon, and social preview fallback.
- Default Open Graph/Twitter fallback now uses raster `/social-preview.png` instead of the book placeholder.
- Organization/WebSite graph is activated once on the public homepage through `StructuredDataRenderer`; it is not rendered globally in root layout.
- BreadcrumbList is active on product and category detail pages.
- CollectionPage/ItemList is active for stable catalog/category route data, while query/filter states remain noindex and avoid collection graph.
- Sitemap `lastModified` remains deferred because current frontend catalog/category DTOs do not expose a reliable public timestamp. No fake timestamp, API contract change, Prisma change, deployment, AI, chatbot, analytics, package, commit, or push was introduced.
- M7.2B regression evidence is recorded in `docs/65-m7-seo-implementation-plan.md`.
- Teacher Chapter 8 SEO checklist alignment is recorded in `docs/72-m7-teacher-seo-checklist-compliance.md`; external/deployment/marketing criteria are classified separately from source-code SEO defects.

## M6.4 Graduation Certification & Project Closure

- M6.4 closure evidence is prepared for Technical Lead review.
- RoSach remains a local-only graduation release candidate: web `http://localhost:3000`, API `http://127.0.0.1:4000/api/v1`, database local SQL Server through Prisma.
- No public deployment, domain, DNS, SSL, production monitoring, chatbot, recommendation AI, or semantic search is part of M6.
- Final M6 documents added: closure report, release notes, final capability matrix, architecture decision index, technical debt register, local demo runbook, and M7 entry criteria.
- Deterministic demo accounts are Customer `m6demo`, Staff `m6staff`, and Admin `m6admin`.
- Accepted M6 local-release debt: partial admin dashboard, deferred wishlist/favorites, deferred role-management UI, broader browser E2E automation, deeper accessibility audit, LCP image optimization, and production-only deployment hardening.

## M6.2 Commerce Core Remediation

- Inventory Movement boundary added for committed stock changes.
- Manual adjustments, checkout consumption, and order cancellation restoration now update `Inventory` and append `InventoryLedger` in the same Prisma transaction.
- Cart remains non-reserving: cart writes validate stock but do not mutate `onHandQuantity`, `reservedQuantity`, or ledger.
- The locked baseline remains unchanged: Catalog Read Model current state, Order Snapshot historical truth, Product.primaryCategoryId category authority, Inventory Ledger stock movement truth, and AppError standard contract.

## Project

RoSach là website bán sách.

Stack:

- Next.js
- Express
- Prisma
- SQL Server

---

## Team

Product Owner:
Nguyễn Kim Tài

Technical Lead:
ChatGPT

Software Engineer:
Codex

---

## Development Rules

- Không over-engineer.
- Không redesign khi chưa được phép.
- Không refactor ngoài scope.
- Không thay đổi database nếu milestone không yêu cầu.
- Mọi thay đổi phải regression test.

---

## Current Progress

M5 Official Closure: CLOSED on 2026-07-20.

Final M5 decision:

- Architecture Review: APPROVED.
- Business Logic: APPROVED.
- Security: APPROVED.
- Inventory Integrity: APPROVED.
- API Contract: APPROVED.
- Functional Browser QA: APPROVED.
- Typography: APPROVED.
- Vietnamese Content: APPROVED.
- Responsive Quality: APPROVED.
- Automated Quality Gates: PASS.
- Final Quality Gate: PASS.
- Official status: M5 CLOSED.

Final completed M5 scope:

- Customer: catalog, product detail, category browsing, variant selection, product gallery, and cart integration.
- Admin: product creation, product editor, variant management, image management, taxonomy management, inventory adjustment, and permission-aware UI.
- Inventory: `RECEIVE_STOCK`, `MANUAL_INCREASE`, `MANUAL_DECREASE`, `CORRECTION`, immutable ledger, negative-stock protection, and concurrent-adjustment conflict handling.
- Security: RBAC, `PRODUCT_READ`, `PRODUCT_MANAGE`, Public/Admin DTO separation, sensitive-field protection, validation, and stable error envelopes.
- Quality: responsive verification, real-browser QA, Vietnamese typography correction, automated tests, build validation, and QA data cleanup.

Final quality evidence recorded for closure:

- Prisma format: PASS.
- Prisma validate: PASS.
- Migration status: PASS.
- 9 migrations applied.
- Lint: PASS.
- Type-check: PASS.
- API tests: 76 PASS.
- Web tests: 73 PASS.
- Shared tests: 1 PASS.
- Build: PASS.
- Format check: PASS.
- `git diff --check`: PASS.
- Browser viewport verification: 390x844 PASS, 430x932 PASS, 768x1024 PASS, 1024x768 PASS, 1280x800 PASS, 1440x900 PASS.

M5 late-phase closure notes:

- M5E Phase 5.3A passed.
- M5E Phase 5.3B passed.
- M5E Phase 5.3C passed.
- Product Owner found production-facing typography and Vietnamese-content defects during browser QA; they were corrected and approved.
- Final Technical Lead review passed.
- No schema changes were introduced during 5.3B or 5.3C.
- No dependency changes were introduced during 5.3B or 5.3C.
- Temporary QA data was removed.

Next planned milestone:

- M6 - SEO & Production Readiness.
- M6.0 - SEO Architecture & Production Readiness Design has been documented in `docs/30-seo-architecture-specification.md` on 2026-07-20.
- M6.0 is documentation-only: no application code, API, database schema, migration, dependency, lockfile, seed data, database record, or deployment change was made.
- M6.0 key decisions recorded: current and planned SEO states are separated; indexability, metadata, canonical, robots, sitemap, structured-data, breadcrumb, internal-linking, image SEO, filtering/search, content, testing, quality-gate, ADR, risk, and roadmap strategies are documented.
- M6.0 unresolved ADR candidates include canonical origin configuration, environment-aware indexing, dynamic sitemap design, deep pagination canonical policy, Product versus Book structured-data graph, author/publisher landing-page scope, slug history/redirect policy, filter indexability, primary category selection, SEO metadata field ownership, image hosting strategy, analytics platform, and staging indexing protection.
- M6.0 is closed and M6.1 has started.
- M6.1A - SEO Core Platform implemented the framework-agnostic SEO Descriptor pipeline under `apps/web/lib/seo`.
- M6.1A includes central typed SEO configuration, URL resolution and normalization, descriptor validation, descriptor normalization, safe enrichment, asset-generation primitives, consistency validation, a thin Next.js metadata adapter, and unit tests.
- M6.1A-R1 remediated Technical Lead contract gaps: production origin no longer silently falls back to localhost, SEO issue severity uses the frozen `BLOCKER` / `MAJOR` / `MINOR` / `INFO` model, blocking logic is centralized, the SEO public API barrel was narrowed, and tests were added for idempotence, Vietnamese text preservation, malformed image URL handling, BLOCKER output prevention, deterministic generation, production localhost rejection, and adapter robots preservation.
- M6.1A-R2 remediated final SEO core behavior gaps: `BLOCKER` is the only severity that makes generation unsuccessful, `MAJOR` issues are retained on successful downgraded output and fail the SEO quality gate through `hasSEOQualityGateIssue`, unpublished/indexable is classified as `MAJOR`, deterministic description/image fallbacks emit retained `INFO` diagnostics, and production asset consistency rejects local-origin URL leakage as `BLOCKER`.
- M6.1A does not activate page-level SEO features. Existing pages, `robots.ts`, `sitemap.ts`, and product JSON-LD remain on the M5 implementation until later M6 packages intentionally migrate them.
- M6.1A introduced no Prisma schema changes, migrations, backend API changes, package/dependency changes, seed data, database records, visible UI changes, deployment changes, commit, or push.
- M6.1B - Metadata Framework integrated the SEO Platform into Home, catalog, category list/detail, book detail, promotion, cart, and 404 metadata.
- M6.1B metadata follows `View Model -> SEODescriptor -> buildSEOAssets() -> toNextMetadata() -> generateMetadata()` and includes title, description, canonical, Open Graph, Twitter, and route-level robots directives where descriptors are non-indexable.
- M6.1B added focused metadata tests for home, catalog, category, and book routes, including canonical generation, title templating, description fallback behavior, fallback image behavior, and adapter consistency.
- M6.1B preserved existing `robots.ts`, `sitemap.ts`, and product JSON-LD; no schema, migration, backend API, dependency, lockfile, seed data, database record, deployment, commit, or push was introduced.
- M6.1C - Canonical & Robots Policy extended the SEO Descriptor contract with explicit `follow` and `noarchive` support, integrated catalog query noindex/follow behavior, private/auth/transactional/account/404 noindex/nofollow behavior, and Admin noindex/nofollow/noarchive behavior.
- M6.1C updated the existing `robots.ts` only for site-level crawl policy: public crawling remains allowed, private/admin/transactional/auth paths are disallowed, the existing sitemap URL remains exposed, and catalog query URLs remain crawlable so page-level canonical/noindex metadata can work.
- M6.1C preserved existing sitemap generation and product JSON-LD; no backend API, Prisma schema, migration, dependency, lockfile, seed data, database record, deployment, commit, or push was introduced.
- M6.1D - Sitemap Framework implemented typed sitemap providers, a sitemap builder, URL normalization, deduplication, sorting, reusable validation, and a small Next.js `app/sitemap.ts` integration.
- M6.1D providers cover static public routes, promotion route, categories, and books while excluding private/auth/account/cart/checkout/Admin routes according to M6.1C policy.
- M6.1D validation detects duplicate URLs, relative URLs, malformed URLs, localhost URLs when disallowed, invalid priority, invalid changeFrequency, and missing `lastModified` as a non-blocking diagnostic.
- M6.1D preserved existing metadata, robots policy, product JSON-LD, backend APIs, Prisma schema, migrations, dependencies, lockfiles, seed data, database records, deployment, commit, and push.
- M6.1D-R1 remediated Technical Lead review findings: duplicate detection now happens before deduplication in `buildSitemap()`, root SEO exports are narrowed, sitemap config reuses `seoConfigFromEnvironment`, provider failures produce retained diagnostics while preserving generation, validation severities are aligned with the SEO issue model, and tests were expanded for empty providers, provider failures, duplicate diagnostics, validation diagnostics, invalid `lastModified`, and protocol edge cases.
- Planned only, not implemented in M5 closure, M6.0, M6.1A, M6.1B, M6.1C, M6.1D, or M6.1D-R1: JSON-LD expansion, book seed dataset of approximately 30-50 books, slugs and image alt text data work, performance and SEO audit, staging deployment, closed beta testing, bug triage, and release patches.

M5D Checkout Phase 1.5: implemented / not released on 2026-07-19.

M5D scope:

- Phase 1 created the transaction core for `POST /api/v1/checkout`: validate cart, revalidate product/variant/price/stock, create Order/OrderItems, reduce inventory, clear CartItems, and rollback atomically on failure.
- Phase 1.5 hardens the frontend contract: request body accepts only `shippingAddressId`, `paymentMethod`, and optional `deliveryNote`; commercial values remain backend-owned.
- Checkout requires `Idempotency-Key`, scoped by Customer and enforced by `CheckoutIdempotency` unique `(customerId, key)`.
- Repeating the same key with the same request returns the original order confirmation without creating another order or consuming stock again; reusing the key with a different request returns conflict.
- Order now snapshots delivery fields from owned Address: recipient name, phone, line1, ward, district, province, postalCode, and delivery note.
- Payment model separates `orderStatus`, `paymentMethod`, and `paymentStatus`; Phase 1.5 supports COD only and COD orders remain `UNPAID`.
- Order stores historical `subtotal`, `shippingFee`, `discount`, and `grandTotal`; current scope uses `shippingFee=0` and `discount=0`.
- Database migrations added: `20260719143000_m5d_checkout_foundation` and `20260719170000_m5d_checkout_contract_hardening`.
- Deferred: Checkout UI, address selection UI, shipping calculation/settings, coupon/discount logic, external payment gateways, payment attempts, order detail/history UI, and admin order management.

M5D Checkout Phase 2 frontend: implemented / not released on 2026-07-19.

M5D Phase 2 scope:

- Checkout route added at `/thanh-toan`; success route added at `/thanh-toan/thanh-cong`.
- Checkout UI consumes the backend `POST /api/v1/checkout` contract with `Idempotency-Key`, `shippingAddressId`, `paymentMethod=COD`, and optional `deliveryNote`.
- The frontend never submits customerId, cartId, prices, inventory, subtotal, shipping fee, discount, grand total, order status, or payment status.
- Checkout page reuses CartProvider state, Account address API, existing auth/session helpers, currency formatting, product image fallback, toast notification, and RoSach visual tokens.
- Address selection uses owned `/me/addresses` data, supports default-address selection, no-address state, refresh-on-address-error, keyboard-accessible dialog controls, and links to `/tai-khoan/dia-chi` for address creation.
- Idempotency lifecycle: a key is created only for a valid checkout attempt, reused for the same request including uncertain network retry, regenerated when material checkout inputs change, and cleared after successful confirmation.
- Success page stores the order confirmation temporarily in `sessionStorage`; refresh without data shows a safe fallback because there is no order lookup/detail endpoint yet.
- Error mapping covers price changed, stock, disabled product/variant, empty cart, invalid address, unsupported payment validation, idempotency in progress/conflict, transaction conflict, and authentication expiration.
- Deferred: permanent order lookup/detail API + UI, embedded address creation form, shipping/coupon calculation UI, online payment methods, and stronger multi-tab status resolution.

M5B Auth Stability & Customer Readiness: in progress / not released on 2026-07-19.

M5B scope:

- Customer public auth stabilized for register, email login, refresh-backed session, logout, header auth state, and protected `/tai-khoan`.
- Public register accepts full name, email, phone, and password; username is generated server-side from email because the current User schema still requires a unique username.
- Public register remains role-safe: role is not accepted from the request and new public accounts are `CUSTOMER` / `ACTIVE`.
- Customer login uses email and password. Admin/Staff login keeps the existing username-compatible privileged route.
- Current user API remains `GET /api/v1/auth/session`; no duplicate `/auth/me` route was added.
- Minimal account entry remains `/tai-khoan`; existing profile, address, and change-password routes are reused from M4 where safe.
- No avatar, upload, social login, fake email verification, order history, wishlist, or notification settings were added.
- Advanced profile expansion is deferred. Email editing remains blocked until a real verification/re-verification flow exists.
- Database decision: no migration for M5B. Existing User, RefreshToken, PasswordResetOtp, AuditLog, and Address schema support the approved scope.
- Contact/footer work deferred because Auth stability is the priority.

M5C Shopping Cart Phase 2: implemented / not released on 2026-07-19.

M5C scope:

- Backend cart foundation added for authenticated Customers in Phase 1.
- Cart model enforces one cart per customer with a unique `customerId`.
- CartItem stores `unitPrice` as the snapshot sale price at add time.
- CartItem uses unique `(cartId, variantId)` so adding an existing variant increases quantity.
- Cart subtotal is not stored; API calculates item subtotal, cart subtotal, and total quantity.
- Cart does not reserve inventory. Checkout will own reservation and price revalidation.
- Clearing cart deletes CartItems only; Cart itself remains.
- API routes: `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/:id`, `DELETE /api/v1/cart/items/:id`, `DELETE /api/v1/cart`.
- Database migration added: `20260719090000_m5c_cart_foundation`.
- Phase 2 frontend adds authenticated Cart API integration, global cart state, refresh synchronization, optimistic quantity/remove/clear updates, and backend-authoritative totals.
- Header cart badge displays `totalQuantity` and synchronizes after every cart mutation.
- Product detail supports authenticated add-to-cart with loading/out-of-stock states and toast feedback.
- `/gio-hang` includes loading, guest, error, empty, item list, quantity controls, confirmation dialogs, and responsive order summary states.
- Checkout remains disabled and explicitly deferred to M5D. No order, revenue, admin dashboard, database, or Cart business-rule changes were made in Phase 2.

M5A Product and SEO Foundation: PASS / READY FOR RELEASE on 2026-07-19.

M5E Phase 5 Professional Catalog Experience work:

- Product detail now uses selected variant state for price, SKU/ISBN, availability, quantity, and Add to Cart.
- Public Add to Cart passes the selected variant ID and quantity to the existing cart API; backend remains price/stock authority.
- Public product gallery supports thumbnail selection with stable image ratio and fallback image behavior.
- Public catalog exposes database-backed category, author, publisher, price, availability, featured/new, search, sort, active-filter, and numbered pagination URL state.
- Product cards use the minimum sellable price policy for multi-variant products, displayed as "Từ ..."; inactive variants remain excluded by public DTOs.
- Admin inventory remains adjustment-based through the Phase 4 dialog; no direct stock editing was added.

M5E Phase 5.3A Admin Product Authoring Closure:

- `/admin/catalog` remains the deliberate two-step entry point: Admin creates a minimal Product, the backend creates it inactive, and the UI redirects immediately to `/admin/catalog/[id]?created=1`.
- `/admin/catalog/[id]` is the full authoring surface for metadata, categories, authors, publisher, visibility flags, variants, images, and read-only inventory summary.
- The editor shows a completion checklist so an incomplete product is not presented as publicly sellable before metadata, active variants, and images are ready.
- Product metadata save uses controlled form state, client validation for title/slug/category, submit locking, user-safe error mapping, and server refresh after successful save.
- Variants remain separate records with immutable SKU in the editor; add/edit/deactivate flows use the existing backend APIs. Deactivation uses an accessible confirmation dialog and keeps the variant admin-visible while public DTOs hide inactive variants.
- Product images use existing upload/patch/delete APIs. The UI supports upload validation, primary image selection, persistent `sortOrder`, and delete confirmation.
- Inventory stays adjustment-only: the product editor displays stock and ledger but does not expose direct stock inputs.
- Staff with `PRODUCT_READ` can view catalog/product detail, variants, images, and inventory summary but does not see authoring, image, variant, or inventory adjustment controls.
- Real Chromium QA on the local web/API/SQL Server stack covered minimal create, metadata persistence, three variant creation, two variant edits, duplicate SKU, invalid price, variant deactivation, three image uploads, invalid image upload, primary image, image ordering, image removal, Staff read-only UI, and responsive interactions at 390, 430, 768, 1024, 1280, and 1440 px.
- Known limitation: no drag-and-drop image ordering was added; ordering uses the existing numeric `sortOrder`.

M5E Phase 4 Inventory Adjustment implemented:

- Internal admin inventory adjustment is command-based, not direct stock editing.
- New immutable `InventoryLedger` records adjustment type, quantity delta, before/after on-hand quantity, reason, actor snapshots, and timestamp.
- `POST /api/v1/admin/inventory/adjustments` requires `PRODUCT_MANAGE`; Staff with only `PRODUCT_READ` remains read-only through `GET /api/v1/admin/inventory/variants/:variantId`.
- Adjustments are transactional and use optimistic concurrency with `expectedOnHandQuantity`.
- `reservedQuantity` is not changed by this module; checkout/order workflows keep ownership of reservation and consumption semantics.

M5A completed:

- Inventory foundation added with one-to-one ProductVariant Inventory.
- Public product list/search/filter/sort/pagination completed.
- Product detail page completed at canonical route `/sach/[slug]`.
- Legacy product route `/san-pham/[slug]` returns permanent redirect to `/sach/[slug]`.
- Category canonical route `/danh-muc/[slug]` completed.
- SEO metadata, canonical links, Product JSON-LD, sitemap and robots completed.
- Demo catalog seed added with 24 products across categories/authors/publishers.
- Product images use Open Library Covers by ISBN where available and RoSach fallback otherwise.

M0 ✅

M1 ✅

M2 ✅

M3 ✅

M4 ✅

M4.1 ✅

M4.2 ✅

M4.3 complete through M5A release gate

M4.3.1 Local Environment Stabilization ✅ verified locally on 2026-07-19.

---

## Current Design

Editorial

Minimal

White

Warm Gray

Burgundy

Georgia heading

System Sans body

---

## Definition of Done

...

---

## Technical Debt

- TD-M6-001: A dedicated repository Playwright E2E configuration and CI suite are not yet present. This is non-blocking for M5 and should be planned under M6 production readiness.
- TD-M6-002: Some UI terminology may still mix Vietnamese and English. This is non-blocking for M5 and should be reviewed during M6 content/UX polish.
- TD-M6-003: Safari/iOS typography and responsive behavior should be verified after deployment. Chromium responsive verification passed for M5.
- TD-M6-004: LF/CRLF warnings remain on Windows. They are reported honestly and were not fixed through broad unrelated rewrites.
- TD-M6-005: Final UX and visual defects will be collected during closed beta testing. This does not reopen M5.
- TD-UI-001 resolved by M7.4C-D1: the canonical public demo catalog uses owned local category covers; Open Library is no longer a demo-runtime dependency.
- TD-QA-001: M5A browser quality gate was run manually with Playwright/Chromium; add a first-class repository e2e suite when Technical Lead approves QA automation scope.
- Wishlist, Checkout UI, full Order history/management, external Payment, Inventory reservation flow, Dashboard/reporting, Review/CMS/RoBot are not implemented yet. Cart is implemented through M5C Phase 2 and Checkout backend is implemented through M5D Phase 1.5 but not released.
- `/khuyen-mai` is currently an informational route only; there is no Promotion schema or business logic.
- Local smoke can create Customer test accounts. User hard delete/anonymize is not part of the approved account policy, so smoke accounts should not be destructively removed without Technical Lead approval.
- Running `npm run build` while the API dev watcher is active can lock the generated Prisma query engine on Windows. Stop the API watcher before production build or rerun build after stopping it.

---

## Local Environment Notes

- `apps/api/.env` must include `DATABASE_URL`, `JWT_SECRET`, `OTP_PEPPER`, `JWT_ISSUER`, `JWT_AUDIENCE`, `MAIL_MODE`, `SMTP_FROM`, `API_HOST`, `API_PORT`, `WEB_ORIGIN` and a local image adapter setting.
- `JWT_SECRET` and `OTP_PEPPER` must be at least 32 UTF-8 bytes and must never be printed or committed.
- Current local SQL Server root cause was environment/configuration, not TLS: SQL Server is listening on `127.0.0.1:1433`, TCP/IP is enabled, SQL Server Authentication works, `encrypt=true` with `trustServerCertificate=true` works for local, and `RoSachDb` contains the current 15-table schema.
- Prisma should use SQL Server Authentication in the local `DATABASE_URL`; do not rely on Windows Integrated Authentication for Prisma local startup.

---

## Next Milestone

M7.3A Runtime Baseline Closure: completed for final Technical Lead review on 2026-07-22.

- M7.3A remained audit/documentation-only: no application source, CSS, config source, API/database source, package, commit, push, deployment, chatbot, dashboard, or M7.3B implementation change.
- Local SQL Server, Prisma migration status, demo validation, API health, public product/category fixtures, and production-mode web browser baseline are now measured.
- Production measurement used process-only local origin `http://127.0.0.1.nip.io:3100` to preserve the production localhost SEO guard; this is not a public deployment host.
- Browser baseline covered 13 routes × desktop/mobile × 3 fresh runs using Chromium. Public core routes rendered valid content; checkout anonymous redirect and missing-route 404 were expected. No successful-route hydration/console error was observed.
- Recalibration: PERF-02 local measurement prerequisite closed; PERF-01 Medium-High validation-only; PERF-03 not confirmed because SSR fetches are invisible in browser network; PERF-04 image evidence split; PERF-05/06 Info accepted debt; PERF-07 Maintain/Info; PERF-08 deferred to public deployment.
- Scores: source readiness 5.8/10, local browser readiness 6.3/10, provisional overall 6.0/10; Core Web Vitals/PageSpeed remain NOT MEASURED.
- M7.3B is not started and is only READY WITH CONDITIONS for a future approved, confirmed low-risk optimization sprint.

M6.0C Business Foundation Certification is CLOSED / APPROVED as of 2026-07-20.

M6.2 is READY FOR TECHNICAL LEAD SPECIFICATION.

M6.2 implementation has not started.

M6 - SEO & Production Readiness is the next planned milestone.

M6.0 architecture specification has been created and closed.

M6.1 has started with M6.1A SEO Core Platform. Later M6.1 packages must not activate page-level SEO features until explicitly assigned.

...
## M7.3B Performance Optimization

- Authorized after M7.3A closure; execution remained validation-first.
- No application, CSS, configuration, API/database, schema, migration, or package change was made because no permitted candidate was confirmed by sufficient evidence.
- Product image policy remained acceptable; duplicate SSR fetch remains unconfirmed; SiteChrome/CartProvider is accepted debt pending measurable client/bootstrap evidence.
- Public CWV remains not certified and deferred to deployment/public measurement.
- M7.3B final build-lock closure: after all RoSach-owned Node runtime/watch processes were stopped, `npm run build` passed (Prisma generate and Next production build). The earlier EPERM was environmental; no source change was made to resolve it.
- M7.4A is documentation-only: Typebot Cloud Free is suitable for a quota-limited demo, but all privacy/retention and JSON mapping uncertainties require POC. Recommended future architecture is a dedicated public read-only deterministic chatbot API over CatalogReadModel; no LLM or Typebot embed was implemented.
- M7.4B-0 Typebot Free capability POC is APPROVED AND CLOSED. Manual workspace evidence confirmed HTTP POST, variable mapping, conditions, UI controls, testing and publish capability; the disposable mock/tunnel was removed after the Technical Lead accepted the flattened mapping and Free-plan branding limitation.
- M7.4B-1 Chatbot API Foundation is implementation-complete and awaiting final Technical Lead review. It adds public read-only `POST /api/v1/chatbot/search`, strict validation, deterministic Vietnamese intent/price parsing, public CatalogService integration, a flattened three-slot Typebot response, a dedicated 30/minute limiter, bounded timeout, stable public errors and focused tests.
- M7.4B-1 does not include the Typebot widget/final publish, an LLM or AI key, private customer/cart/order/account access, schema/migration, Commerce Core changes, dashboard, deployment, package installation, commit or push.
- M7.4B-1 is APPROVED AND CLOSED. M7.4C repository integration adds a disabled-by-default, client-only, lazy Typebot bubble loader to public SiteChrome without a package dependency or API contract change.
- M7.4C uses `NEXT_PUBLIC_TYPEBOT_ENABLED` and validated `NEXT_PUBLIC_TYPEBOT_PUBLIC_ID`; missing or malformed configuration fails safely. The widget passes no private/session/cart/order data, preserves CartProvider and Admin behavior, uses an accessible safe-area-aware launcher, and prevents duplicate initialization.
- M7.4C Typebot flow mappings use the real wrapped response paths under `data.*`; no-results remains successful with `resultCount = 0`. Authenticated workspace configuration, stable public API URL, final publish, environment activation, and real desktop/mobile embed evidence remain manual M7.4D prerequisites.

## M7.4C-D1 Public Demo Catalog Data Hygiene

- The local public catalog is canonicalized to 24 Vietnamese synthetic books and exactly eight active public categories: Văn học, Thiếu nhi, Kinh tế, Kỹ năng sống, Phát triển bản thân, Khoa học, Lịch sử, and Công nghệ thông tin.
- The old M5A catalog is retired and its command delegates to the canonical seed. Existing M5A local records are deactivated, not deleted.
- Six M6 product identities are reused by stable SKU, preserving variant, cart, order, inventory, ledger, and immutable snapshot history while public titles/slugs/content are cleaned.
- Eight owned neutral PNG covers under `apps/web/public/demo-covers` replace remote Open Library/fallback dependence. All 24 public products have primary images, title-specific alt text, and descriptions of at least 220 characters.
- Cart/Checkout integration teardown deactivates fixtures before graph deletion. Guarded local cleanup now recognizes timestamp-independent QA prefixes; `seed:validate` blocks visible QA/legacy records, unapproved categories, missing images, and short descriptions.
- The current local database was corrected without raw SQL or broad deletion: 10 active QA products and 24 M5A products were deactivated; 24 technical/QA categories, 23 superseded authors, and 9 superseded publishers were deactivated.
- Runtime verification passed for home, catalog, category, product detail, sitemap, owned image, JSON-LD, and chatbot result URLs/images. M7.4C-D1 does not change the chatbot contract, Typebot flow/widget, schema/migrations, Commerce Core, package set, deployment, commit, or push.

## M7.4C-D2 Public Catalog Content, Gallery and Filter UX

- D2 deactivates four residual M3/M6 technical authors and four technical publishers through bounded slug prefixes; public taxonomy now requires a linked ACTIVE, non-deleted product with an active variant.
- The 24 canonical books each own four ordered PNG assets under `/product-images/<slug>/` with one primary cover, a back cover, two neutral preview pages, stable public IDs, and unique Vietnamese alt text.
- All public descriptions are distinct three-paragraph synthetic copy measuring 547–632 characters; product detail safely renders them under `Mô tả sản phẩm` with readable spacing.
- Product detail gallery adds stable primary selection, deduplication, thumbnails, previous/next controls, arrow-key navigation, focus treatment, and simple one-image/missing-image behavior.
- Desktop catalog filters now use a viewport-bounded sticky panel with an independently scrolling field region and persistent actions. Mobile drawer behavior is unchanged.
- D2 adds generator tooling, seed/validation/integration/gallery tests, document 89, and runtime/quality-gate evidence. It does not add a package, schema/migration, Commerce Core change, chatbot/Typebot contract change, deployment, commit, or push.

## M7.4C-W1 Typebot Widget Runtime Correction

- Manual certification found that Typebot created a session but the visible bubble surface had zero width. The cause was CSS-only removal of the built-in button combined with `chatWindow.maxWidth: 100%`, which resolved against the collapsed fixed bubble container.
- W1 uses the supported bubble configuration `theme.button.isHidden = true`, bounded `400px`/`704px` chat dimensions, and supported `Typebot.toggle({ id })` with `onOpen`/`onClose` callbacks.
- The widget now has explicit `disabled`, `loading-script`, `initialized`, `open`, and `failed` states. Loading and failure are safely inert; initialization, script, and bubble host remain singletons across Strict Mode and public App Router navigation.
- Launcher literals are valid UTF-8: visible `Trợ lý RoSach`, closed aria-label `Mở Trợ lý RoSach`, and open aria-label `Đóng Trợ lý RoSach`.
- Chromium runtime verification covered 1440x900, 390x844, open/close/reopen, `/`, `/san-pham`, `/sach/du-lieu-ke-chuyen`, `/gio-hang`, and Admin exclusion. Typebot renders one `typebot-bubble` shadow host with native `part="bot"`; no iframe is created by this embed.
- W1 closure gates passed: 25 focused tests, 383 full-suite tests, 48 SEO regression tests, format, lint, strict type-check, production build, and `git diff --check`.
- W1 changes no package, schema, migration, Commerce Core, chatbot API contract, Typebot workspace/flow, global CORS, deployment, commit, or push. Document 90 is the authoritative corrective report.

## M7.4C-W2 Ngrok Trust Proxy and Catalog Runtime

- The observed ngrok chain is one hop: external client -> ngrok -> Express on `127.0.0.1:4000`. The proxy-first chatbot request returned HTTP 200 but logged `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` once under Express's default trust setting.
- `TRUST_PROXY_HOPS` is now bounded to `0|1`, defaults to zero, and is set to one only for the verified local ngrok topology. `app.set('trust proxy', ...)` is applied before middleware; `true` and arbitrary expressions are prohibited.
- Automated tests prove independent one-hop clients, zero-hop spoof resistance, the existing 30/minute stable chatbot limit, no proxy validation log, and no impact on public catalog routes.
- The catalog 404 symptom was a stale Next development route graph: catalog APIs remained HTTP 200, and a clean Next restart restored `/san-pham`, `/danh-muc`, and known product routes. Existing source already maps only genuine API 404 to `notFound()`; upstream failures throw.
- Only the product-detail main image is eager/high-priority. Gallery thumbnails and catalog cards remain lazy/default priority.
- Manual Typebot search through ngrok succeeded. The Typebot workspace's `Xem sản phẩm` branch did not navigate despite returning a valid canonical product URL; this is an out-of-scope flow gap and keeps final chatbot certification open.
- W2 changes no package, schema/migration, Commerce Core, chatbot API contract, Typebot workspace/flow, global CORS, deployment, commit, or push. Document 91 is authoritative.

## M7.4C-W3A Dynamic Catalog Route Recovery

- Before a clean restart, public list pages returned 200 while known product/category dynamic routes returned 404; their exact detail APIs remained 200 with list/detail identity consistency.
- Stopping only RoSach watchers and restarting cleanly restored all 24 approved product routes and all 8 category routes without deleting `.next`, reseeding, or changing database records.
- The observed incident was stale Next development watcher state. Separately, the catalog client had a latent malformed-200 false-404 path; W3A now validates minimal success envelopes so malformed data throws to the error boundary and only actual HTTP 404 returns `null`.
- Browser verification clicked five products, all eight categories, back/forward, reload, direct paste, desktop and 390x844 mobile. Out-of-stock product detail remains 200; unknown slugs remain 404; no browser console error was found.
- No package, schema/migration, Commerce Core, chatbot contract, Typebot flow, dashboard, deployment, commit, push, or database record changed. Document 93 is authoritative.

## M7.4C-W3 Typebot Navigation and Admin Access

- W3 ran after the blocking W3A route-recovery gate passed. The Typebot Redirect URL was cleared and `product_1_url` was inserted through the real variable picker; supported new-tab navigation was published.
- Chrome standalone certification opened `luoc-su-nhung-phat-minh`, then after `Tìm lại` opened `chuyen-cua-nhung-vi-sao`; the embedded widget opened `khoi-nghiep-tu-dieu-nho`. The chat state stayed available and no stale result URL was reused.
- Backend login continues to accept email or username. The local Admin UI now uses email. Local privileged seed requires distinct valid `M3_DEMO_ADMIN_EMAIL` and `M3_DEMO_STAFF_EMAIL`, environment-only passwords, and updates a matched identity in place while refusing split identities.
- The privileged seed ran twice without duplicates. The database contains exactly one ACTIVE ADMIN and one ACTIVE STAFF for the configured emails. Admin/Staff email login passed, Staff mutation remained forbidden, and wrong/locked credentials remained rejected.
- No dashboard, Commerce Core, schema/migration, package, global CORS, chatbot API contract, deployment, commit, or push change was made. Document 92 is authoritative.

## M7.4E Admin Operations and Revenue Center

- M7.4E adds the unified `/admin/dashboard`, `/admin/revenue`, `/admin/product-statistics`, `/admin/orders`, `/admin/catalog`, and `/admin/inventory` information architecture with responsive Admin/Staff shell and logout.
- Current executable revenue recognizes only `COMPLETED`, uses immutable `Order.grandTotal`, and uses OrderItem snapshots for product/category history. `PENDING_CONFIRMATION`, `CONFIRMED`, `PACKING`, `SHIPPING`, and `CANCELLED` are excluded.
- Reporting dates use strict inclusive Vietnam calendar days, maximum 366 days, with equal-duration comparison and zero-filled daily series. The current schema has no Return/Refund model, so refund adjustment is documented as unsupported rather than fabricated.
- Three authenticated read-only reporting endpoints serve Admin and Staff without customer PII. Staff receives no reporting mutation, cost or margin field.
- Catalog gains real pagination metadata and professional role-sensitive presentation; Orders use canonical `/admin/orders` routes and deterministic loading/empty/error/retry states. Existing domain mutations and Commerce Core remain unchanged.
- Four idempotent M7E completed demo orders add two fixed comparison periods without overwriting the four existing M6 orders. No package, schema, migration, deployment, commit or push is part of M7.4E. Document 94 is authoritative.

## M7.5A Full System Audit, Admin Catalog and Access Guard

- M7.5A corrected the lower `/admin/catalog` classification UI with semantic taxonomy tables, category/author/publisher tabs, active/inactive/all filtering, wrapped descriptions, labelled controls, usable category sort order, explicit loading/empty/error/retry states, and Staff read-only behavior. Existing catalog APIs and mutation contracts remain unchanged.
- M7.5A corrected the client Admin access boundary: only anonymous `/admin/login` is allowed; anonymous operational routes and CUSTOMER access are denied without protected shell/content; ADMIN and STAFF can enter the operational shell according to role; privileged users visiting `/admin/login` are redirected to `/admin/dashboard`. API bearer/RBAC enforcement remains authoritative.
- Browser evidence covered Admin catalog desktop behavior and Staff read-only behavior. `seed:validate` passed with `blocking: false` and zero blocker counts; no database records were changed by M7.5A.
- Quality gates passed after a targeted test-helper lint correction: format, lint, type-check, full tests (426 tests across workspaces), SEO regression (48 tests), seed validation, production build, and final `git diff --check`.
- M7.5A-V1 completed the previously missing manual evidence: deterministic CUSTOMER Admin-route denial and Back/Forward protection, direct customer Admin API HTTP 403, and Chrome `390x844` Admin/Staff catalog verification. Mobile taxonomy horizontal scrolling is contained and effective page `scrollX` remains zero.
- M7.5A adds `/admin` and unknown-Admin-route containment so anonymous/CUSTOMER access reaches the approved safe root denial path while privileged unknown routes retain an Admin not-found surface. Focused tests increased to 17 and the full suite remains green.
- `M75-PERF-001` is now formally registered: LOW/P3, `/san-pham`, `/product-images/du-lieu-ke-chuyen/cover.png`, reproducible Next development LCP advisory, no measured user-facing regression, deferred to M7.3B production-mode measurement. No image patch was made.
- M7.5A remains bounded corrective work only. No package installation, schema/migration, Commerce Core, Typebot contract/flow, deployment, commit, or push was performed. Document 97 is authoritative for final closure evidence.

## M7.5C UX, Responsive, Accessibility and Runtime Polish

- M7.5C reconstructed the current post-M7.5A baseline and performed bounded public, Customer, chatbot, Admin, responsive, accessibility, state, console/network, and image-policy checks.
- Two LOW responsive defects were directly reproduced and fixed. `M75-UX-001` paint-contains the intentional `/admin/catalog` taxonomy scroller; root width at `360x800` changed from `scrollWidth=775` to `345` while the inner table retained `scrollWidth=960`.
- `M75-UX-002` restores Customer order-detail reflow for long immutable order numbers; root width changed from `scrollWidth=365` to `345` through bounded grid shrink/wrap rules.
- Focused regression tests assert both CSS contracts and preserve existing taxonomy and Customer-order behavior suites. No Commerce, RBAC, Typebot, schema, migration, API, package, historical data, deployment, commit, or push change belongs to M7.5C.
- Final serial gates passed: format, lint, type-check, focused tests (7), full tests (429), SEO regression (48), seed validation (`blocking: false`), and production build (47.8 seconds). The first full-test attempt exceeded its command window; the longer serial rerun passed without source correction.
- `M75-PERF-001` remains LOW/P3 accepted debt. Production build passed, but production image measurement was invalid because the current local API-base environment omitted `/api/v1`; `/san-pham` rendered its bounded error state and no catalog image loaded. The advisory was neither confirmed nor disproved, and no priority patch was made.
- Document 98 is authoritative for M7.5C scope, route evidence, gates, remaining debt, and closure recommendation.

## M7.5D Repository Cleanup and Full E2E Certification

- `NEXT_PUBLIC_API_URL` is now one centralized full-base contract ending in `/api/v1` exactly once. Local production-like Web/API use the same `127.0.0.1` site, so Customer refresh cookies survive hard navigation.
- `M75-CONFIG-001` is CLOSED: optimized `/san-pham` renders all 24 real products and representative public/auth/cart/Admin contracts use the correct base.
- One real Customer checkout created order `RS2026072219061333CTDX` with quantity 2, total 420,000 and inventory movement 13 to 11 with one matching ledger entry.
- `M75-SEED-001` was found when a post-checkout seed rerun overwrote on-hand stock but retained the runtime ledger. Demo seed now reconciles deterministic baseline stock with non-seed movement deltas; seed x2 and validation pass without rewriting checkout history.
- Final serial gates pass: format, lint, type-check, focused config/seed tests, full tests (432), SEO regression (91), seed x2, validation, full build and diff check. No package, schema/migration, deployment, commit or push occurred. Document 100 is authoritative.

## M7.5D-V1 Fresh Browser Certification

- Fresh production-like Chromium evidence closes API/catalog runtime, all six Admin routes, all six Staff read-only routes plus direct mutation HTTP 403, certified-order owner/other/anonymous isolation, and the selected `390x844` mobile surfaces.
- Embedded Typebot lifecycle and singleton behavior pass, but the published Typebot flow returns its no-result branch without product cards/links during the fresh pass. The local chatbot API separately returns real product/image/canonical-URL data for supported intent, isolating the open gate to Typebot/tunnel integration.
- `M75-CHATBOT-001` is an open HIGH certification gate. No Typebot workspace/flow correction was attempted because the V1 decision requires Technical Lead approval. M7.5D remains REQUEST CHANGES until the complete standalone and embedded search/navigation matrix is rerun successfully.
- One isolated second QA Customer was created only for ownership isolation. The certified order and historical totals were not modified. No source, schema/migration, package, Commerce Core, deployment, commit, or push change belongs to V1.

## M7.5D-V2 Typebot Runtime Contract Correction

- Three-layer reproduction isolates `M75-CHATBOT-001` to the published Typebot configuration: local API and the current HTTPS ngrok tunnel return matching HTTP 200 results, while the published flow does not reach the current tunnel and follows its stale no-result behavior.
- The required Typebot response paths are based on the actual wrapped response: `data.data.resultCount`, intent/message, and camelCase `product1*`, `product2*`, `product3*` slots. The chatbot API contract was not changed.
- Authenticated Typebot workspace access was unavailable, so no save/publish claim was made. Exact Product Owner UI correction steps are recorded in document 100. M7.5D remains REQUEST CHANGES until a fresh standalone and embedded product/navigation matrix passes.
- The V1 temporary browser/audit scripts and two derivative scripts were removed. No application source, database record, Commerce Core, schema/migration, package, deployment, commit, or push changed in V2.

## M7.5D Final Published Runtime Rerun

- Fresh published Typebot evidence now confirms the current public ID/version and current ngrok endpoint. Price and category searches returned product text; A=`/sach/luoc-su-nhung-phat-minh`, B=`/sach/chuyen-cua-nhung-vi-sao`, with distinct URLs and successful retry transitions.
- Embedded `390x844` lifecycle, singleton host/launcher, retry and canonical navigation passed with clean Console and no document overflow.
- Published-flow certification remains open because product cards render no image element despite valid image response fields, and no-result has no `Tìm lại` control. A fresh authenticated Admin exclusion check was not completed after the local runtime/SQL process stopped; no unsupported PASS claim is recorded.
- No source/backend/catalog/Admin/Staff/Commerce Core change was made. M7.5D remains REQUEST CHANGES pending a bounded published-flow-only correction and final rerun.

## M7.5D-V3 Image, Retry and Admin Exclusion

- Local and tunnel chatbot responses expose product images as Class B absolute local URLs (`http://127.0.0.1:3000/product-images/...`). These are not public HTTPS assets for Typebot Cloud. Because embedded runtime also created no image element, the Typebot Image/card binding remains unverified and cannot yet be accepted as deployment-only debt.
- Published no-result text passes, but it emits neither `Tìm lại` nor a new input. `M75-CHATBOT-001A` (image presentation) and `001B` (no-result retry) remain open and require authenticated Typebot workspace correction; no backend/API change is needed.
- Fresh authenticated Admin evidence closes the exclusion gate across all six Operations Center routes: zero launcher, host and Typebot script, normal Admin content, clean Console/network.
- No Typebot edit, save/publish, source, database, schema/migration, package, Commerce Core, commit, push or deployment occurred. M7.5D remains REQUEST CHANGES and M7.6 remains blocked only by 001A/001B.

## M7.5D Final Scope Decision and One-cover Readiness

- This section is the authoritative disposition and supersedes only the earlier V1-V3 closure recommendations; their evidence remains preserved above.
- Product Owner accepts the current chatbot search/navigation behavior. Chatbot image rendering, Typebot image binding/certification, and the no-result `Tìm lại` improvement are out of project scope. `M75-CHATBOT-001A` and `M75-CHATBOT-001B` are **ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION**. No source/API/Typebot correction is required.
- Canonical database and seed audit found 24 active public products and exactly 24 primary `ProductImage` records, one per product, all `sortOrder=0`. Every stored URL is `/product-images/<slug>/cover.png`; none stores localhost, `127.0.0.1`, ngrok, Vercel, or another external origin.
- All 24 files exist under `apps/web/public/product-images/<slug>/cover.png`, are readable non-zero PNG files at 600x900, portrait, approximately 234-281 KB, case/path aligned, and unique by SHA-256. Every alt is meaningful Vietnamese text containing its product title. Missing/repaired/generated/licensed-download counts are all zero; existing valid covers are retained.
- Fresh production-like Chromium at 390x844 returned HTTP 200 and zero broken images on homepage, `/san-pham`, all eight category routes, and all 24 product-detail routes. Console and image-network failures were empty and every checked route had `scrollWidth == clientWidth == 390`. Commerce routes retained the approved snapshot/fallback behavior.
- Focused gates passed: API 13/13 (`demo-data-hygiene`, seed integration, catalog smoke) and Web 21/21 (catalog page, product detail page/experience, product card). The 24-cover contact sheet was manually reviewed with no visible watermark, accidental duplicate, broken image, or stretching.
- Final status: **M7.5D APPROVED / CLOSED; M7.6 READY**. No database record, source, seed, schema/migration, package, Commerce Core, Typebot, deployment, commit, or push changed in this closure pass.

## M7.6 Full Regression and Release Readiness

- Product Owner scope override keeps chatbot accepted and limits regression to Web stability, search/navigation smoke, Admin absence, and unexpected 429/500 detection. No Typebot or chatbot contract change is authorized.
- Final local gates passed: format, lint, type-check, full tests 432/432, SEO regression 91/91, seed twice, seed validation with `blocking=false`, API/Web/Shared production builds, and `git diff --check`.
- Fresh production-like browser evidence passed: homepage catalog images had zero broken requests at 390x844; widget had one launcher/host/script, supported search returned canonical product links, Console errors were zero, and unexpected 429/500 responses were zero.
- Fresh authenticated Admin matrix passed on dashboard, revenue, product statistics, orders, catalog and inventory: Admin shell present; launcher, `typebot-bubble` host and Typebot script absent on every route; no Console or 429/500 failure.
- Local release readiness is PASS. Push and Vercel/public acceptance remain external prerequisites because no Git remote, Vercel project link/CLI/authentication, or public API/database is configured in this workspace. No deployment claim is made until those prerequisites are supplied.
