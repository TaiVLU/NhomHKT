# M7.2B Teacher SEO Checklist Compliance

Status: READY FOR TECHNICAL LEAD REVIEW

Source rubric: Teacher checklist, Chapter 8 - SEO Audit Checklist.

Checklist sheets covered:

1. Technical SEO
2. Onpage SEO
3. Offpage SEO
4. Common Tools

Important interpretation:

- The teacher checklist is a rubric, not every row is a source-code implementation requirement.
- External deployment, marketing, real business data, and paid-tool criteria are not marked as source-code FAIL.
- RoSach remains local-only. No public deployment, analytics, Search Console verification, backlink campaign, social profile creation, or Google Maps listing was performed.

## Summary Count

| Final Status | Count |
|---|---:|
| PASS | 27 |
| PARTIAL | 8 |
| WARN | 3 |
| FAIL | 0 |
| DEFERRED | 4 |
| NOT APPLICABLE | 4 |
| OUT OF CODE SCOPE | 10 |
| REQUIRES PUBLIC DEPLOYMENT | 13 |
| REQUIRES REAL BUSINESS DATA | 4 |
| REQUIRES MARKETING ACTIVITY | 4 |

Total checklist rows: 77.

## Technical SEO

| ID | Category | Teacher Criterion | Applicability | Current Status | Evidence | Action | Milestone | Final Status |
|---|---|---|---|---|---|---|---|---|
| TSEO-01 | Technical SEO | Desktop PageSpeed > 60 | Conditional | DEFERRED | No public URL; no PageSpeed tooling installed by repo. Build passes. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-02 | Technical SEO | Mobile loading GOOD or under five seconds | Conditional | DEFERRED | No public URL; local mobile UX evidence exists in M7.1 docs. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-03 | Technical SEO | Page load under three to five seconds | Conditional | DEFERRED | M7.2B does not perform performance optimization; `npm run build` passes. | DEFER TO M7.3 | M7.3 | DEFERRED |
| TSEO-04 | Technical SEO | Mobile viewport configuration | Applicable | PASS | `apps/web/app/layout.tsx` exports viewport with `width=device-width`, `initialScale=1`; no zoom lock. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| TSEO-05 | Technical SEO | Mobile-friendly route rendering | Applicable | PARTIAL | M7.1 runtime/browser audit; M7.2B source/test verification; no new visual redesign. | VERIFY IN M7.2B | M7.2B | PARTIAL |
| TSEO-06 | Technical SEO | Public Google mobile-friendly verification | Conditional | DEFERRED | Local-only app has no public URL. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-07 | Technical SEO | www/non-www canonical host | Conditional | DEFERRED | No production domain; SEO config supports one origin through `seoRuntimeConfigFromEnvironment()`. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-08 | Technical SEO | SSL/HTTPS | Conditional | DEFERRED | Local development uses HTTP; no public deployment. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-09 | Technical SEO | Robots.txt policy | Applicable | PASS | `apps/web/app/robots.ts`; `tests/seo/route-policy.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| TSEO-10 | Technical SEO | Sitemap public clean routes | Applicable | PASS | `apps/web/lib/seo/sitemap/providers/*`; `tests/seo/sitemap-regression.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| TSEO-11 | Technical SEO | Sitemap lastModified | Conditional | DEFERRED | `apps/web/services/catalog-client.ts` exposes no reliable public timestamp. | NO ACTION | N/A | DEFERRED |
| TSEO-12 | Technical SEO | Google Search Console sitemap submission | Conditional | DEFERRED | Requires public property and owner access. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-13 | Technical SEO | 404 and route/asset integrity | Applicable | PASS | `apps/web/app/not-found.tsx`; `tests/seo/on-page-compliance.test.ts`; local assets exist. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| TSEO-14 | Technical SEO | Full public broken-link crawl | Conditional | DEFERRED | No public deployment/crawler run. Code-level route integrity tested. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-15 | Technical SEO | Redirect inventory and canonical target | Applicable | PASS | `apps/web/next.config.ts` redirects `/san-pham/:slug` to `/sach/:slug`, permanent. | VERIFY IN M7.2B | M7.2B | PASS |
| TSEO-16 | Technical SEO | Product/Book/Offer structured data | Applicable | PASS | `apps/web/app/sach/[slug]/page.tsx`; `tests/seo/structured-data-regression.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| TSEO-17 | Technical SEO | Organization/WebSite/BreadcrumbList structured data | Applicable | PASS | `apps/web/app/page.tsx`, `sach/[slug]`, `danh-muc/[slug]`; route tests. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| TSEO-18 | Technical SEO | CollectionPage/ItemList structured data | Conditional | PARTIAL | Active for stable catalog/category routes only; query/filter states remain noindex. | IMPLEMENT IN M7.2B | M7.2B | PARTIAL |
| TSEO-19 | Technical SEO | Avoid unsupported/fake schema | Applicable | PASS | No SearchAction, FAQ, Review, AggregateRating, or LocalBusiness added. Product tests assert no fake rating/review. | VERIFY IN M7.2B | M7.2B | PASS |
| TSEO-20 | Technical SEO | Analytics and Search Console | Conditional | DEFERRED | No public domain, owner consent, or tracking decision. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TSEO-21 | Technical SEO | DMCA badge | Not Applicable | OUT OF CODE SCOPE | Optional legal/business decision, not technical SEO core. | NO ACTION | N/A | NOT APPLICABLE |
| TSEO-22 | Technical SEO | Google Maps / LocalBusiness | External Activity | OUT OF CODE SCOPE | No approved public address, telephone, location, or Google Business Profile. | MARKETING ACTIVITY | Marketing | REQUIRES REAL BUSINESS DATA |
| TSEO-23 | Technical SEO | Site architecture / route depth | Applicable | PASS | Header, homepage sections, catalog, categories, product cards, breadcrumbs, related products. | VERIFY IN M7.2B | M7.2B | PASS |

## Onpage SEO

| ID | Category | Teacher Criterion | Applicability | Current Status | Evidence | Action | Milestone | Final Status |
|---|---|---|---|---|---|---|---|---|
| ONPAGE-01 | Onpage SEO | Keyword strategy by page type | Conditional | PARTIAL | Route intent matrix in this doc; no fake Ahrefs volume. | VERIFY IN M7.2B | M7.2B | PARTIAL |
| ONPAGE-02 | Onpage SEO | Do not fabricate keyword tool data | Applicable | PASS | No search volume, keyword difficulty, or ranking claim added. | NO ACTION | N/A | PASS |
| ONPAGE-03 | Onpage SEO | Cannibalization check | Applicable | PASS | Product/category titles are dynamic; query catalog states noindex. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-04 | Onpage SEO | Clean semantic URLs | Applicable | PASS | `/`, `/san-pham`, `/danh-muc`, `/danh-muc/[slug]`, `/sach/[slug]`, `/khuyen-mai`. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-05 | Onpage SEO | URL length under guideline | Conditional | WARN | Current slugs are data-owned; no slug migration in M7.2B. | NO ACTION | N/A | WARN |
| ONPAGE-06 | Onpage SEO | Meta title unique and entity-driven | Applicable | PASS | Metadata route tests and `tests/seo/metadata-regression.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-07 | Onpage SEO | Meta title around 50-65 characters | Conditional | WARN | Guideline only; some route titles are shorter but meaningful. | NO ACTION | N/A | WARN |
| ONPAGE-08 | Onpage SEO | Meta description unique and meaningful | Applicable | PASS | SEO Descriptor fallbacks and route descriptors. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-09 | Onpage SEO | Meta description around 140-165 characters | Conditional | WARN | Guideline only; no meaningless padding added. | NO ACTION | N/A | WARN |
| ONPAGE-10 | Onpage SEO | Body content by page type | Applicable | PASS | Home/catalog/category/product/promotion route content exists. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-11 | Onpage SEO | No fake or keyword-stuffed content | Applicable | PASS | No content stuffing or fake content added. | NO ACTION | N/A | PASS |
| ONPAGE-12 | Onpage SEO | Content quality and data completeness | Conditional | PARTIAL | M7.1 docs record remaining product/content data debt. | DEFER TO M7.3 | M7.3 | PARTIAL |
| ONPAGE-13 | Onpage SEO | Video/multimedia | Not Applicable | OUT OF CODE SCOPE | Video is optional for bookstore catalog. Images/social preview satisfy current multimedia scope. | NO ACTION | N/A | NOT APPLICABLE |
| ONPAGE-14 | Onpage SEO | Meaningful image alt | Applicable | PASS | `ProductImage` receives product alt/name; `tests/seo/on-page-compliance.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-15 | Onpage SEO | Image fallback works | Applicable | PASS | `apps/web/features/catalog/product-image.tsx`; fallback asset exists. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-16 | Onpage SEO | Local OG/Twitter fallback | Applicable | PASS | `apps/web/public/social-preview.png`; `site-identity.test.ts`. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| ONPAGE-17 | Onpage SEO | Image width/height/layout behavior | Conditional | PARTIAL | Next Image layout used; social preview PNG is 1200x630 and emits OG width/height; product image dimensions remain data/contract dependent. | DEFER TO M7.3 | M7.3 | PARTIAL |
| ONPAGE-18 | Onpage SEO | Heading structure | Applicable | PASS | `tests/seo/on-page-compliance.test.ts`; M7.1 typography docs. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-19 | Onpage SEO | CTA semantics and route validity | Applicable | PASS | Product cards, hero CTAs, cart/checkout links; on-page test checks canonical product links. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-20 | Onpage SEO | Social preview metadata | Applicable | PASS | OG/Twitter generated by SEO Platform; local fallback added. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| ONPAGE-21 | Onpage SEO | Social share buttons | Not Applicable | OUT OF CODE SCOPE | Optional UX/social feature, not M7.2B requirement. | NO ACTION | N/A | NOT APPLICABLE |
| ONPAGE-22 | Onpage SEO | Comment box | Not Applicable | OUT OF CODE SCOPE | Reviews/comments are separate inactive scope; no third-party plugin added. | NO ACTION | N/A | NOT APPLICABLE |
| ONPAGE-23 | Onpage SEO | Related products | Conditional | PARTIAL | Product detail renders `relatedProducts` when API data supports it. | VERIFY IN M7.2B | M7.2B | PARTIAL |
| ONPAGE-24 | Onpage SEO | Internal links | Applicable | PASS | Header/footer/home/category/product/breadcrumb/CTA links; `on-page-compliance.test.ts`. | VERIFY IN M7.2B | M7.2B | PASS |
| ONPAGE-25 | Onpage SEO | Breadcrumb UI and schema alignment | Applicable | PASS | Visible breadcrumbs and BreadcrumbList JSON-LD on product/category detail. | IMPLEMENT IN M7.2B | M7.2B | PASS |
| ONPAGE-26 | Onpage SEO | Local business information | External Activity | OUT OF CODE SCOPE | No approved address/phone/location. | MARKETING ACTIVITY | Marketing | REQUIRES REAL BUSINESS DATA |
| ONPAGE-27 | Onpage SEO | User experience | Applicable | PARTIAL | M7.1A/M7.1B docs; no redesign in M7.2B. | VERIFY IN M7.2B | M7.2B | PARTIAL |
| ONPAGE-28 | Onpage SEO | Performance-related UX | Conditional | DEFERRED | M7.2B records baseline only; optimization belongs to M7.3. | DEFER TO M7.3 | M7.3 | DEFERRED |

### Route Keyword Intent Matrix

| Route Class | Intent |
|---|---|
| `/` | RoSach brand, online bookstore discovery. |
| `/san-pham` | Book catalog, browse/search/filter books. |
| `/danh-muc` | Browse book categories. |
| `/danh-muc/[slug]` | Books in a specific category. |
| `/sach/[slug]` | Specific book name, author/publisher/product purchase intent. |
| `/khuyen-mai` | Book promotions and offer updates. |
| Query catalog states | User navigation/filtering only; noindex to avoid cannibalization. |

## Offpage SEO

| ID | Category | Teacher Criterion | Applicability | Current Status | Evidence | Action | Milestone | Final Status |
|---|---|---|---|---|---|---|---|---|
| OFFPAGE-01 | Offpage SEO | Backlink quantity | External Activity | OUT OF CODE SCOPE | Requires public domain and marketing campaign. | MARKETING ACTIVITY | Marketing | REQUIRES MARKETING ACTIVITY |
| OFFPAGE-02 | Offpage SEO | Backlink quality | External Activity | OUT OF CODE SCOPE | Cannot be created safely in source code. | MARKETING ACTIVITY | Marketing | REQUIRES MARKETING ACTIVITY |
| OFFPAGE-03 | Offpage SEO | Social presence/accounts | External Activity | OUT OF CODE SCOPE | Requires official owner-approved accounts. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |
| OFFPAGE-04 | Offpage SEO | Social engagement | External Activity | OUT OF CODE SCOPE | Requires real public audience and marketing activity. | MARKETING ACTIVITY | Marketing | REQUIRES MARKETING ACTIVITY |
| OFFPAGE-05 | Offpage SEO | Google Business Profile | External Activity | OUT OF CODE SCOPE | Requires real business ownership/address. | MARKETING ACTIVITY | Marketing | REQUIRES REAL BUSINESS DATA |
| OFFPAGE-06 | Offpage SEO | Google Maps listing | External Activity | OUT OF CODE SCOPE | Requires real address/location; no LocalBusiness schema added. | MARKETING ACTIVITY | Marketing | REQUIRES REAL BUSINESS DATA |
| OFFPAGE-07 | Offpage SEO | Local citations | External Activity | OUT OF CODE SCOPE | Requires real business data and marketing/operations work. | MARKETING ACTIVITY | Marketing | REQUIRES MARKETING ACTIVITY |
| OFFPAGE-08 | Offpage SEO | Ranking/traffic claims | External Activity | OUT OF CODE SCOPE | No public deployment or analytics data. | NO ACTION | N/A | OUT OF CODE SCOPE |
| OFFPAGE-09 | Offpage SEO | DR/DA authority metrics | External Activity | OUT OF CODE SCOPE | Paid/external tools only; no source-code criterion. | NO ACTION | N/A | OUT OF CODE SCOPE |
| OFFPAGE-10 | Offpage SEO | Offpage source-code implementation | Not Applicable | OUT OF CODE SCOPE | M7.2B must not create fake backlinks/profiles. | NO ACTION | N/A | OUT OF CODE SCOPE |

## Common Tools

| ID | Category | Teacher Criterion | Applicability | Current Status | Evidence | Action | Milestone | Final Status |
|---|---|---|---|---|---|---|---|---|
| TOOL-01 | Tools | Source inspection | Applicable | PASS | Code/docs inspected; implementation files listed in docs 65-71. | VERIFY IN M7.2B | M7.2B | PASS |
| TOOL-02 | Tools | Existing tests | Applicable | PASS | `npm run test` PASS, 60 files / 292 tests. | VERIFY IN M7.2B | M7.2B | PASS |
| TOOL-03 | Tools | Build/lint/type-check | Applicable | PASS | `format:check`, `lint`, `type-check`, `build` PASS. | VERIFY IN M7.2B | M7.2B | PASS |
| TOOL-04 | Tools | Browser/local inspection | Applicable | PARTIAL | M7.1 runtime/browser evidence; M7.2B code/test checks. | VERIFY IN M7.2B | M7.2B | PARTIAL |
| TOOL-05 | Tools | Local Lighthouse if available | Conditional | DEFERRED | No repo Lighthouse script/package; no package installed. | DEFER TO M7.3 | M7.3 | DEFERRED |
| TOOL-06 | Tools | Google Search Console | Conditional | DEFERRED | Requires public domain/property and owner access. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TOOL-07 | Tools | Google Analytics real traffic | Conditional | DEFERRED | Requires public deployment, owner consent, privacy/config decision. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TOOL-08 | Tools | Public PageSpeed Insights | Conditional | DEFERRED | Requires public URL. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TOOL-09 | Tools | Social preview validators | Conditional | DEFERRED | Facebook/Slack/Discord/LinkedIn validators cannot fetch localhost. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TOOL-10 | Tools | Public structured-data URL test | Conditional | DEFERRED | Code-level structured-data tests pass; public URL validation requires deployment. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | REQUIRES PUBLIC DEPLOYMENT |
| TOOL-11 | Tools | Ahrefs | External Activity | OUT OF CODE SCOPE | Paid/external marketing tool; no fake metrics added. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |
| TOOL-12 | Tools | SEMrush | External Activity | OUT OF CODE SCOPE | Paid/external marketing tool. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |
| TOOL-13 | Tools | Moz | External Activity | OUT OF CODE SCOPE | Paid/external marketing tool. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |
| TOOL-14 | Tools | Majestic | External Activity | OUT OF CODE SCOPE | Paid/external backlink tool. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |
| TOOL-15 | Tools | Screaming Frog | External Activity | OUT OF CODE SCOPE | Optional post-deployment crawl; not installed in M7.2B. | DEFER TO M7.5/DEPLOYMENT | Post-deployment | OUT OF CODE SCOPE |
| TOOL-16 | Tools | Rank trackers / agency dashboards | External Activity | OUT OF CODE SCOPE | Requires public ranking data and external accounts. | MARKETING ACTIVITY | Marketing | OUT OF CODE SCOPE |

## Deployment Acceptance Notes

When RoSach reaches a deployment milestone, the Technical Lead should require:

- choose one canonical host;
- redirect the other host with permanent redirect;
- enforce HTTPS and HTTP to HTTPS redirect;
- ensure canonical, OG, sitemap, and robots use the same HTTPS origin;
- create Search Console property;
- submit sitemap;
- decide analytics/privacy/consent strategy;
- validate public PageSpeed/mobile/social preview/structured-data URLs;
- run a public crawl for broken links and redirect chains.

## Final Decision

The teacher checklist has been aligned without turning external/deployment/marketing items into false code failures. M7.2B has zero remaining source-code FAIL items in this matrix.
