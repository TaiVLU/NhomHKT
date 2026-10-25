# M7.2A Crawlability Audit

Status: AUDIT ONLY

## Scope

Reviewed route crawlability, redirects, canonical policy, duplicate URL handling, sitemap inclusion/exclusion, internal linking, image SEO, and URL design.

## Implemented Public Routes

| Route | Crawlability | Indexability | Sitemap | Status | Evidence |
|---|---|---|---|---|---|
| `/` | Crawlable | Indexable | Included | PASS | Home descriptor and static provider. |
| `/san-pham` | Crawlable | Indexable clean route | Included | PASS | Catalog descriptor and static provider. |
| `/san-pham?...` | Crawlable | noindex/follow | Excluded | PASS | Catalog query policy. |
| `/sach/[slug]` | Crawlable when product exists | Indexable | Included by book provider | PASS | Product detail descriptor/provider. |
| `/san-pham/[slug]` | Redirect to `/sach/[slug]` | Not direct canonical | Excluded | PASS | Next redirect config. |
| `/danh-muc` | Crawlable | Indexable | Included | PASS | Category list descriptor/static provider. |
| `/danh-muc/[slug]` | Crawlable when category exists | Indexable | Included by category provider | PASS | Category detail descriptor/provider. |
| `/khuyen-mai` | Crawlable | Indexable | Included | WARN | Route is implemented but content is placeholder/informational. |
| missing product/category | Crawlable response becomes 404 | noindex/nofollow metadata | Excluded | PASS | Missing descriptors and route-policy tests. |

## Private And Utility Routes

| Route Class | Crawlability Policy | Status | Evidence |
|---|---|---|---|
| `/admin/*` | robots disallow + noindex/nofollow/noarchive layout | PASS | `robots.ts`, `admin/layout.tsx`. |
| `/tai-khoan/*` | robots disallow + noindex/nofollow layout | PASS | `robots.ts`, `tai-khoan/layout.tsx`. |
| `/gio-hang` | robots disallow + noindex/nofollow | PASS | `robots.ts`, cart descriptor. |
| `/thanh-toan/*` | robots disallow + noindex/nofollow | PASS | `robots.ts`, checkout descriptors. |
| auth routes | robots disallow + noindex/nofollow | PASS | `robots.ts`, auth descriptors. |
| API | Separate backend origin, not web App Router | PASS with note | API is not in `apps/web/app`. |

## Internal Linking

| Relationship | Status | Evidence | Recommendation |
|---|---|---|---|
| Home -> Catalog | PASS | Hero and section links to `/san-pham`. | Preserve. |
| Home -> Category | PASS | Home category links use `categoryUrl`. | Preserve. |
| Catalog -> Product | PASS | `ProductCard` links to `productUrl(product.slug)`. | Preserve. |
| Category -> Catalog filter | PASS | Category detail links to `/san-pham?category=...`. | Preserve. |
| Product -> Category breadcrumb | PASS | Product page visible breadcrumb links to `/san-pham`; product facts list categories. | Add JSON-LD breadcrumb later. |
| Product -> Related books | PASS | Related products render `ProductCard`. | Preserve. |
| Product -> Author/Publisher detail | WARN | Author/publisher names shown but no dedicated route. | Defer unless author/publisher route scope is approved. |
| Footer -> Core routes | PASS | M7.1 audit confirmed footer links. | Preserve. |

## URL Design

| Check | Status | Evidence |
|---|---|---|
| Product canonical path | PASS | `/sach/[slug]`; legacy `/san-pham/[slug]` redirects. |
| Category canonical path | PASS | `/danh-muc/[slug]`. |
| Catalog path | PASS | `/san-pham`. |
| Query parameters | PASS | Filter/search/sort/page query parameters are sanitized and excluded from canonical. |
| Slugs | PASS | Slugs are readable ASCII/hyphenated in seed/API convention. |
| Vietnamese URL encoding | WARN | Vietnamese display labels exist; URLs remain ASCII slugs. This is acceptable for local demo. |
| Trailing slash policy | PASS | URLs are normalized by SEO URL resolver and tests use slashless paths except root. |

## Pagination SEO

| Check | Status | Evidence | Recommendation |
|---|---|---|---|
| Page parameter handled | PASS | `page` is a meaningful parameter. |
| Duplicate page canonical | PASS | Page/query states canonicalize to `/san-pham`. |
| Indexability | PASS | Page/query states are noindex/follow. |
| rel prev/next | WARN | No explicit prev/next link metadata found. | Defer; modern Google does not require prev/next, but UX/AI can benefit from clear pagination links. |
| Out-of-range pages | WARN | UI normalizes display but audit did not run runtime crawler for all edge pages. | Add M7.2B test if changing pagination SEO. |

## Crawlability Findings

| Severity | Finding | File/Route | Priority | M7.2B Action |
|---|---|---|---|---|
| Medium | Placeholder `/khuyen-mai` is indexable. | `apps/web/app/khuyen-mai/page.tsx` | P2 | Decide whether placeholder promotional page should stay indexable or noindex until real content exists. |
| Medium | Author/publisher entity pages are absent. | no route | P3 | Defer or plan route scope; do not add sitemap entries before implementation. |
| Medium | Query pagination has no route-specific metadata beyond noindex policy. | `/san-pham?page=...` | P3 | Keep current duplicate-control policy; optionally improve title/description. |
| Low | No automated dead-link crawl command found. | repository scripts | P4 | Consider adding a future local crawl smoke after implementation approval. |
