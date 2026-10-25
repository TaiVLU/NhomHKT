# M6.0 SEO Architecture Specification

## 1. Document Control

| Field | Value |
| --- | --- |
| Project | RoSach |
| Milestone | M6 - SEO & Production Readiness |
| Phase | M6.0 - SEO Architecture & Production Readiness Design |
| Status | DESIGN COMPLETE, pending Technical Lead review |
| Date | 2026-07-20 |
| Scope | Documentation and architecture design only |
| Implementation status | Not started for M6.1 |

## 2. Executive Summary

RoSach is a Vietnamese online bookstore built as a catalog-oriented commerce site. M5
closed with catalog, product detail, category browsing, cart, checkout, order
processing, inventory adjustment, RBAC, and browser quality gates approved. M6 moves
from commerce completion into SEO and production readiness.

This specification defines the SEO architecture for the real RoSach repository. It is
not a generic SEO tutorial and it does not implement features. It records the current
SEO baseline, the planned target architecture, the quality gates, and the roadmap for
M6.1 through M6.7.

Key current findings:

- The frontend is a Next.js App Router application under `apps/web/app`.
- Public catalog routes exist for home, catalog, category list, category detail, and
  book detail.
- Product detail already has dynamic metadata, canonical URL, Open Graph fields, and
  Product JSON-LD.
- `robots.ts` and `sitemap.ts` already exist.
- Author and publisher public APIs exist, but no author or publisher landing pages
  currently exist in the frontend.
- Public DTOs are separated from Admin DTOs and do not expose cost price, inventory
  ledger, audit trail, or reserved inventory fields.
- SEO is partial. Several M6 improvements remain planned, especially complete
  indexability controls, structured data graph design, metadata coverage, route-level
  noindex, canonical query handling, production origin configuration, and repeatable
  SEO tests.

## 3. Scope and Non-Goals

### In Scope

- SEO architecture and production-readiness design.
- Current-state repository findings.
- Route indexability matrix.
- URL, slug, metadata, canonical, robots, sitemap, structured data, breadcrumb,
  internal-linking, image SEO, filtering, pagination, and search strategy.
- Content and book seed-data strategy.
- SEO testing strategy, quality gates, ADR candidates, risks, and phased M6 roadmap.
- Roadmap and project-memory updates.

### Non-Goals

- No application code changes.
- No sitemap, robots, metadata, JSON-LD, or redirect implementation.
- No dependency, package, lockfile, Prisma schema, migration, seed-data, database,
  API, UI, or deployment changes.
- No production credentials.
- No M6.1 implementation.

## 4. Source of Truth

This document is grounded in these repository sources:

| Area | Repository evidence |
| --- | --- |
| Stack and scripts | `package.json`, `apps/web/package.json`, `apps/api/package.json` |
| Frontend routes | `apps/web/app/**` |
| Global metadata | `apps/web/app/layout.tsx` |
| Robots and sitemap | `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts` |
| Catalog pages | `apps/web/app/page.tsx`, `apps/web/app/san-pham/page.tsx`, `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx` |
| Public catalog client | `apps/web/services/catalog-client.ts` |
| Backend catalog routes | `apps/api/src/modules/catalog/catalog.routes.ts` |
| Backend catalog service | `apps/api/src/modules/catalog/catalog.service.ts` |
| Validation and slug rules | `apps/api/src/modules/catalog/catalog.schema.ts`, `apps/api/src/modules/catalog/catalog.utils.ts` |
| Data model | `apps/api/prisma/schema.prisma`, `docs/21-database-dictionary.md` |
| Existing SEO/accessibility guidance | `docs/07-non-functional-requirements.md`, `docs/27-seo-accessibility.md` |
| M5 closure and M6 planning | `docs/29-development-roadmap.md`, `docs/99-project-memory.md` |
| Deployment context | `docs/28-deployment-guide.md`, `apps/api/src/config/environment.ts` |
| Approved architecture decisions | `docs/30-open-questions-and-decisions.md` |
| Master project prompt SEO baseline | `ROSACH_CODEX_MASTER_PROMPT.md` section 16 |
| Supplied course material reference | Existing project memory and roadmap reference nine supplied SEO chapters; no separate course-chapter files were found in the repository during M6.0 inspection. |

Status labels used in this document:

- CURRENT: verified in the repository.
- PLANNED: planned for M6 but not implemented.
- RECOMMENDED: preferred implementation guidance.
- FUTURE: useful after M6 or for scaling.
- OUT OF SCOPE: not part of M6.0 or not approved for implementation.

## 5. Current System Baseline

### Stack

| Layer | CURRENT |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Rendering model | Server-rendered App Router pages with selected dynamic routes and cached fetches using `next.revalidate`; some routes force dynamic rendering |
| Backend | Express 5, TypeScript, Zod validation |
| Database | Prisma 6 with SQL Server |
| Styling | Tailwind CSS 4 and project CSS tokens |
| Testing | Vitest, ESLint, TypeScript, existing unit and integration tests |
| Image storage | Cloudinary adapter plus fake adapter for tests/local flows |

### Current SEO Capability Matrix

