# M7.2A Social Preview Audit

Status: M7.2B IMPLEMENTATION CLOSURE UPDATED

## Scope

Reviewed Open Graph, Twitter Card, preview images, and local-only external preview limitations.

Primary files:

- `apps/web/lib/seo/adapters/next-metadata-adapter.ts`
- `apps/web/lib/seo/core/asset-factory.ts`
- `apps/web/lib/seo/core/config.ts`
- `apps/web/app/*/page.tsx`
- `apps/web/tests/seo/metadata-regression.test.ts`
- `apps/web/tests/seo/cross-asset.test.ts`

## Open Graph Audit

| Check | Status | Evidence | Recommendation |
|---|---|---|---|
| `og:title` | PASS | Adapter maps `asset.openGraph.title` from descriptor title. | Preserve. |
| `og:description` | PASS | Adapter maps descriptor description. | Preserve. |
| `og:url` | PASS | Asset factory sets OG URL to canonical URL. | Preserve. |
| `og:type` | PASS | Product/book descriptors map to `article`; others map to `website`. | Preserve or revisit product `article` vs `website/product` limits later. |
| `og:locale` | PASS | Default locale is `vi_VN`. | Preserve. |
| `og:site_name` | PASS | Adapter maps `siteName`. | Preserve. |
| `og:image` | WARN | Product image or `/book-placeholder.svg` fallback is used; many images depend on Open Library/local placeholder. | Improve owned/social image strategy in M7.2B or later asset milestone. |
| Image dimensions | WARN | OG image objects include URL/alt only; no explicit width/height found. | Add if local assets provide stable dimensions. |

## Twitter Card Audit

| Check | Status | Evidence | Recommendation |
|---|---|---|---|
| `twitter:card` | PASS | Asset factory uses `summary_large_image`. | Preserve. |
| `twitter:title` | PASS | Adapter maps title from same SEO asset. | Preserve. |
| `twitter:description` | PASS | Adapter maps description from same SEO asset. | Preserve. |
| `twitter:image` | WARN | Uses same image URL as OG; image quality depends on product/placeholder source. | Improve image strategy. |
| `twitter:site` / creator | WARN | No Twitter handle metadata found. | Defer unless project has real social identity. |

## Platform Consistency

Status: PASS.

Evidence:

- `asset-factory.ts` emits Open Graph and Twitter from one normalized descriptor.
- `cross-asset.test.ts` asserts OG title/description/url and Twitter title/description/images align with metadata/canonical.
- `metadata-regression.test.ts` asserts metadata URLs stay on configured origin in production fixtures.

## Local-Only Preview Limitation

Status: WARN.

RoSach has no public deployment in M7.2A. Therefore Facebook, Messenger, Discord, Slack, LinkedIn, and Twitter external preview validators cannot fetch local pages. Audit can verify local metadata generation and source/test consistency only.

`rosach.vn` appears in SEO tests as production-origin fixtures. It is not an approved active runtime URL.

## Social Channel Matrix

| Channel | Local Metadata Readiness | External Validation | Status |
|---|---|---|---|
| Facebook | OG fields generated | Not possible local-only | WARN |
| Messenger | OG fields generated | Not possible local-only | WARN |
| Discord | OG/Twitter-like preview data generated | Not possible local-only | WARN |
| Slack | OG preview data generated | Not possible local-only | WARN |
| LinkedIn | OG preview data generated | Not possible local-only | WARN |
| Twitter/X | Twitter Card fields generated | Not possible local-only | WARN |

## Findings

| Severity | Finding | File | Route | Priority | M7.2B Action |
|---|---|---|---|---|---|
| Medium | Social images rely on product remote images or generic placeholder. | `apps/web/lib/seo/core/asset-factory.ts`, `ProductImage` data | public routes | P2 | Plan stable local/owned OG image assets. |
| Medium | OG image dimensions are not included. | `apps/web/lib/seo/core/descriptor.ts`, adapter | public routes | P3 | Add width/height when asset dimensions are known. |
| Low | No Twitter site/creator handle. | adapter/config | all routes | P4 | Defer unless official social accounts exist. |
| Low | External social preview cannot be verified. | local-only environment | all routes | P4 | Revisit only in deployment milestone. |

## M7.2B Resolution

| Finding | Resolution Status | Change | Code Evidence | Test Evidence | Remaining Limitation |
|---|---|---|---|---|---|
| Social images rely on product remote images or generic placeholder | PARTIALLY FIXED | Default fallback changed from `/book-placeholder.svg` to owned local raster `/social-preview.png`. Product-specific image metadata still uses product data when available. | `apps/web/lib/seo/core/config.ts`, `apps/web/public/social-preview.png` | `apps/web/tests/seo/site-identity.test.ts`; updated catalog metadata regression. | Product covers may still come from remote catalog data; broad image migration is outside M7.2B. |
| OG image dimensions not included in metadata objects | PARTIALLY FIXED | The fallback asset is a 1200x630 PNG and the SEO Platform emits width/height for that fallback. | `apps/web/public/social-preview.png`, `apps/web/lib/seo/core/asset-factory.ts` | `site-identity.test.ts` verifies dimensions and metadata. | Product-specific image dimensions remain data/contract dependent. |
| No Twitter site/creator handle | DEFERRED | No official social identity was added. | No source change by design. | Not applicable. | Requires verified official social accounts. |
| External social preview cannot be verified | DEFERRED | Local-only boundary preserved; no public deployment performed. | No deployment/config change. | Local metadata tests only. | External preview validation belongs to a future deployment milestone. |
