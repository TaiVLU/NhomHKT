# M7.2A Structured Data Audit

Status: M7.2B IMPLEMENTATION CLOSURE UPDATED

## Scope

Reviewed JSON-LD generation, schema graph support, active route usage, serialization, and tests.

Primary files:

- `apps/web/lib/seo/structured-data/factory.ts`
- `apps/web/lib/seo/structured-data/knowledge-graph-assembler.ts`
- `apps/web/lib/seo/structured-data/serializer.ts`
- `apps/web/lib/seo/structured-data/validation.ts`
- `apps/web/lib/seo/adapters/structured-data-renderer.tsx`
- `apps/web/app/sach/[slug]/page.tsx`
- `apps/web/lib/seo/structured-data/structured-data.test.tsx`
- `apps/web/tests/seo/structured-data-regression.test.ts`

## Structured Data Capability Matrix

| Schema Type | Platform Support | Active Route Usage | Status | Severity | Priority | Evidence | Recommendation |
|---|---|---|---|---|---|---|---|
| Organization | Supported | Not active on real route descriptors found | WARN | Medium-High | P1 | `siteNodes()` creates Organization when `structuredData.site` is passed. | Activate once through platform; avoid duplicate graph. |
| WebSite | Supported | Not active on real route descriptors found | WARN | Medium-High | P1 | `siteNodes()` creates WebSite without SearchAction. | Activate once; do not render inappropriate public site graph on private routes. |
| BreadcrumbList | Supported | Not active on product/category route descriptors | WARN | Medium | P1/P2 | `breadcrumbNodes()` exists; product page renders visible breadcrumb but does not pass breadcrumb descriptor. | Add breadcrumb descriptors to product/category pages. |
| Product | Supported | Active on product detail | PASS | Info | Maintain | Product route passes `structuredData.productBook`; factory creates Product. | Preserve. |
| Book | Supported | Active on product detail | PASS | Info | Maintain | Factory creates Book with authors, publisher, language, release date, page count when provided. | Preserve. |
| Offer | Supported | Active on product detail | PASS | Info | Maintain | Factory creates selected offer with price, currency VND, availability, sku. | Preserve. |
| CollectionPage | Supported | Not active on catalog/category routes | WARN | Medium | P2 | Factory supports `collectionNodes()` but route descriptors do not pass collections. | Add only when route item data is stable. |
| ItemList | Supported | Not active on catalog/category routes | WARN | Medium | P2 | Factory creates ItemList from collection descriptor. | Add with CollectionPage only when stable. |
| SearchAction | Intentionally absent | Not active | DEFERRED | Informational | P4 | Test name states WebSite graph is generated without SearchAction. | Defer until search route/policy is approved. |
| FAQ | Not implemented | Not active | DEFERRED | Informational | P4 | No FAQ schema factory/test support found and FAQ content is deferred. | Do not fabricate; defer until FAQ content exists. |
| AggregateRating | Not implemented | Not active | DEFERRED | Informational | P4 | No rating/review source exists. | Do not fabricate; defer until real review/rating data exists. |
| Review | Not implemented | Not active | DEFERRED | Informational | P4 | Review scope/data is not active for current SEO route schema. | Defer until review data exists. |
| WebPage | Generic not implemented | Not active | DEFERRED | Informational | P4 | Page metadata exists but no WebPage schema node factory. | Optional later. |

## Active Product Detail JSON-LD

Status: PASS with WARN limitations.

Evidence:

- `apps/web/app/sach/[slug]/page.tsx` creates a `productBook` descriptor from product authors, publisher, variants, images, language, release date, and page count.
- `StructuredDataRenderer` renders the serialized JSON-LD.
- `apps/web/app/sach/[slug]/page.test.tsx` asserts Product, Book, and Offer nodes for product detail.
- `apps/web/tests/seo/structured-data-regression.test.ts` asserts Product/Book/Offer URL and image consistency with canonical, Open Graph, and Twitter assets.

Limitations:

- Product route does not pass `site` or `breadcrumb` structured-data descriptors.
- Product detail visible breadcrumb exists in HTML, but JSON-LD BreadcrumbList is not active.
- Rating/review schema is absent, correctly avoiding fabricated claims.

## Activation Decision Proposal