| Capability | Status | Repository finding |
| --- | --- | --- |
| Static/global metadata | PRESENT | `apps/web/app/layout.tsx` exports global `metadata` |
| Dynamic product metadata | PRESENT | `apps/web/app/sach/[slug]/page.tsx` has `generateMetadata` |
| Dynamic category metadata | PRESENT | `apps/web/app/danh-muc/[slug]/page.tsx` has `generateMetadata` |
| Catalog metadata | PARTIAL | `/san-pham` has static metadata; query states do not vary metadata |
| Page titles | PARTIAL | Public catalog/product/category/cart have titles; many auth/account/admin routes rely on defaults |
| Meta descriptions | PARTIAL | Public catalog/product/category/cart have descriptions; coverage is incomplete |
| Canonical URLs | PARTIAL | Root, catalog, category detail, and product detail have canonical URLs |
| Open Graph metadata | PARTIAL | Product detail has Open Graph; other public routes are incomplete |
| Twitter metadata | ABSENT | No explicit Twitter card strategy found |
| `robots.txt` | PARTIAL | `apps/web/app/robots.ts` exists but only disallows `/admin` and `/tai-khoan` |
| `sitemap.xml` | PARTIAL | `apps/web/app/sitemap.ts` includes home, catalog, category list, categories, and products |
| Structured data | PARTIAL | Product detail emits Product JSON-LD only |
| Breadcrumb markup | PARTIAL | Visible breadcrumbs exist on catalog/category/product pages; no BreadcrumbList JSON-LD |
| Semantic headings | PARTIAL | Public pages use headings, but SEO heading audit remains planned |
| Image alt text | PARTIAL | Product images store and render `altText`; complete seed/content quality remains planned |
| Indexability controls | PARTIAL | Robots exists; route-level noindex for private/transactional pages is incomplete |
| Public route discoverability | PARTIAL | Internal links exist for catalog/product/category; author/publisher frontend routes absent |
| Search result crawl behavior | PARTIAL | `/san-pham?q=...` is shareable but noindex/canonical rules are not implemented |
| Filter/sort URL handling | PARTIAL | Catalog supports query parameters, but canonical/indexability strategy is not complete |
| Pagination handling | PARTIAL | Catalog has numbered pagination URLs; SEO metadata and canonical rules are not complete |
| Not-found behavior | PARTIAL | Product/category use `notFound`; route-level 404 SEO audit remains planned |
| Mobile readiness | PRESENT | M5 browser responsive gates passed in Chromium |
| Performance readiness | PARTIAL | Image and rendering practices exist; no M6 performance baseline measurement yet |
| Production domain config | PARTIAL | `NEXT_PUBLIC_SITE_URL` and `WEB_ORIGIN` exist; dedicated SEO origin/indexing flags are not present |
| Analytics readiness | ABSENT | No analytics or Search Console integration found |
| Search Console readiness | ABSENT | No verification or submission workflow found |

## 6. SEO Vision

RoSach SEO should make the bookstore easy for Vietnamese readers and search engines
to understand without exposing private commerce workflows.

M6 target outcomes:

- RoSach presents itself as a Vietnamese online bookstore.
- Public catalog and book pages are crawlable, mobile-first, semantic, and fast.
- Every approved indexable page has a unique title, useful meta description,
  deterministic canonical URL, and appropriate social metadata.
- Private, transactional, account, and Admin pages are not intentionally indexable.
- Sitemap entries exactly match approved indexable entities.
- Structured data reflects visible page content only.
- No fabricated ratings, reviews, awards, review counts, or unsupported claims.
- Book images have meaningful Vietnamese alt text.
- Slugs are stable, deterministic, and safe for Vietnamese content.
- SEO tests and audits are repeatable before staging and production.

## 7. Information Architecture

| Page type | Route pattern | Current existence | User purpose | SEO purpose | Indexability | Sitemap | Structured data | Internal links | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | CURRENT | Introduce RoSach and entry points | Brand and catalog discovery | index/follow | Include | WebSite, Organization or OnlineStore | Catalog, categories, featured books | M6.1/M6.3 |
| Catalog | `/san-pham` | CURRENT | Browse and filter books | Main book listing | index/follow for clean page | Include | CollectionPage or ItemList, optional BreadcrumbList | Product cards, category links | M6.1/M6.3 |
| Legacy product redirect | `/san-pham/[slug]` | CURRENT | Preserve older route path | Redirect to canonical book detail | no direct index | Exclude | None | Redirect only | CURRENT |
| Category list | `/danh-muc` | CURRENT | Browse categories | Category discovery | index/follow if content remains useful | Include | CollectionPage, BreadcrumbList | Category links | M6.1/M6.3 |
| Category detail | `/danh-muc/[slug]` | CURRENT | Browse books by category | SEO landing page for category intent | index/follow for active categories | Include | CollectionPage or ItemList, BreadcrumbList | Product links, catalog filter link | M6.1/M6.3 |
| Book detail | `/sach/[slug]` | CURRENT | Inspect and buy a book | Primary commercial SEO page | index/follow for active sellable books | Include | Book + Product + Offer, BreadcrumbList | Category, related books, cart action | M6.1/M6.3 |
| Author | `/tac-gia/[slug]` | PLANNED | Browse books by author | Entity landing page only when content is meaningful | index/follow if implemented well | Include only if implemented | Person, CollectionPage | Author books, categories | FUTURE/M6 if approved |
| Publisher | `/nha-xuat-ban/[slug]` | PLANNED | Browse books by publisher | Entity landing page only when content is meaningful | index/follow if implemented well | Include only if implemented | Organization, CollectionPage | Publisher books, categories | FUTURE/M6 if approved |
| Search | `/san-pham?q=...` | CURRENT query behavior | Find books | Utility, usually duplicate/low-value | noindex/follow | Exclude | SearchAction only if approved | Product results | M6.1 |
| Promotions | `/khuyen-mai` | CURRENT informational route | View promotions placeholder | Low-value until real promotion content exists | noindex/follow until meaningful | Exclude until meaningful | None | Catalog | M6.1 decision |
| Cart | `/gio-hang` | CURRENT | Review cart | Transactional | noindex/follow | Exclude | None | Checkout, product links | M6.1 |
| Checkout | `/thanh-toan` | CURRENT | Place order | Transactional/private | noindex/nofollow | Exclude | None | Cart/account | M6.1 |
| Checkout success | `/thanh-toan/thanh-cong` | CURRENT | Confirmation | Transactional/private | noindex/nofollow | Exclude | None | Account/orders | M6.1 |
| Auth | `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau` | CURRENT | Authentication | Utility/private | noindex/follow | Exclude | None | Account/catalog | M6.1 |
| Account | `/tai-khoan/**` | CURRENT | Customer private account | Private | noindex/nofollow | Exclude | None | Private navigation | M6.1 |
| Admin | `/admin/**` | CURRENT | Staff/Admin operations | Private/internal | noindex/nofollow and disallow crawl | Exclude | None | Internal only | M6.1 |
| API | `/api/**` on API host | CURRENT backend | Data contract | Not web content | noindex/nofollow where applicable | Exclude | None | None | M6.1/deployment |
| 404 | framework not-found handling | PARTIAL | Explain missing content | Avoid indexing invalid URLs | noindex | Exclude | None | Home/catalog | M6.1 |

## 8. Route and Indexability Matrix

