# M7.2A AI Search Readiness Audit

Status: M7.2B IMPLEMENTATION CLOSURE UPDATED

## Purpose

Evaluate whether RoSach pages provide machine-readable entity signals, semantic extractability, structured entity relationships, and canonical public references that can support future discovery and AI Receptionist use. This audit does not claim that any specific AI search product will index, rank, summarize, or understand RoSach.

No AI, chatbot, semantic search, recommendations, or workflow agent behavior was implemented.

## Readiness Summary

Overall status: WARN.

RoSach has a clear semantic baseline: human-readable headings, clean product/category URLs, canonical metadata, public/private route separation, and Product/Book/Offer structured data on product detail pages. Readiness would improve with active Organization/WebSite, BreadcrumbList, and carefully scoped CollectionPage/ItemList structured data.

FAQ/policy schema, SearchAction, AggregateRating, and Review are deferred because the supporting content/data is not currently active. They should not raise M7.2B priority and must not be fabricated.

## AI Search Checklist

| Area | Status | Severity | Priority | Evidence | Recommendation |
|---|---|---|---|---|---|
| Semantic HTML | PASS | Info | Maintain | Route code uses `main`, `section`, `article`, headings, breadcrumbs, forms, and links. | Preserve. |
| Entity titles | PASS | Info | Maintain | Product/category metadata uses product/category names. | Preserve. |
| Canonical public references | PASS | Info | Maintain | SEO platform generates absolute canonical URLs; tests assert consistency. | Preserve. |
| Product entity graph | PASS | Info | Maintain | Product detail JSON-LD includes Product, Book, Offer. | Preserve. |
| Organization/WebSite graph | WARN | Medium-High | P1 | Supported by `siteNodes()` but not active on real route descriptors. | Activate once through platform; avoid duplicate graph and private-route leakage. |
| Breadcrumb entity graph | WARN | Medium | P1/P2 | Visible breadcrumbs exist; JSON-LD BreadcrumbList is not active on real routes. | Activate on product/category pages. |
| Collection entity graph | WARN | Medium | P2 | CollectionPage/ItemList supported but not active. | Add to catalog/category only when item data is stable. |
| Author entity pages | ACCEPTED DEFERRED | Informational | P4 | Authors exist in catalog DTOs and filters; no dedicated author route. | Defer route/content scope. |
| Publisher entity pages | ACCEPTED DEFERRED | Informational | P4 | Publisher exists in product/category filtering; no dedicated publisher route. | Defer route/content scope. |
| FAQ/policy knowledge | DEFERRED | Informational | P4 | FAQ/content routes are deferred; no FAQ schema. | Defer until content exists; do not fabricate. |
| SearchAction | DEFERRED | Informational | P4 | WebSite graph intentionally lacks SearchAction in tests. | Add only when search route/policy is approved. |
| AggregateRating/Review | DEFERRED | Informational | P4 | No active review/rating source for schema. | Do not fabricate; defer until real data exists. |
| Product recommendation links | PASS | Info | Maintain | Product cards and related products link to canonical `/sach/[slug]`. | Preserve for future AI Receptionist suggestions. |

## AI Receptionist SEO Implications

When M7 AI Receptionist is implemented later, it should:

- link only to canonical product/category URLs;
- answer product questions from public catalog data only;
- use current availability and price display as read-only information;
- avoid claiming review/rating/policy facts that are not present;
- avoid exposing private/cart/order/admin/account URLs;
- treat `/san-pham?q=...` as a user navigation link, not an indexable SEO landing page.

## Findings

| Severity | Finding | File/Route | Priority | M7.2B Action |
|---|---|---|---|---|
| Medium-High | Machine-readable site identity graph is not active. | structured data descriptors on real routes | P1 | Add Organization/WebSite structured data through SEO Platform exactly once. |
| Medium | Breadcrumb structured entity relationships are not active despite visible breadcrumbs. | product/category pages | P1/P2 | Add BreadcrumbList descriptors. |
| Medium | Catalog/category collection graph is not active. | catalog/category pages | P2 | Add CollectionPage/ItemList only from stable public route data. |
| Informational | FAQ/policy source is deferred. | deferred docs/content | P4 / Deferred | Defer until FAQ/policy content exists; do not create fake content or schema. |
| Informational | `AggregateRating` and Review are absent. | no review/rating data | P4 / Deferred | Correctly absent; do not fabricate ratings. |
| Informational | SearchAction is absent. | no dedicated approved search action contract | P4 / Deferred | Defer until search policy is approved. |

## Score

| Dimension | Score | Status |
|---|---:|---|
| Semantic HTML | 8/10 | PASS |
| Entity metadata | 8/10 | PASS |
| Structured entity graph | 8/10 | PASS |
| Internal canonical links | 8/10 | PASS |
| FAQ/policy extractability | Deferred | Not scored as M7.2B blocker |
| Overall AI Search Readiness | 7.8/10 | PASS WITH DEFERRED CONTENT LIMITS |

## M7.2B Resolution

| Finding | Resolution Status | Change | Code Evidence | Test Evidence | Remaining Limitation |
|---|---|---|---|---|---|
| Machine-readable site identity graph not active | FIXED | Organization/WebSite graph activated once on homepage. | `apps/web/app/page.tsx` | `apps/web/app/homepage.test.tsx` | No SearchAction added. |
| Breadcrumb structured relationships not active | FIXED | Product/category BreadcrumbList descriptors added. | `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` | Product/category route tests and structured-data regression. | Author/publisher entity pages remain deferred. |
| Catalog/category collection graph not active | FIXED FOR STABLE ROUTES | CollectionPage/ItemList added for base catalog, category list, and category detail. | `apps/web/app/san-pham/page.tsx`, `apps/web/app/danh-muc/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` | Catalog/category route tests. | Query/filter states remain noindex and avoid collection graph. |
| FAQ/policy source deferred | DEFERRED | No fabricated FAQ/policy schema added. | No source change by design. | Not applicable. | Requires real content scope. |
| AggregateRating/Review absent | DEFERRED | No fabricated ratings or reviews added. | Product structured-data factory unchanged for these schema types. | Product route test asserts no `aggregateRating` or `review`. | Requires real review/rating data. |
| SearchAction absent | DEFERRED | No SearchAction added. | No source change by design. | Structured-data tests remain aligned. | Requires approved search-action policy. |

M7.2B improves machine-readable entity graph, semantic extractability, structured entity relationships, and canonical public references. This does not guarantee visibility in any specific AI search product.
