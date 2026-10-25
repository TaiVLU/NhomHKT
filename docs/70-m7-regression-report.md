# M7.2B Regression Report

Status: PASS

## Added Or Updated Tests

| File | Coverage |
|---|---|
| `apps/web/tests/seo/site-identity.test.ts` | applicationName, metadataBase, manifest, icons, apple icon, viewport, theme color, title suffix, social fallback, localhost leak. |
| `apps/web/tests/seo/on-page-compliance.test.ts` | redirect inventory, local SEO asset availability, H1 checks, product canonical links, image alt source, breadcrumb UI/schema alignment, friendly 404. |
| `apps/web/app/homepage.test.tsx` | Organization/WebSite graph on homepage. |
| `apps/web/app/sach/[slug]/page.test.tsx` | BreadcrumbList with Product/Book/Offer. |
| `apps/web/app/danh-muc/[slug]/page.test.tsx` | BreadcrumbList and CollectionPage/ItemList on category detail. |
| `apps/web/app/san-pham/page.test.tsx` | CollectionPage/ItemList on base catalog and updated social fallback image. |
| `apps/web/lib/seo/core/seo-core.test.ts` | Updated fallback image expectation to owned social preview asset. |

## Required Coverage Mapping

| Area | Status | Evidence |
|---|---|---|
| Site identity | PASS | `site-identity.test.ts`. |
| Metadata | PASS | existing metadata route tests plus `metadata-regression.test.ts`. |
| Structured data | PASS | `structured-data-regression.test.ts` and route tests. |
| Social preview | PASS | `site-identity.test.ts`, `cross-asset.test.ts`, metadata tests. |
| Robots/sitemap | PASS | `route-policy.test.ts`, `sitemap-regression.test.ts`, `sitemap.test.ts`. |
| On-page checklist | PASS | `on-page-compliance.test.ts`. |

## Command Evidence

| Command | Result |
|---|---|
| `npm run test -w @rosach/web -- tests/seo/site-identity.test.ts tests/seo/metadata-regression.test.ts tests/seo/environment-regression.test.ts` | PASS, 3 files / 13 tests. |
| `npm run test -w @rosach/web -- tests/seo/on-page-compliance.test.ts tests/seo/site-identity.test.ts tests/seo/route-policy.test.ts tests/seo/sitemap-regression.test.ts tests/seo/structured-data-regression.test.ts` | PASS, 5 files / 20 tests. |
| `npm run test -w @rosach/web -- tests/seo/on-page-compliance.test.ts tests/seo/site-identity.test.ts tests/seo/route-policy.test.ts tests/seo/sitemap-regression.test.ts tests/seo/structured-data-regression.test.ts tests/seo/metadata-regression.test.ts tests/seo/cross-asset.test.ts` | PASS, 7 files / 28 tests. |
| `npm run test` | PASS: API 21 files / 104 tests; Web 38 files / 187 tests; Shared 1 file / 1 test. Total 60 files / 292 tests. |

## Known Command Note

One earlier parallel build/test run produced a Windows Prisma generated-client `EPERM` rename error while another command was active. A serial `npm run build` rerun passed. This is consistent with the existing Windows local note in project memory and is not an introduced SEO regression.