| Route type | Directive | Robots crawl rule | Canonical | Sitemap |
| --- | --- | --- | --- | --- |
| `/` | index/follow | Allow | Self | Include |
| `/san-pham` clean page | index/follow | Allow | Self | Include |
| `/san-pham?page=1` | index/follow or redirect to clean page | Allow | `/san-pham` | Exclude query URL |
| `/san-pham?page=N` | RECOMMENDED noindex/follow unless deep pagination is approved | Allow | Self or parent by ADR | Exclude initially |
| `/san-pham?sort=...` | noindex/follow | Allow | `/san-pham` or filtered parent | Exclude |
| `/san-pham?q=...` | noindex/follow | Allow | `/san-pham` | Exclude |
| `/san-pham?category=...` | noindex/follow by default | Allow | Clean category page if equivalent exists | Exclude |
| `/danh-muc` | index/follow if category list remains useful | Allow | Self | Include |
| `/danh-muc/[slug]` | index/follow for active categories | Allow | Self | Include |
| `/sach/[slug]` | index/follow for active sellable books | Allow | Self | Include |
| `/san-pham/[slug]` | permanent redirect | Allow | `/sach/[slug]` after redirect | Exclude |
| `/tac-gia/[slug]` | index/follow only if implemented with meaningful content | Allow after implementation | Self | Include only after implementation |
| `/nha-xuat-ban/[slug]` | index/follow only if implemented with meaningful content | Allow after implementation | Self | Include only after implementation |
| `/khuyen-mai` | noindex/follow until real promotion content exists | Allow | Self | Exclude |
| `/gio-hang` | noindex/follow | Allow or disallow as crawler-waste | Self | Exclude |
| `/thanh-toan/**` | noindex/nofollow | Disallow optional | Self | Exclude |
| `/dang-nhap`, `/dang-ky`, reset routes | noindex/follow | Allow or disallow optional | Self | Exclude |
| `/tai-khoan/**` | noindex/nofollow | Disallow | Self | Exclude |
| `/admin/**` | noindex/nofollow | Disallow | Self | Exclude |
| API routes | noindex/nofollow where rendered, not web pages | Disallow on web host if proxied | None | Exclude |

Important rule: robots.txt crawl blocking does not replace `noindex`. Private pages must
also be protected by authentication/RBAC. Robots is only crawler guidance, not access
control.

## 9. URL and Slug Strategy

### Current Routes

- `/`
- `/san-pham`
- `/sach/[slug]`
- `/danh-muc`
- `/danh-muc/[slug]`
- `/san-pham/[slug]` permanently redirects to `/sach/[slug]`

### Planned Routes

- `/tac-gia/[slug]`, only when meaningful author pages are approved and implemented.
- `/nha-xuat-ban/[slug]`, only when meaningful publisher pages are approved and
  implemented.

### Slug Rules

The backend currently provides `slugify` in `catalog.utils.ts`:

- trim and normalize whitespace;
- normalize Unicode with NFD;
- remove combining diacritics;
- convert Vietnamese `d` with stroke to `d`;
- lowercase;
- replace non-alphanumeric runs with hyphens;
- trim leading and trailing hyphens;
- cap at 255 characters.

M6 should preserve this direction:

- lowercase ASCII slugs;
- spaces converted to hyphens;
- duplicate hyphens removed;
- no leading or trailing hyphens;
- deterministic uniqueness;
- no volatile price, stock, or promotional data in slugs;
- do not include meaningless IDs unless required for collision handling;
- keep public slugs stable after publication whenever possible.

### Slug History

CURRENT:

- `SlugReservation` prevents reuse.
- Historical product slug redirects are not supported as a public redirect table.
- M3 decision says old product slugs return 404 and are not reused.

RECOMMENDED ADR:

- Decide before production whether M6 keeps the current 404 behavior or adds a
  dedicated historical redirect strategy for public book/category/entity slug changes.

## 10. Metadata Specification

All metadata must be generated from verified public data and must not expose private
fields. Character counts are operational targets, not hard guarantees.

General targets:

- Titles commonly around 50-60 characters where practical.
- Descriptions commonly around 140-160 characters where practical.
- Unique metadata for indexable pages.
- No keyword stuffing.
- No unsupported claims.
- No misleading price or availability statements.
- Locale should be `vi_VN` for social metadata.
- Site name should be `RoSach`.

| Page | Title template | Description template | Canonical | Robots | OG/Twitter |
| --- | --- | --- | --- | --- | --- |
| Home | `RoSach - Nha sach truc tuyen cho doc gia Viet` | Concise brand and catalog value proposition for Vietnamese readers | `/` | index/follow | Website summary and default social image |
| Catalog | `Sach | RoSach` or refined Vietnamese catalog title | Browse Vietnamese bookstore catalog by title, author, ISBN, category | `/san-pham` | index/follow | Collection summary |
| Category | `{Category name} | RoSach` | `Sach thuoc danh muc {Category name} tai RoSach.` with category description preferred | `/danh-muc/{slug}` | index/follow | Category collection |
| Book | `{Book title} cua {Author} | RoSach` when author is known | Short description or SEO description, focused on purchase/browsing intent | `/sach/{slug}` | index/follow | Product/book social card with cover |
| Author | `{Author name} | RoSach` | Available books by the author, only with meaningful content | `/tac-gia/{slug}` | index/follow when implemented | Author collection |
| Publisher | `{Publisher name} | RoSach` | Available books from the publisher, only with meaningful content | `/nha-xuat-ban/{slug}` | index/follow when implemented | Publisher collection |
| Search | `Tim sach | RoSach` | Utility search result summary | Clean search URL | noindex/follow | Optional, not sitemap |
| Cart/checkout/account/admin | Useful route title only | No SEO marketing description required | Self | noindex | No social optimization |
| 404 | `Khong tim thay trang | RoSach` | Helpful fallback | None or requested URL | noindex | None |

## 11. Canonical Strategy

Canonical URLs must be deterministic and environment-aware.

Rules:

- Production canonical origin must be configured through environment.
- HTTPS is required for production canonicals.
- Current `NEXT_PUBLIC_SITE_URL` fallback to localhost is acceptable for development, but
  production must not emit localhost URLs.
- Use no trailing slash except root.
- Use lowercase route segments and slugs.
- Stable indexable pages self-canonicalize.
- Tracking parameters never change canonical identity.
- Sort parameters canonicalize to the unsorted parent unless a specific SEO landing page
  is approved.
