# M7 SEO Design Principles

Status: M7.2B IMPLEMENTATION CLOSURE UPDATED

## Purpose

M7 SEO work must improve technical discoverability without changing Commerce Core, checkout, inventory, order snapshot, cart policy, or local-only graduation boundaries.

RoSach remains local-only during this audit:

- Web: `http://localhost:3000`
- API: `http://127.0.0.1:4000/api/v1`
- Database: local SQL Server through Prisma
- No public deployment or active `rosach.vn` runtime configuration is certified by M7.2A.

## Locked SEO Ownership

SEO assets should continue to flow through the existing SEO Platform:

`SEODescriptor -> buildSEOAssets() -> toNextMetadata() -> Next.js generateMetadata()`

Evidence:

- `apps/web/lib/seo/core/descriptor.ts`
- `apps/web/lib/seo/core/pipeline.ts`
- `apps/web/lib/seo/adapters/next-metadata-adapter.ts`
- `apps/web/lib/seo/metadata.ts`

## Principles

| Principle | Requirement | Why |
|---|---|---|
| Platform-owned SEO | Page metadata, canonical, Open Graph, Twitter, sitemap eligibility, and structured data must be generated through the SEO Platform. | Prevent route-by-route drift and duplicated SEO rules. |
| Local-only honesty | Development SEO may use localhost; production SEO must fail closed unless a real origin is configured. | Avoid accidentally certifying an unsupported public domain. |
| No fabricated facts | Structured data must use actual catalog/category/product data only. | Search engines and AI search systems should not receive invented ratings, policies, or availability. |
| Public/private split | Public pages may be indexable; cart, checkout, account, auth, admin, API, and error states must remain noindex or disallowed as appropriate. | Prevent leaking private or transactional surfaces. |
| Canonical stability | Clean public URLs are canonical; query/search/filter/pagination states should not create duplicate canonical identities unless explicitly approved. | Reduce duplicate-content risk. |
| Structured data consistency | JSON-LD URLs, image URLs, canonical URLs, Open Graph, and Twitter assets must agree. | Prevent search preview and AI extraction conflicts. |
| Sitemap restraint | Sitemap must include only implemented public canonical routes. | Avoid submitting 404, private, or deferred routes. |
| Image fallback honesty | Placeholder or external cover images may be used locally, but audit findings must distinguish stable local assets from external Open Library assets. | Social preview and image SEO quality depend on reliable imagery. |
| M7 AI alignment | AI Receptionist should use canonical product/category URLs and visible public facts only. | Keeps AI read-only and customer-supportive. |

## Non-Goals For M7.2A

- No metadata implementation changes.
- No robots or sitemap changes.
- No structured-data changes.
- No route creation.
- No source code, CSS, UI, API, database, package, migration, commit, or push changes.
- No chatbot, recommendation AI, semantic search, performance optimization, or public deployment.

## M7.2B Planning Guardrails

M7.2B may implement fixes only after Technical Lead review. Priority should be:

1. Close active technical SEO gaps that create WARN/FAIL findings.
2. Keep all route behavior and Commerce Core boundaries intact.
3. Add regression tests for every SEO contract changed.
4. Preserve local-only examples unless a later deployment milestone approves public runtime configuration.

## M7.2B Closure Notes

The M7.2B implementation followed these guardrails:

- canonical, robots, Open Graph, Twitter, sitemap eligibility, and JSON-LD stayed behind the SEO Descriptor Platform;
- site identity assets were added locally without public-domain configuration;
- Organization/WebSite graph is activated once on the homepage rather than globally in the root layout;
- private, account, checkout, cart, and admin routes remain noindex or disallowed as already designed;
- sitemap `lastModified` remains deferred because no reliable public timestamp exists in the current DTO/API contract;
- no SearchAction, FAQ, Review, AggregateRating, AI, chatbot, analytics, package, API, database, or Commerce Core changes were introduced.
