# M7.2B Technical SEO Implementation Plan

Status: IMPLEMENTATION COMPLETE - READY FOR TECHNICAL LEAD REVIEW

Milestone: M7.2B - Technical SEO Implementation

## Goals

- Complete local-safe site identity signals for browser metadata and install/share surfaces.
- Activate approved structured-data capabilities already present in the SEO Descriptor Platform.
- Improve default social preview fallback with an owned local asset.
- Preserve canonical, robots, sitemap, local-only, and production-origin safety policies.
- Add regression coverage for the implemented SEO behavior.

## Scope

M7.2B changes are limited to the web SEO presentation layer, public metadata assets, regression tests, and documentation.

In scope:

- Root metadata integration through the existing descriptor/platform boundary.
- Application name, viewport, theme color, manifest, and icons.
- Organization/WebSite graph activation exactly once.
- BreadcrumbList activation on product and category detail routes.
- CollectionPage/ItemList activation only for stable visible catalog/category data.
- Owned local default social preview asset.
- Documentation of sitemap `lastModified` decision.
- Regression tests and quality gates.

## Non-Goals

- No Commerce Core changes.
- No backend/API contract changes.
- No database, migration, or seed changes.
- No UI redesign, CSS polish, layout change, or navigation change.
- No public deployment, public domain certification, analytics, Search Console, marketing pixels, or cookie banner.
- No AI Receptionist, chatbot, SearchAction, FAQ schema, Review schema, or AggregateRating schema.
- No author, publisher, policy, or contact pages created only for SEO.
- No package installation.
- No commit or push.

## Baseline Status

Repository state before M7.2B implementation was dirty from approved previous milestones. Existing modified and untracked M6/M7 files were preserved and not reverted.

Baseline gates:

| Gate | Command | Result |
|---|---|---|
| Format | `npm run format:check` | PASS |
| Lint | `npm run lint` | PASS |
| Type-check | `npm run type-check` | PASS |
| SEO regression subset | `npm run test -w @rosach/web -- tests/seo app/seo-policy.test.ts app/sitemap.test.ts lib/seo` | PASS, 12 files / 85 tests |
| Build | `npm run build` | PASS |

## Affected-File Plan

| Area | Files |
|---|---|
| Root site identity | `apps/web/app/layout.tsx`, `apps/web/app/manifest.ts` |
| Public assets | `apps/web/public/*` |
| SEO config/adapter | `apps/web/lib/seo/core/config.ts`, `apps/web/lib/seo/adapters/next-metadata-adapter.ts`, related descriptor types if needed |
| Route structured data | `apps/web/app/page.tsx`, `apps/web/app/san-pham/page.tsx`, `apps/web/app/danh-muc/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx`, `apps/web/app/sach/[slug]/page.tsx` |
| Tests | `apps/web/tests/seo/*`, `apps/web/app/*.test.ts`, route tests where appropriate |
| Documentation | `docs/00-document-map.md`, `docs/56` through `docs/65` as needed |

## Risk Matrix

| Risk | Severity | Mitigation |
|---|---|---|
| Duplicate metadata ownership | High | Keep descriptor pipeline as the source for canonical, OG, Twitter, robots, and structured data. |
| Fake production origin leakage | High | Keep runtime origin resolution in SEO config; do not hard-code `rosach.vn`. |
| Duplicate site graph | Medium | Render Organization/WebSite only on the public homepage descriptor. |
| Private route public graph leakage | Medium | Do not render site graph in root layout JSON-LD. |
| Incorrect sitemap freshness | Medium | Defer `lastModified` unless reliable public timestamps already exist. |
| Asset path 404 | Medium | Add local public assets and regression coverage for manifest/icon paths. |

## Rollback Reasoning

All M7.2B code changes are isolated to frontend SEO metadata, route descriptors, local public assets, and tests. If a regression appears, the SEO changes can be reverted independently without altering Commerce Core, API contracts, Prisma schema, or business data.

## Phase Order