- Filter parameters normally canonicalize to the clean parent or to a clean category
  route when equivalent.
- Internal search pages canonicalize to `/san-pham` and are noindex.
- Product variant selection must not create duplicate indexable product URLs unless a
  future variant-specific page strategy is approved.
- Staging must not canonicalize to a temporary host in a way that can leak into
  production indexing.

ADR candidates:

- Whether deep pagination self-canonicalizes or canonicalizes to page one.
- Whether old public slugs gain redirect support.
- Whether selected filters can become curated SEO landing pages.

## 12. Robots Strategy

### Development

- Crawling is not relevant.
- Localhost should not be submitted to search engines.
- Development may allow crawling for local testing, but no public indexing should occur.

### Staging

- Prevent accidental indexing.
- Prefer authentication or network protection plus explicit noindex headers/meta.
- Do not rely solely on robots.txt.
- Do not submit staging sitemap to Search Console.

### Production

- Allow approved public pages.
- Disallow obvious internal and crawler-waste areas such as `/admin`, `/tai-khoan`,
  `/thanh-toan`, and API proxy paths if any exist on the web host.
- Reference the production sitemap.
- Robots must never be treated as access control.
- Do not list sensitive internal paths as a security measure.

CURRENT gap:

- `robots.ts` disallows `/admin` and `/tai-khoan` only. M6.1 should extend strategy for
  transactional and utility areas after route-level noindex behavior is designed.

## 13. Sitemap Strategy

For the projected 30-50 book seed dataset, the simplest responsible design is one
dynamic sitemap generated by Next.js.

Include:

- Home.
- Clean catalog landing page.
- Category list page if useful.
- Active category detail pages.
- Published, active, sellable book detail pages.
- Author pages only if meaningful author landing pages are implemented.
- Publisher pages only if meaningful publisher landing pages are implemented.

Exclude:

- Admin routes.
- Auth routes.
- Account routes.
- Cart and checkout.
- Payment or checkout result pages.
- Search results.
- Filter and sort query URLs.
- Invalid, inactive, unpublished, deleted, or non-sellable products.
- Empty or low-value utility routes.

Data sources:

- Current sitemap uses `getCategories()` and `getProducts('pageSize=100')`.
- Product eligibility must stay aligned with the public product DTO rules: active,
  non-deleted, and at least one active variant.
- `lastModified` should derive from product/category `updatedAt` only if exposed safely
  or fetched server-side through an internal sitemap-safe source.
- If no eligible products exist, the sitemap should still return valid XML with stable
  static entries.

Scaling:

- One sitemap is acceptable for 30-50 books.
- Consider sitemap indexes and per-entity sitemaps only when URL volume or update
  patterns justify it.
- Do not fabricate `changefreq` or `priority` values unless the team keeps a meaningful
  policy. Current `sitemap.ts` uses these fields; M6.1 should either document the policy
  or remove unsupported values.

## 14. Structured Data Architecture

Structured data must match visible content and public DTOs. It must not publish private
fields, stale values, fabricated ratings, fabricated reviews, or fabricated review
counts.

### Site-Wide

Recommended graph:

- `Organization` or `OnlineStore` for RoSach.
- `WebSite` for the public site.
- `SearchAction` only if the public search route remains stable and noindex behavior is
  explicitly accepted.
- `BreadcrumbList` on pages with visible breadcrumbs.

### Book Detail

Preferred graph:

- `Book` for bibliographic identity.
- `Product` for commerce identity where offer data is needed.
- `Offer` for price, currency, availability, and URL.
- `Person` for authors when data is available.
- `Organization` for publisher when data is available.

Allowed fields when visible/public:

- name;
- description;
- image;
- ISBN;
- author;
- publisher;
- category;
- URL;
- RoSach brand/site identity;
- price;
- price currency `VND`;
- availability;
- SKU if public and visible.

Variant and offer rules:

- If one selected/default sellable variant is represented, use that variant's SKU/ISBN
  and price.
- If multiple variants are visible, either use an `AggregateOffer` style representation
  or define a deterministic primary variant. This requires M6.3 implementation review.
- Availability must be generated from current public availability and must not expose
  reserved quantity.

CURRENT:

- Product detail emits Product JSON-LD with name, image, description, SKU, ISBN, brand,
  price, currency, availability, and URL.
- No Book type or BreadcrumbList JSON-LD currently exists.
- Existing product page test verifies JSON-LD does not include fake ratings.

M6.1F-2 migration:

- Product detail no longer manually creates schema objects, calls `JSON.stringify`, or
  renders raw `application/ld+json` scripts.
- Product detail maps the public product view model into an SEO Descriptor with
  structured-data facts only; Schema.org mapping remains inside the SEO Platform.
- The structured-data factory composes Product, Book, and Offer graph nodes through the
  graph builder, then the serializer produces JSON-LD once for the renderer.
- Product and Book URLs use the normalized canonical URL from the same SEO assets used
  for metadata, Open Graph, Twitter, and sitemap eligibility.
- Product and Book images use the normalized SEO image URL, keeping Open Graph,
  Twitter, Product, and Book image values aligned.
- Offer policy is deterministic: choose the lowest-priced in-stock variant; if no
  variant is in stock, choose the lowest-priced variant and mark the offer out of stock.
- Offer URL equals the product canonical URL and does not include variant query state.
- ISBN values are normalized before publication; invalid ISBN values are omitted with
  SEO diagnostics instead of being published as misleading structured data.
- The renderer is a framework adapter only. It renders already serialized JSON-LD and
  performs no schema construction, validation, or serialization.

```text
Product View Model
  -> SEO Descriptor structured-data facts
  -> Structured Data Factory
  -> Graph Builder
  -> Validation
  -> Serializer
  -> StructuredDataRenderer
```

M6.1F-3 release candidate additions:

- Structured data remains an SEO asset and remains sourced from the SEO Descriptor.
- The Structured Data Factory owns schema-node creation for supported facts.
- The KnowledgeGraphAssembler owns graph assembly, deterministic ordering, duplicate
  identity checks, reference checks, orphan checks, and immutable graph output.
