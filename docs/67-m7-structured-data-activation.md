# M7.2B Structured Data Activation

Status: IMPLEMENTED WITH DEFERRED UNSUPPORTED SCHEMA

## Scope

M7.2B activates structured-data capabilities that already existed in the SEO Descriptor Platform. It does not add fabricated schema or business data.

## Activated Schema

| Schema | Status | Route | Evidence |
|---|---|---|---|
| Organization | PASS | `/` | `apps/web/app/page.tsx` passes `structuredData.site`; homepage test asserts node. |
| WebSite | PASS | `/` | Same homepage graph; no SearchAction. |
| Product | PASS | `/sach/[slug]` | Existing product detail Product node preserved. |
| Book | PASS | `/sach/[slug]` | Existing product detail Book node preserved. |
| Offer | PASS | `/sach/[slug]` | Existing product detail Offer node preserved. |
| BreadcrumbList | PASS | `/sach/[slug]`, `/danh-muc/[slug]` | Product/category route tests assert canonical terminal URLs. |
| CollectionPage | PASS | `/san-pham`, `/danh-muc`, `/danh-muc/[slug]` | Active only from stable visible route data. |
| ItemList | PASS | `/san-pham`, `/danh-muc`, `/danh-muc/[slug]` | Active only from stable visible route data. |

## Deferred Schema

| Schema | Final Status | Reason |
|---|---|---|
| SearchAction | DEFERRED | Search action behavior and policy are not approved for schema activation. |
| FAQ | DEFERRED | No active FAQ content; no fabricated content. |
| Review | DEFERRED | No real review data. |
| AggregateRating | DEFERRED | No real rating data. |
| LocalBusiness | REQUIRES REAL BUSINESS DATA | No approved public address, phone, or business profile. |

## Architecture Decision

The Organization/WebSite graph is rendered on the homepage, not in the root layout. This avoids duplicate graph output and avoids rendering public site graph on private noindex routes.

All new JSON-LD still flows through:

`SEODescriptor -> buildSEOAssets() -> StructuredDataRenderer`

No route manually serializes `application/ld+json`.

## Tests

- `apps/web/app/homepage.test.tsx`
- `apps/web/app/sach/[slug]/page.test.tsx`
- `apps/web/app/danh-muc/[slug]/page.test.tsx`
- `apps/web/app/san-pham/page.test.tsx`
- `apps/web/tests/seo/structured-data-regression.test.ts`
- `apps/web/tests/seo/on-page-compliance.test.ts`

Regression subset:

- `npm run test -w @rosach/web -- tests/seo/on-page-compliance.test.ts tests/seo/site-identity.test.ts tests/seo/route-policy.test.ts tests/seo/sitemap-regression.test.ts tests/seo/structured-data-regression.test.ts`: PASS, 5 files / 20 tests.

## Remaining Limitations

- Query/filter catalog states remain noindex and do not receive collection graph.
- Author/publisher detail entity pages remain deferred.
- Rich-results URL validation requires public deployment.