| Decision | Recommendation | Reason |
|---|---|---|
| Site graph location | Prefer homepage descriptor for M7.2B unless root-layout integration can guarantee no duplicate graph and no public site graph on private routes. | Homepage is public, canonical, and avoids accidentally rendering public graph on admin/account/auth surfaces. |
| Duplicate graph prevention | Use one Organization/WebSite source and test for a single graph identity. | `validation.ts` detects duplicate IDs; M7.2B should make duplication impossible by design. |
| Private route behavior | Do not render public Organization/WebSite graph on private routes unless the architecture explicitly supports a single root graph without page-specific duplication. | Private routes are noindex; public entity graph should focus on public pages. |
| Breadcrumb graph | Add per-route BreadcrumbList on product and category pages where visible breadcrumbs already exist. | This mirrors user-visible navigation and improves machine-readable entity relationships. |
| Collection graph | Add only when the visible item list is stable and canonical. | Avoid noisy or misleading collection data for transient query/filter states. |

## Structured Data Consistency

| Check | Status | Evidence |
|---|---|---|
| Deterministic graph sorting | PASS | `knowledge-graph-assembler.ts` sorts by node key before freezing. |
| Duplicate node detection | PASS | `validation.ts` checks duplicate IDs and identities. |
| Broken reference detection | PASS | `validation.ts` checks references against graph IDs. |
| URL/canonical consistency | PASS | `core/consistency.ts` validates Product/Book/Breadcrumb/Collection URL matches canonical. |
| Image consistency | PASS | `core/consistency.ts` checks Product image against OG/Twitter image. |
| Local URL production guard | PASS | Production local URL leakage is classified through consistency/config tests. |
| Invalid ISBN handling | PASS | Factory omits invalid ISBN and reports `SEO_STRUCTURED_DATA_ISBN_INVALID` as MINOR. |

## Findings

| Severity | Finding | Evidence | Priority | M7.2B Action |
|---|---|---|---|---|
| Medium-High | Organization/WebSite graph exists in platform but is not active on real routes. | `siteNodes()` only runs when descriptors pass `structuredData.site`; active route descriptors do not. | P1 | Activate once through platform, preferably homepage unless root layout can avoid duplicate/private-route issues. |
| Medium | BreadcrumbList exists in platform but is not active on product/category routes. | Product/category pages render visible breadcrumbs but descriptors omit breadcrumb structured data. | P1/P2 | Add breadcrumb descriptors through platform. |
| Medium | CollectionPage/ItemList not active for catalog/category pages. | Factory supports collection; route descriptors omit it. | P2 | Add only if route data provides stable names and canonical URLs. |
| Informational | FAQ, AggregateRating, Review are absent. | No implementation or content/data source. | P4 / Deferred | Defer until content/review scope exists; do not fabricate. |
| Informational | SearchAction absent. | Test explicitly covers WebSite without SearchAction. | P4 / Deferred | Defer until search route/policy is approved. |

## M7.2B Resolution

| Finding | Resolution Status | Change | Code Evidence | Test Evidence | Remaining Limitation |
|---|---|---|---|---|---|
| Organization/WebSite graph supported but not active | FIXED | Activated site graph once on the public homepage descriptor. | `apps/web/app/page.tsx` renders `StructuredDataRenderer` with `structuredData.site`. | `apps/web/app/homepage.test.tsx` asserts Organization and WebSite nodes. | Site graph is intentionally not rendered from root layout to avoid duplicates and private-route leakage. |
| BreadcrumbList supported but not active | FIXED | Added BreadcrumbList descriptors to product and category detail pages using visible breadcrumb facts. | `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` | `apps/web/app/sach/[slug]/page.test.tsx`, `apps/web/app/danh-muc/[slug]/page.test.tsx`, `tests/seo/structured-data-regression.test.ts` | Breadcrumbs mirror current implemented routes only. |
| CollectionPage/ItemList supported but not active | FIXED FOR STABLE ROUTES | Added collection graph to base catalog, category list, and category detail when route data is stable and visible. | `apps/web/app/san-pham/page.tsx`, `apps/web/app/danh-muc/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` | `apps/web/app/san-pham/page.test.tsx`, `apps/web/app/danh-muc/[slug]/page.test.tsx`, `tests/seo/structured-data-regression.test.ts` | Query/filter/pagination states remain noindex and do not receive collection graph. |
| SearchAction absent | DEFERRED | No SearchAction added. | No source change by design. | Existing structured-data tests continue to exclude unsupported schema. | Requires approved search behavior before schema activation. |
| FAQ schema absent | DEFERRED | No FAQ schema added. | No source change by design. | Not applicable. | Requires real FAQ/policy content; no fabricated schema. |
| AggregateRating/Review absent | DEFERRED | No rating/review schema added. | No source change by design. | Product tests assert no `aggregateRating` or `review`. | Requires real review/rating data. |

## M7.2B Structured Data Decision

The site graph is rendered on the homepage, not in the root layout. This keeps Organization/WebSite activation public and canonical while avoiding duplicate graph output and avoiding a public site graph on private noindex routes.

All new JSON-LD is still generated by the existing structured-data factory and renderer. No route manually builds `application/ld+json` strings.