- The serializer remains pure: graph in, JSON string out.
- The renderer remains a framework adapter only: serialized JSON-LD in, `<script>` out.
- Supported RC1 schema nodes are `Organization`, `WebSite`, `BreadcrumbList`,
  `Product`, `Book`, `Offer`, `CollectionPage`, and `ItemList`.
- Deferred schema nodes remain `Review`, `AggregateRating`, `FAQPage`, `Event`,
  `VideoObject`, and `SearchAction`.
- No page may manually construct Schema.org objects, concatenate `@graph` arrays, call
  `JSON.stringify` for JSON-LD, or render raw `application/ld+json` outside the
  structured-data renderer.

```text
SEO Descriptor
  -> Validation / Normalization / Enrichment
  -> SEO Asset Factory
  -> Structured Data Factory (schema nodes)
  -> KnowledgeGraphAssembler (canonical graph)
  -> Structured Data Validation
  -> Serializer
  -> StructuredDataRenderer
```

Knowledge graph responsibilities:

| Module | Responsibility |
| --- | --- |
| Structured Data Factory | Map approved descriptor facts into schema-node inputs without serialization or rendering |
| KnowledgeGraphAssembler | Compose nodes, preserve canonical ordering, detect duplicate identity/reference defects, and freeze graph output |
| Structured Data Validation | Validate Schema.org context, absolute URLs, duplicate `@id`, broken references, orphan nodes, circular references, local URLs, and conflicting origins |
| SEO Asset Consistency | Validate canonical, Open Graph, Twitter, sitemap, and structured-data values agree |
| Serializer | Convert a completed graph to JSON only |
| Renderer | Render already serialized JSON-LD at the Next.js boundary |

Extension guide:

1. Add schema-specific facts to `StructuredDataDescriptor` instead of adding business
   DTOs to the SEO core.
2. Add factory mapping for the new schema node using only public, visible facts.
3. Add graph and cross-asset validation for canonical URL, image, identity, and
   reference consistency.
4. Add regression tests proving no fabricated fields, no duplicate nodes, no localhost
   URLs, and stable ordering.
5. Update this document and ADR summary before page migration.

Lifecycle:

- Descriptor facts are presentation input.
- Factory output is schema-node input.
- Assembler output is the canonical knowledge graph.
- Serializer output is a cached string inside `SEOAssets`.
- Renderer output is the only framework-specific JSON-LD surface.
- Production readiness requires lint, type-check, tests, build, and SEO regression
  coverage for metadata, canonical, robots, sitemap, and structured data.

ADR summary:

- ADR-006: Structured Data is owned by the SEO Platform.
- ADR-007: SEO Descriptor is the single source of truth for SEO assets.
- ADR-008: Structured Data Factory produces schema objects; serializer produces JSON-LD.
- ADR-009: Business logic remains framework independent.
- ADR-010: Structured data is assembled as a graph, not isolated scripts.
- ADR-011: Serializer is pure and performs no validation or business mapping.
- ADR-012: Descriptor composition avoids inflating the core descriptor with schema-only
  fields.
- ADR-013: Graph composition is incremental through assembler/builder APIs.
- ADR-014: Node identity is stable and URL-derived.
- ADR-015: Graph ordering is deterministic.
- ADR-016: Platform certification covers architecture, validation, production safety,
  tests, build, and documentation.
- ADR-017: Global knowledge graph uses supported global nodes without fabricated
  organization, review, rating, FAQ, event, video, or SearchAction data.

Future roadmap:

- M6.2: sitemap pagination and larger URL set handling.
- M6.3+: author/publisher/entity landing pages only after meaningful page content
  exists.
- Future structured-data expansions: reviews, ratings, FAQ, event, video, author, and
  publisher schemas require real public data and a separate Technical Lead decision.

## 15. Breadcrumb Strategy

Visible breadcrumbs should remain part of public pages and have equivalent JSON-LD
where appropriate.

Recommended visible patterns:

- Home -> Catalog.
- Home -> Category.
- Home -> Category -> Book.

For books in multiple categories:

- Prefer a designated primary category when the data model supports it.
- CURRENT schema does not have `primaryCategoryId`.
- Until then, use a deterministic fallback such as first category by explicit join/order
  or category name/ID ordering.
- The breadcrumb must not change unpredictably between requests.

Accessibility:

- Use a visible `nav` with `aria-label="Breadcrumb"`.
- Use ordered list semantics where practical.
- Current pages use breadcrumb `nav`; M6.3 should standardize list semantics and
  BreadcrumbList JSON-LD.

## 16. Internal Linking

Rules:

- Use crawlable anchors with real `href` values.
- Do not rely only on JavaScript click handlers for SEO-critical links.
- Anchor text should be descriptive.
- Avoid repeated keyword-stuffed anchors.
- Related-book selection should have a deterministic basis.

Page-level strategy:

- Home links to catalog, featured categories, featured/latest books, and future
  informational pages.
- Catalog links to book detail pages and category pages.
- Category pages link to product details, catalog filters, and parent/category list.
- Book detail links to category, author and publisher pages when implemented, related
  books, and transactional Add to Cart controls.
- Author and publisher pages, if implemented, link to associated books and canonical
  entity pages.

CURRENT:

- Product cards link to canonical book detail routes.
- Product detail links to related books.
- Category detail links back to category list and catalog filter state.
- Author and publisher frontend entity links are not implemented.

## 17. Image SEO

Requirements:

- Product cover images need descriptive Vietnamese alt text.
- Recommended cover alt pattern: `Bia sach {Ten sach} cua {Tac gia}`.
- Include author only when known.
- Decorative images should use empty alt text.
- Avoid redundant wording such as "hinh anh cua hinh anh".
- Use stable image dimensions or aspect ratio to reduce layout shift.
- Use responsive images where supported by the hosting strategy.
- Lazy-load below-the-fold images.
- Prioritize the likely LCP image on product detail pages if performance audit confirms
  it is LCP.
- Use optimized formats and sizes.
- Missing-cover fallback must have safe alt behavior.
- Open Graph and structured-data images must use absolute URLs in production.
- Do not stuff keywords into filenames or alt text.

CURRENT:

- `ProductImage.altText` exists.
- Product DTO includes `primaryImage.altText` and image `altText`.
- Cart and checkout use product image fallback alt text.
- M6.2 seed strategy must ensure 30-50 books have useful alt text and licensed image
  sources.