1. Phase 0 - Baseline and implementation plan.
2. Phase 1 - Site Identity.
3. Phase 2 - Organization/WebSite graph.
4. Phase 3 - BreadcrumbList.
5. Phase 4 - CollectionPage/ItemList.
6. Phase 5 - Social preview fallback.
7. Phase 6 - Sitemap freshness decision.
8. Phase 7 - Regression coverage.
9. Phase 7A - On-page compliance.
10. Phase 8 - Documentation.
11. Phase 9 - Final quality gates.

## Acceptance Criteria

- Site identity fields are present and local-safe.
- Manifest references local assets only.
- Favicon, app icons, apple-touch-icon, and default social preview asset exist locally.
- Canonical, OG, Twitter, robots, and sitemap policies remain unchanged except for approved asset improvements.
- Organization/WebSite graph appears exactly once on the public homepage.
- BreadcrumbList appears on product and category detail pages.
- CollectionPage/ItemList appears only on stable catalog/category pages.
- Sitemap `lastModified` is implemented only with reliable timestamps, otherwise explicitly deferred.
- Regression tests cover new behavior.
- Format, lint, type-check, tests, build, and `git diff --check` pass.

## Deferred Items

- SearchAction.
- FAQ schema.
- AggregateRating and Review schema.
- Author and publisher detail pages.
- Nested private route-specific titles.
- Sitemap diagnostics certification command.
- Sitemap `lastModified` if reliable public timestamps are not available from current data.

## Phase Evidence

| Phase | Result | Evidence |
|---|---|---|
| Phase 0 - Baseline | PASS | Dirty worktree recorded; baseline format, lint, type-check, SEO subset, and build passed before implementation. |
| Phase 1 - Site Identity | PASS | `apps/web/app/layout.tsx`, `apps/web/app/manifest.ts`, and local public icon/social assets added. `tests/seo/site-identity.test.ts` covers applicationName, metadataBase, manifest, icons, viewport, theme color, title suffix, and localhost leak prevention. |
| Phase 2 - Organization/WebSite Graph | PASS | Homepage descriptor renders Organization/WebSite JSON-LD through `StructuredDataRenderer`; homepage regression asserts one Organization and one WebSite node. |
| Phase 3 - BreadcrumbList | PASS | Product and category detail pages pass BreadcrumbList descriptors through the SEO Platform; route tests assert terminal canonical URLs. |
| Phase 4 - CollectionPage/ItemList | PASS | Base catalog, category list, and category detail use visible route data for CollectionPage/ItemList. Query/filter states remain noindex and do not receive collection graph. |
| Phase 5 - Social Preview Fallback | PASS | `DEFAULT_SEO_CONFIG.defaultOpenGraphImagePath` now uses owned local raster `/social-preview.png`; regression asserts production metadata uses the owned fallback. |
| Phase 6 - Sitemap Freshness Decision | DEFERRED | Current web catalog DTOs expose no reliable public timestamp. No `lastModified` implementation was added, and no API contract/database change was made solely for freshness. |
| Phase 7 - Regression Coverage | PASS | Added `tests/seo/site-identity.test.ts`; updated route tests for homepage, catalog, product, and category structured data. |
| Phase 7A - On-page Compliance | PASS | Added `tests/seo/on-page-compliance.test.ts`; documented route keyword intent, metadata guidelines, H1, image alt, breadcrumb UI/schema, CTA, related products, redirects, and external/deployment criteria in `docs/72`. |
| Phase 8 - Documentation | PASS | Updated docs map and SEO docs with M7.2B implementation closure. |
| Phase 9 - Quality Gates | PASS | Final format, lint, type-check, full test suite, build rerun, and `git diff --check` passed. |

## Implementation Summary

