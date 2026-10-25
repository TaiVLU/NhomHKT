# Development Roadmap

## M0 — Phân tích và thiết kế

Sitemap, role matrix, use case, business rule, ERD, database dictionary, API draft.

## M1 — Khởi tạo

Monorepo, Next.js, Express, TypeScript, lint, test, DB health.

## M2 — Auth

Register, login, refresh, logout, OTP, RBAC, admin login, 403.

## M3 — Catalog

Category, author, publisher, product, variant, image, slug reservation, public catalog/search/SEO và Admin/Staff catalog API/UI. Staff read-only; Admin manage. Không gồm Inventory, RelatedProduct, HotKeyword hoặc feature commerce.

## M4 — Customer

Deadline scope: Profile, change password, Address CRUD/default và Customer Account UI. Wishlist, local/database cart, cart merge, Avatar và Admin Customer UI được hoãn; không thuộc implementation M4 này.

## M5 — Commerce

Status: CLOSED on 2026-07-20.

Final Quality Gate: PASS.

Architecture Review: APPROVED.

Completed scope:

- Customer catalog, product detail, category browsing, variant selection, product gallery, and cart integration.
- Checkout, customer orders, admin order management, order processing workflow, and inventory adjustment.
- Admin product creation, product editor, variant management, image management, taxonomy management, permission-aware UI, and inventory ledger visibility.
- Inventory adjustment types: `RECEIVE_STOCK`, `MANUAL_INCREASE`, `MANUAL_DECREASE`, `CORRECTION`.
- RBAC, `PRODUCT_READ`, `PRODUCT_MANAGE`, Public/Admin DTO separation, validation, stable error envelopes, sensitive-field protection, real-browser QA, responsive verification, Vietnamese typography correction, automated tests, build validation, and QA data cleanup.

Non-blocking follow-up moved to M6/backlog:

- Dedicated repository Playwright E2E configuration and CI suite.
- Remaining Vietnamese/English terminology polish.
- Safari/iOS typography and responsive verification after deployment.
- Windows LF/CRLF warning cleanup policy.
- Closed beta UX and visual defect collection.

## M6 — SEO & Production Readiness

Status: M6.1 STARTED.

M6.0C - Business Foundation Certification:

- Status: CLOSED / APPROVED on 2026-07-20.
- Repository Health, Business Foundation, Database Integrity, Historical Integrity, API Contract, Operational Readiness, and Quality Gates passed.
- BLOCKER: 0. HIGH: 0.
- M6.2 is READY FOR TECHNICAL LEAD SPECIFICATION.
- M6.2 implementation has not started.

M6.2 - Commerce Core Remediation:

- Status: CERTIFICATION CANDIDATE.
- EWP-01 critical finding remediated: checkout consumption and order cancellation restoration now create `InventoryLedger` rows through the Inventory Movement boundary.
- Cart remains non-reserving; no reservation lifecycle was introduced.
- Catalog Read Model, Order Snapshot, Product.primaryCategoryId authority, and AppError contract remain unchanged.

M6.0 - SEO Architecture & Production Readiness Design:

- Official architecture specification created in `docs/30-seo-architecture-specification.md`.
- Documentation-only phase.
- No application code, API, database schema, migration, dependency, lockfile, seed data, or deployment changes.
- Status: CLOSED.

M6.1A - SEO Core Platform:

- Framework-agnostic SEO Descriptor pipeline foundation implemented under `apps/web/lib/seo`.
- Central typed SEO configuration, URL normalization, descriptor validation, normalization, enrichment, asset factory, consistency validation, and thin Next.js metadata adapter are present.
- Unit tests cover deterministic config, URL behavior, critical validation, safe fallbacks, non-indexable/unpublished safeguards, asset consistency, sitemap eligibility, and adapter output.
- M6.1A-R1 remediated Technical Lead evidence-audit gaps: production SEO config now fails when production origin is missing or localhost, issue severity uses `BLOCKER`, `MAJOR`, `MINOR`, `INFO`, public exports are narrowed, and missing SEO core acceptance tests were added.
- M6.1A-R2 remediated final severity and diagnostics gaps: `BLOCKER` now uniquely prevents asset output, `MAJOR` can return downgraded assets while failing the SEO quality gate, unpublished/indexable is `MAJOR`, deterministic description/image fallbacks emit retained `INFO` issues, and production asset consistency blocks localhost URL leakage.
- Page-level SEO activation, robots changes, sitemap changes, JSON-LD expansion, seed data, schema changes, and UI changes are not part of M6.1A.