## 18. Pagination, Filtering, Sorting, and Search

### Current Catalog Behavior

The current `/san-pham` page accepts and forwards these query parameters:

- `q`;
- `category`;
- `author`;
- `publisher`;
- `inStock`;
- `isNew`;
- `isFeatured`;
- `minPrice`;
- `maxPrice`;
- `sort`;
- `page`;
- `pageSize`.

Sort options include newest, name ascending/descending, and price ascending/descending.
The backend validates and normalizes query behavior through the catalog schemas and
service.

### Pagination

PLANNED rules:

- Page one should canonicalize to the clean route.
- Out-of-range pages should show an appropriate empty/404 strategy decided in M6.1.
- Page links should remain crawlable anchors.
- Deep pagination should be excluded from sitemap unless justified.
- Metadata may mention page number only when the page is intentionally indexable.

### Filtering

PLANNED rules:

- Shareable filter URLs can remain useful for users.
- Most filtered URLs should be noindex/follow by default.
- Category filters should canonicalize to clean category pages when equivalent.
- Empty filtered pages should be noindex and provide useful recovery links.
- Curated SEO landing pages can be future work, not automatic behavior.

### Sorting

PLANNED rules:

- Sorted pages are not separate indexable pages by default.
- Sort parameters canonicalize to the unsorted parent.
- Sorted pages stay crawlable enough for product discovery only if they do not create
  crawler traps.

### Search

PLANNED rules:

- Search result pages are normally noindex/follow.
- Search URLs are excluded from sitemap.
- Queries must remain safely encoded and validated.
- `SearchAction` structured data is allowed only when the public search behavior is
  stable and useful.

## 19. Content and Book Data

### Minimum SEO-Ready Book Record for Launch

| Field | Current support | Classification |
| --- | --- | --- |
| Title | `Product.name` | Already supported |
| Slug | `Product.slug` | Already supported |
| Short description | `Product.shortDescription` | Already supported |
| Long description | `Product.description` Markdown | Already supported |
| ISBN | `ProductVariant.isbn` | Already supported |
| Author | `Author` relation | Already supported |
| Publisher | `Publisher` relation nullable | Already supported |
| Category | `Category` relation | Already supported |
| Cover image | `ProductImage` | Already supported |
| Image alt text | `ProductImage.altText` | Already supported |
| Price | `ProductVariant.salePrice/listPrice` | Already supported |
| Currency | VND convention | Derivable |
| Availability | Inventory availability in public DTO | Derivable |
| Page count | `Product.pageCount` | Already supported |
| Language | `Product.language` | Already supported |
| Dimensions | `Product.dimensions` | Already supported |
| Weight | `Product.weightGrams` | Already supported |
| Release date | `Product.releaseDate` | Already supported |
| SEO title override | `Product.seoTitle` | Already supported |
| SEO description override | `Product.seoDescription` | Already supported |
| Primary category | Not modeled | Missing/future enhancement |
| Edition | Variant name/cover type can partially represent | Partial |
| Related books | Service returns related products | Derivable/current behavior |
| Publication status | `Product.isActive`, variants active, soft-delete | Already supported |
| Compare-at price | `listPrice` vs `salePrice` | Already supported when legitimate |
| SEO image override | Not modeled | Future enhancement |

Minimum launch requirement:

- Title, slug, category, author, active sellable variant, price, cover image, alt text,
  short description, and publication status.

Recommended enhancement:

- Strong long description, publisher, ISBN, release date, page count, language, SEO
  title, SEO description, and related-book curation.

Future AI Content Engine fields:

- Human-reviewed generated summaries, reading-level tags, theme tags, editorial notes,
  SEO title suggestions, SEO description suggestions, and duplicate-content signals.

## 20. Book Seed Strategy

M6.2 should design and create a deterministic seed dataset of approximately 30-50
books. M6.0 does not create seed data.

Requirements:

- Representative categories such as literature, business, self-development, children,
  education, technology, and Vietnamese books.
- Realistic authors and publishers, or clearly marked synthetic demo entities where
  rights are uncertain.
- Variants with realistic prices, SKU patterns, ISBN policy, and inventory values.
- Cover-image source policy that respects copyright and licensing.
- Vietnamese descriptions written as original concise factual summaries.
- SEO title and description values or generated template eligibility.
- Useful image alt text.
- Deterministic related-book relationships.
- Repeatable seeding with duplicate prevention.
- Development/test safeguards so seed data is not accidentally inserted into production.
- Cleanup/reset strategy for local and staging QA data.

Content safety:

- Do not copy copyrighted book descriptions from retailers or publishers.
- Do not fabricate awards, ratings, reviews, bestseller status, or endorsements.
- Use owned, licensed, public-domain, or explicitly allowed cover-image sources.

## 21. Technical SEO Requirements

M6 implementation phases must satisfy:

- Public content must be server-rendered or otherwise crawlable.
- HTTP status codes must match page state: 200 for valid pages, 301/308 for permanent
  canonical redirects, 404 for missing public resources, and auth status for private
  endpoints.
- Changed public URLs need a deliberate redirect or 404 policy.
- Canonical origin must be environment-configured.
- Metadata generation failures need safe fallbacks.
- Social and structured-data URLs must be absolute in production.
- No sensitive data in metadata, JSON-LD, sitemap, or rendered public HTML.
- Private pages must not appear in sitemap.
- Mobile-first rendering remains mandatory.
- Headings must follow a coherent hierarchy.
- HTML should be semantic and accessible.
- Links must have meaningful accessible text.
- Images need stable dimensions to reduce CLS.
- Performance budget should be defined and measured.
- Indexing policy must be environment-aware.
- Sitemap and metadata failures should be observable in logs or tests.

## 22. Performance SEO

No current Core Web Vitals measurement was performed during M6.0. Targets below are
future implementation targets and must be measured in M6.5 or deployment QA.