| Area | Change | Files |
|---|---|---|
| Site identity metadata | Added root `applicationName`, `metadataBase`, manifest link, icons, viewport, and theme color while preserving descriptor-owned canonical/OG/Twitter metadata. | `apps/web/app/layout.tsx` |
| Manifest | Added local-safe manifest with local icon paths and no offline/service-worker claims. | `apps/web/app/manifest.ts` |
| Brand assets | Added owned local SVG source assets plus raster manifest/apple/social assets. | `apps/web/public/favicon.svg`, `icon-192.svg`, `icon-512.svg`, `apple-touch-icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `social-preview.svg`, `social-preview.png` |
| Social fallback | Replaced placeholder cover fallback with owned social preview asset. | `apps/web/lib/seo/core/config.ts` |
| Site graph | Activated Organization/WebSite once on homepage only. | `apps/web/app/page.tsx` |
| Breadcrumb graph | Activated BreadcrumbList on product and category detail pages. | `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` |
| Collection graph | Activated CollectionPage/ItemList for stable catalog/category data only. | `apps/web/app/san-pham/page.tsx`, `apps/web/app/danh-muc/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` |
| Tests | Added and updated SEO regressions. | `apps/web/tests/seo/site-identity.test.ts`, `apps/web/app/homepage.test.tsx`, `apps/web/app/san-pham/page.test.tsx`, `apps/web/app/sach/[slug]/page.test.tsx`, `apps/web/app/danh-muc/[slug]/page.test.tsx` |

## Sitemap Freshness Decision

`lastModified` remains DEFERRED for M7.2B.

Reason:

- `apps/web/services/catalog-client.ts` product and category DTOs do not expose a reliable public `updatedAt` or equivalent timestamp.
- Sitemap providers should not use `new Date()` per request.
- Sitemap providers should not invent static timestamps.
- M7.2B does not change backend API contracts or database schema solely for SEO freshness.

## Quality Gate Log

| Gate | Command | Result |
|---|---|---|
| Phase 1 regression | `npm run test -w @rosach/web -- tests/seo/site-identity.test.ts tests/seo/metadata-regression.test.ts tests/seo/environment-regression.test.ts` | PASS, 3 files / 13 tests |
| Structured-data route regression | `npm run test -w @rosach/web -- tests/seo/site-identity.test.ts tests/seo/structured-data-regression.test.ts lib/seo/structured-data/structured-data.test.tsx app/homepage.test.tsx app/sach/[slug]/page.test.tsx app/danh-muc/[slug]/page.test.tsx app/san-pham/page.test.tsx app/khuyen-mai/page.test.tsx` | PASS, 8 files / 40 tests |
| Teacher checklist SEO regression | `npm run test -w @rosach/web -- tests/seo/on-page-compliance.test.ts tests/seo/site-identity.test.ts tests/seo/route-policy.test.ts tests/seo/sitemap-regression.test.ts tests/seo/structured-data-regression.test.ts tests/seo/metadata-regression.test.ts tests/seo/cross-asset.test.ts` | PASS, 7 files / 28 tests |
| Format | `npm run format:check` | PASS |
| Lint | `npm run lint` | PASS |
| Type-check | `npm run type-check` | PASS |
| Full tests | `npm run test` | PASS: API 21 files / 104 tests; Web 38 files / 187 tests; Shared 1 file / 1 test. Total 60 files / 292 tests. |
| Build | `npm run build` | PASS on rerun. Note: one parallel run failed with Windows Prisma `EPERM` generated-client rename while tests were running; serial rerun passed. |
| Diff whitespace | `git diff --check` | PASS with existing LF-to-CRLF warnings only; no whitespace errors. |

## Remaining Deferred SEO Debt

| Item | Status | Reason |
|---|---|---|
| Sitemap `lastModified` | DEFERRED | No reliable public timestamp in current DTO/API contract. |
| SearchAction | DEFERRED | No approved behavior for schema-level search action in M7.2B. |
| FAQ schema | DEFERRED | FAQ content is not active; no fabricated content. |
| AggregateRating/Review | DEFERRED | Review/rating data is not active; no fabricated claims. |
| Author/publisher pages | DEFERRED | Route scope remains deferred from M7.2A. |
| Nested private route titles | DEFERRED | Noindex private route UX polish only; not an SEO blocker. |
