# M7.2A Sitemap And Robots Audit

Status: M7.2B IMPLEMENTATION CLOSURE UPDATED

## Scope

Reviewed:

- `apps/web/app/robots.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/lib/seo/sitemap/*`
- SEO route policy and sitemap regression tests

## Robots Audit

| Check | Status | Evidence | Recommendation |
|---|---|---|---|
| Public crawling allowed | PASS | `robots.ts` returns `allow: '/'`. | Preserve. |
| Admin disallowed | PASS | `robots.ts` disallows `/admin/`. | Preserve. |
| Account disallowed | PASS | `robots.ts` disallows `/tai-khoan/`. | Preserve. |
| Cart disallowed | PASS | `robots.ts` disallows `/gio-hang`. | Preserve. |
| Checkout disallowed | PASS | `robots.ts` disallows `/thanh-toan/`. | Preserve. |
| Auth routes disallowed | PASS | Login/register/forgot/reset are disallowed. | Preserve. |
| Sitemap exposed when indexing enabled | PASS | `robots.ts` adds `${origin}/sitemap.xml` only when indexing is enabled. | Preserve. |
| API disallow | WARN | No `/api` disallow in web robots, but the API is served by separate local backend origin, not Next.js app route. | Add only if a future web-origin API route exists. |
| Search crawl blocking | PASS | `/san-pham` query URLs are not blocked by robots; page metadata handles noindex/follow. | Preserve because robots blocking does not replace noindex. |

## Robots Metadata Audit

| Route Class | Status | Evidence |
|---|---|---|
| Public clean routes | PASS | Home/catalog/category/product/promotion descriptors are indexable when valid and indexing enabled. |
| Catalog query/filter/page states | PASS | `catalogDescriptor()` marks meaningful query states noindex/follow. |
| Missing resources/404 | PASS | Missing product/category and not-found descriptors are noindex/nofollow. |
| Cart/checkout/success | PASS | Descriptors are noindex/nofollow. |
| Account/auth | PASS | Account and auth descriptors are noindex/nofollow. |
| Admin | PASS | Admin descriptor is noindex/nofollow/noarchive. |

## Sitemap Audit

| Sitemap Source | Included URLs | Status | Evidence |
|---|---|---|---|
| Static provider | `/`, `/san-pham`, `/danh-muc` | PASS | `static-provider.ts` |
| Promotion provider | `/khuyen-mai` | PASS | `promotion-provider.ts` |
| Category provider | `/danh-muc/[slug]` from API categories | PASS | `category-provider.ts` |
| Book provider | `/sach/[slug]` from API products | PASS | `book-provider.ts` |
| Private/auth/admin/account/cart/checkout | Excluded | PASS | Not present in providers; regression tests assert forbidden prefixes absent. |
| Query/filter/search pages | Excluded | PASS | Providers emit clean URLs only. |
| Policy/contact pages | Not included | ACCEPTED DEFERRED | Routes are not implemented in current app. Add only when routes exist. |
| Author/publisher detail | Not included | ACCEPTED DEFERRED | Routes are deferred/absent. Add only if future routes are approved. |

## Sitemap Quality

| Check | Status | Evidence | Recommendation |
|---|---|---|---|
| Absolute URLs | PASS | Builder normalizes entries through configured origin. | Preserve. |
| Deduplication | PASS | Builder validates duplicates before dedupe and sorts final URLs. | Preserve. |
| Query/fragment exclusion | PASS | Sitemap regression tests check clean URL output. | Preserve. |
| Priority | PASS | Static/category/book providers provide valid priority values. | Preserve. |
| Change frequency | PASS | Providers provide valid values. | Preserve. |
| `lastModified` | WARN / DEFERRED | Providers do not provide `lastModified`; validation reports missing value as INFO. | Implement only if a reliable public timestamp exists. Do not use `new Date()` per request, fake timestamps, or API contract changes solely for this field. |
| Provider failure behavior | WARN | Builder preserves generation and emits MAJOR diagnostics for provider failure. | Defer visible diagnostics certification to P4 or M7.5 unless Technical Lead expands gate scope. |

## `lastModified` Policy

M7.2B must not implement `lastModified` cosmetically.

Allowed:

- Use an existing reliable public timestamp from product/category/read-model data.
- Preserve deterministic values that reflect actual content updates.
- Add tests proving sitemap entries do not change on every request.

Not allowed:

- `new Date()` for every sitemap request.
- Fake static timestamps.
- Timestamp guessing from unrelated data.
- API contract changes solely to manufacture `lastModified`.
- Marking the absence as blocking when no reliable public timestamp exists.

If no trustworthy timestamp is available, mark sitemap `lastModified` as DEFERRED.

## Environment Boundary

`seoRuntimeConfigFromEnvironment()`:

- defaults development/test origin to `http://localhost:3000`;
- requires explicit production origin outside local production build fallback;
- uses `https://rosach.invalid` with indexing disabled during local production build without public origin.

This is PASS for local-only M7.2A. `rosach.vn` occurrences are tests fixtures and are not active runtime configuration.

## Findings

| Severity | Finding | File | Route | Priority | M7.2B Action |
|---|---|---|---|---|---|
| Medium / Deferred if no source | Sitemap entries lack `lastModified`. | `apps/web/lib/seo/sitemap/providers/*` | sitemap | P2 only if reliable timestamp exists | Add timestamp source only if API/read model already exposes reliable public update time; otherwise defer. |
| Low | Sitemap provider diagnostics are not visibly audited at runtime. | `apps/web/lib/seo/sitemap/builder.ts` | `/sitemap.xml` | P4 / M7.5 | Consider a certification command later; not required for M7.2B core scope. |
| Low | API disallow is not present in web robots. | `apps/web/app/robots.ts` | `/robots.txt` | P4 | Add only if API moves under web origin. |

## M7.2B Resolution

| Finding | Resolution Status | Change | Code Evidence | Test Evidence | Remaining Limitation |
|---|---|---|---|---|---|
| Sitemap entries lack `lastModified` | DEFERRED | No implementation added because current product/category DTOs do not expose reliable public update timestamps. | `apps/web/services/catalog-client.ts` has no public `updatedAt`; sitemap providers unchanged. | Sitemap regression tests remain valid; no fake freshness was introduced. | Add only if a later API/read-model exposes trustworthy public timestamps. |
| Sitemap provider diagnostics not certified as runtime command | DEFERRED | No diagnostics command added in M7.2B. | No source change by design. | Existing sitemap builder/provider tests remain applicable. | P4 or M7.5 certification scope. |
| API disallow absent in web robots | DEFERRED | No robots change because API remains a separate local backend origin, not a Next.js app route. | `apps/web/app/robots.ts` unchanged. | Route-policy tests remain applicable. | Add only if API moves under web origin. |

## `lastModified` Closure Decision

M7.2B intentionally did not add `lastModified`.

Rejected approaches:

- `new Date()` on every sitemap request.
- Fake static timestamps.
- Timestamp guesses from unrelated fields.
- Backend API or Prisma schema changes solely to feed sitemap freshness.

Accepted decision:

- Keep sitemap entries deterministic without `lastModified`.
- Revisit in a later milestone only when catalog/category public update timestamps are available as part of the approved API/read-model contract.