| Metric | Target | Measurement method | Current status | Phase |
| --- | --- | --- | --- | --- |
| LCP | Good Core Web Vitals range on key mobile pages | Lighthouse, DevTools, production monitoring | UNKNOWN | M6.5 |
| CLS | Minimal layout shift from images, fonts, badges, and cards | Lighthouse, browser QA | PARTIAL readiness | M6.5 |
| INP | Responsive interactions for filters, variant selector, cart actions | Lighthouse, real browser | UNKNOWN | M6.5 |
| Server response | Public catalog/API responses within project performance goals | API tests and production monitoring | PARTIAL | M6.5 |
| JavaScript payload | Avoid SEO-critical content hidden behind heavy client-only code | Bundle analysis if needed | UNKNOWN | M6.5 |
| Image weight | Optimized covers and social images | Lighthouse and image audit | PARTIAL | M6.5 |
| Font loading | Vietnamese-capable fonts without layout instability | Browser/font audit | PARTIAL from M5 typography closure | M6.5 |
| Route-level performance | Home, catalog, category, product | Lighthouse per route | UNKNOWN | M6.5 |

## 23. Production Configuration

Potential configuration requirements for later phases:

- Public site origin.
- Public API origin.
- Environment name.
- Indexing enabled flag.
- Search Console verification token.
- Analytics identifier.
- Social image origin or asset base URL.

Rules:

- Do not introduce variables during M6.0.
- Development is not production-indexable.
- Staging should be noindex and protected where possible.
- Production must use HTTPS.
- Production canonical origin must not reference localhost, staging, preview, or a raw
  platform host.
- Search Console verification and analytics must be configured only after privacy and
  deployment decisions.
- Secrets must not be exposed through client-visible variables.

CURRENT:

- Web uses `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL`.
- API uses `WEB_ORIGIN` and security-related environment variables.
- No dedicated indexing enabled flag or analytics configuration was found.

## 24. Analytics and Search Console

Google Search Console readiness:

- Decide domain property versus URL-prefix property before production.
- Submit only the production sitemap.
- Monitor indexing, coverage, rich results, structured data, and Core Web Vitals.
- Use URL Inspection for representative home, catalog, category, and book pages.

Analytics readiness:

- Tool selection remains a later M6 implementation decision.
- Privacy notice and consent requirements must be reviewed before production.
- Suggested event taxonomy: catalog view, filter use, search, book view, add to cart,
  checkout start, order completed.
- No sensitive personal data in analytics events.
- Staging traffic must be separated from production traffic.

Implementation is planned for a later M6 phase, not M6.0.

## 25. Testing Strategy

### Automated Candidates

- Metadata generation tests for home, catalog, category, and book pages.
- Title and description presence and uniqueness.
- Canonical URL validation.
- Robots route tests.
- Sitemap XML route tests.
- Sitemap eligibility tests.
- JSON-LD serialization tests.
- Structured-data fields match DTO-visible values.
- No fabricated ratings or reviews.
- Noindex tests for private and transactional routes.
- Absolute production URL tests.
- Image alt text checks where practical.
- Route status-code and redirect tests.
- Duplicate slug and slug-change behavior tests.

### Regression Suite Maintenance

M6.1E adds a standing SEO regression suite under `apps/web/tests/seo`. The suite
protects cross-asset invariants rather than re-testing page rendering details:

- Sitemap URLs must be absolute, query-free, fragment-free, canonical, and on the
  configured public origin.
- Canonical URLs and Open Graph URLs must match for every generated metadata asset.
- Twitter title, description, and image values must come from the same SEO asset
  source as canonical and Open Graph metadata.
- No noindex, private, checkout, auth, account, Admin, callback, error, temporary,
  or utility route should appear in approved sitemap provider output.
- Catalog query parameters must not become canonical URL identity; query states
  remain canonicalized to `/san-pham` unless a future ADR approves curated landing
  pages.
- Metadata, sitemap, and robots production URLs must remain aligned to the same
  centralized SEO runtime configuration.

Future SEO changes must update this suite when route policy changes are approved.
Tests should prefer route-class matrices and reusable assertions over duplicating
metadata snapshots in many page tests.

### Browser and Manual Candidates

- Rendered source inspection.
- Heading structure check.
- Breadcrumb visibility and mobile behavior.
- Social preview metadata inspection.
- Robots and sitemap access.
- No accidental localhost URLs in production-like builds.
- Lighthouse.
- Structured-data validation.

### External Production Checks

- Google Search Console.
- Rich Results Test.
- Sitemap fetch.
- URL Inspection.
- Core Web Vitals.
- Social card validators where available.

## 26. SEO Quality Gate

Final M6 gate should require:

| Area | PASS criteria |
| --- | --- |
| Architecture | Approved specification exists and blocker ADRs are resolved |
| Indexability | Public pages have correct directives; private/transactional pages are noindex; sitemap contains only eligible URLs |
| Metadata | Unique title and description for primary indexable pages; valid canonicals; no production localhost/staging origins |
| Structured data | Valid syntax; values match visible content; no fabricated ratings/reviews; absolute URLs |
| Content | Seed books meet minimum data requirements; Vietnamese content is useful; image alt text present where required |
| Performance | Mobile layout stable; images controlled; performance measurements recorded |
| Security | No secrets; no private fields; no Admin/private routes in sitemap or metadata |
| Quality | Lint, type-check, tests, build, SEO-specific tests, browser SEO QA, and repository hygiene pass |

## 27. ADR Candidates

| Candidate | Decision needed before | Recommendation |
| --- | --- | --- |
| Canonical origin configuration | M6.1 | Required before implementation |
| Environment-aware indexing flag | M6.1 | Required before staging/production |
| Dynamic sitemap design | M6.1 | Required before sitemap changes |
| Deep pagination canonical policy | M6.1 | Required before query SEO implementation |
| Product vs Book structured-data graph | M6.3 | Required before JSON-LD expansion |
| Author/publisher landing-page scope | M6.1 or M6.3 | Decide whether to build pages in M6 |
| Slug history and redirects | M6.1 | Decide whether current 404 policy remains acceptable |
| Filter indexability | M6.1 | Required to prevent duplicate content |
| Primary category selection | M6.3 | Required for deterministic breadcrumbs |
| SEO metadata fields in DB versus generated templates | M6.2 | Existing product fields may be sufficient for launch |
| Image hosting and ownership strategy | M6.2/M6.5 | Required before production seed images |
| Analytics platform | M6.7 | Required before production activation |
| Staging indexing protection | M6.6 | Required before staging deployment |