M6.1B - Metadata Framework:

- Home, catalog, category list/detail, book detail, promotion, cart, and 404 metadata now flow through the SEO Descriptor pipeline and the Next.js metadata adapter.
- Metadata output covers title, description, canonical URL, Open Graph, Twitter, and robots directives from one normalized descriptor per route.
- Focused metadata tests cover home, catalog, category fallback description, book metadata, canonical generation, title templating, fallback image behavior, and adapter output consistency.
- Existing `robots.ts`, `sitemap.ts`, and product JSON-LD were preserved; M6.1B did not implement robots, sitemap, structured data, seed data, schema changes, dependency changes, or UI redesign.

M6.1C - Canonical & Robots Policy:

- SEO Descriptor now supports explicit `follow` and `noarchive` robots policy in addition to indexability.
- Catalog query metadata canonicalizes meaningful query states to `/san-pham` with `noindex,follow`; the clean catalog route remains `index,follow`.
- Private, transactional, auth, account, missing-entity, and 404 routes are `noindex,nofollow`; Admin routes are `noindex,nofollow,noarchive`.
- `robots.ts` allows public crawling, disallows private/admin/transactional/auth paths, exposes the existing sitemap URL, and does not block catalog query URLs as duplicate-content control.
- Existing sitemap generation and product JSON-LD were preserved; M6.1C did not implement sitemap redesign, structured data, redirects, schema changes, backend changes, dependency changes, commit, or push.

M6.1D - Sitemap Framework:

- Sitemap generation now flows through `apps/web/lib/seo/sitemap` with typed providers, builder orchestration, normalization, deduplication, sorting, validation, and a small Next.js `app/sitemap.ts` route.
- Providers are separated by responsibility: static public routes, promotion route, categories, and books.
- Sitemap validation detects relative URLs, malformed URLs, localhost URLs when not allowed, duplicate URLs, invalid priority, invalid changeFrequency, and missing `lastModified` diagnostics.
- Public sitemap entries remain consistent with M6.1C robots/indexing policy; private, auth, account, cart, checkout, and Admin routes are excluded.
- Existing metadata, robots policy, product JSON-LD, backend APIs, Prisma schema, migrations, dependencies, lockfiles, seed data, deployment, commit, and push remain unchanged by M6.1D.

M6.1D-R1 - Technical Review Remediation:

- Duplicate policy is now normalize, validate, deduplicate, then sort, so duplicate diagnostics are reachable through `buildSitemap()`.
- Root SEO exports were narrowed to expose only `buildSitemap` for sitemap generation; sitemap internals remain inside the sitemap module for tests and local composition.
- Sitemap configuration now reuses `seoConfigFromEnvironment`; provider failures are surfaced as `MAJOR` diagnostics while preserving generation from remaining providers.
- Validation severities were aligned: malformed/local URLs are blockers, duplicate URLs are major, invalid priority/changeFrequency/lastModified are minor, and missing `lastModified` is info.
- Additional tests cover empty provider output, provider failure diagnostics, duplicate policy behavior, builder validation diagnostics, invalid `lastModified`, and protocol edge cases.

Planned areas only:

- Technical SEO.
- SEO requirements derived from the nine supplied course chapters.
- Book seed dataset of approximately 30-50 books.
- SEO titles and meta descriptions.
- Slugs and image alt text.
- Structured data.
- Performance and SEO audit.
- Staging deployment.
- Closed beta testing.
- Bug triage and release patches.

## M7 — Content

Review Ro Sách, Ro-mance, banner, RoBot FAQ.

## M8 — Review và báo cáo

Verified review, moderation, revenue, cost, profit, export.

## M9 — Quality

Responsive, accessibility, security, performance, testing, docs.

## M10 — Deploy

Domain, frontend, backend, database, smoke test.