## 28. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner phase |
| --- | --- | --- | --- | --- |
| Accidental staging indexing | Medium | High | Auth/noindex staging and do not submit sitemap | M6.6 |
| Duplicate content from filters | High | Medium | noindex filtered/sorted URLs and canonical rules | M6.1 |
| Unstable slugs | Medium | High | Stable publication policy and redirect/404 ADR | M6.1 |
| Missing canonical origin | Medium | High | Environment-configured production origin | M6.1 |
| Stale price or stock JSON-LD | Medium | Medium | Generate from server data and cache carefully | M6.3 |
| Fabricated AI content | Medium | High | Human review and no automatic production publishing | M6.4 |
| Copyrighted content reuse | Medium | High | Original summaries and licensing checks | M6.2 |
| Unlicensed images | Medium | High | Owned/licensed/public-domain image policy | M6.2 |
| Private route leakage in sitemap | Low | High | Sitemap eligibility tests | M6.1 |
| Localhost URLs in production metadata | Medium | High | Production config tests | M6.1/M6.7 |
| Poor mobile image performance | Medium | Medium | Image optimization and Lighthouse audit | M6.5 |
| Missing redirect strategy | Medium | Medium | Slug history ADR | M6.1 |
| Schema data does not match visible content | Low | High | Structured-data tests and manual validation | M6.3 |
| Low-value author/publisher pages | Medium | Medium | Implement only with meaningful content | M6.3 |
| Mass-generated thin content | Medium | High | Content quality gate and human review | M6.4 |

## 29. M6 Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| M6.0 - SEO Architecture & Production Readiness Design | Documentation only; current baseline; architecture specification; roadmap; quality gates | CURRENT |
| M6.1 - Technical SEO Foundation | Metadata framework, canonical origin, robots, sitemap, indexability controls, baseline tests | PLANNED |
| M6.2 - SEO-Ready Book Data & Seed Engine | 30-50 books, data quality, deterministic seeding, images, alt text, content validation | PLANNED |
| M6.3 - Structured Data & Internal Discovery | Organization/WebSite, Book/Product/Offer, BreadcrumbList, entity links, related books | PLANNED |
| M6.4 - Content Quality & AI Content Workflow | Optional AI-assisted content, human review, prompt templates, duplicate-content controls | PLANNED |
| M6.5 - Performance SEO & Audit | Image optimization, Core Web Vitals, Lighthouse, accessibility, technical SEO audit | PLANNED |
| M6.6 - Staging Deployment & Closed Beta | Staging deployment, indexing protection, real-device QA, Safari/iOS checks, bug triage | PLANNED |
| M6.7 - Production SEO Activation | Production domain, canonical origin, robots/sitemap, Search Console, analytics, final SEO gate | PLANNED |

## 30. Acceptance Criteria

M6.0 is complete when:

- This SEO architecture specification exists and is grounded in repository evidence.
- Current and planned states are separated.
- Indexability matrix is complete.
- Metadata, canonical, robots, sitemap, structured-data, breadcrumb, internal-linking,
  image, search/filter/pagination, and content strategies are documented.
- SEO testing strategy and quality gate are documented.
- ADR candidates and risk register are documented.
- Roadmap and project memory are updated without starting M6.1.
- No application code, schema, dependency, lockfile, migration, environment, seed, or
  database change is made.

## 31. Open Questions

1. Should RoSach add a slug history redirect table in M6, or preserve the current
   approved 404/no-reuse behavior for old slugs?
2. Should author and publisher pages be implemented in M6, or remain API-only until
   there is enough meaningful content?
3. Should deep pagination self-canonicalize or canonicalize to page one for launch?
4. Should filtered catalog URLs ever become curated indexable SEO landing pages?
5. Should SEO metadata overrides remain only on Product, or should Category, Author,
   and Publisher receive override fields in a future schema phase?
6. Which analytics platform and consent model should RoSach use before production?
7. What is the approved production domain and canonical origin?
8. What image-source policy is approved for the 30-50 book seed dataset?

## 32. Change Log

| Date | Change |
| --- | --- |
| 2026-07-20 | Created official M6.0 SEO architecture specification. No application code, schema, dependency, seed, or database changes. |
| 2026-07-20 | M6.1A implemented the framework-agnostic SEO Core Platform under `apps/web/lib/seo`; page-level activation remains planned for later M6 packages. |
| 2026-07-20 | M6.1A-R1 remediated SEO core contract gaps: production origin fails safely, four-level issue severity is implemented, public exports are narrowed, and acceptance tests were expanded. |
| 2026-07-20 | M6.1A-R2 remediated severity semantics and fallback diagnostics: BLOCKER-only output prevention, MAJOR quality-gate failure with downgraded output, retained INFO fallback issues, and production local-origin asset checks. |
| 2026-07-20 | M6.1B integrated Next.js Metadata generation for approved page types through the SEO Descriptor pipeline and adapter; robots, sitemap, JSON-LD, schema, dependencies, seed data, and UI behavior remained unchanged. |
| 2026-07-20 | M6.1C implemented canonical and robots policy: catalog query URLs are noindex/follow with `/san-pham` canonical, private/auth/transactional/account/404 routes are noindex/nofollow, Admin routes add noarchive, and `robots.ts` disallows private crawler areas while preserving sitemap exposure. |
| 2026-07-20 | M6.1D implemented the Sitemap Framework under `apps/web/lib/seo/sitemap`: typed providers, builder orchestration, normalization, deduplication, sorting, reusable validation, and a small Next.js sitemap route. |
| 2026-07-20 | M6.1D-R1 remediated sitemap review findings: validation now runs before deduplication, sitemap root exports are narrowed, configuration reuses `seoConfigFromEnvironment`, provider failures emit diagnostics, severity mapping is aligned, and review-requested tests were added. |
| 2026-07-20 | M6.1E-R2 added cross-asset SEO regression coverage for metadata, canonical URLs, robots route policy, sitemap eligibility, catalog query canonicalization, and production-origin consistency. |
| 2026-07-20 | M6.1F-2 migrated product detail Product, Book, and Offer JSON-LD onto the Structured Data Platform; manual page-level schema construction and serialization were removed. |
| 2026-07-20 | M6.1F-3 completed SEO Platform RC1 architecture documentation for global knowledge graph schemas, KnowledgeGraphAssembler responsibilities, cross-asset validation, graph validation, extension guidance, ADR summary, and platform lifecycle. |
