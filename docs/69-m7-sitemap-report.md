# M7.2B Sitemap And Robots Report

Status: VERIFIED; LASTMODIFIED DEFERRED

## Robots Result

| Check | Status | Evidence |
|---|---|---|
| Public routes crawlable | PASS | `apps/web/app/robots.ts` allows `/`. |
| Admin disallowed | PASS | `/admin/`. |
| Account disallowed | PASS | `/tai-khoan/`. |
| Cart disallowed | PASS | `/gio-hang`. |
| Checkout disallowed | PASS | `/thanh-toan/`. |
| Auth/reset routes disallowed | PASS | Login/register/forgot/reset paths. |
| Sitemap exposed only when indexing enabled | PASS | `robots.ts` uses `config.value.indexing.enabled`. |
| API disallow | DEFERRED | Web origin currently has no Next API route; API is a separate local backend origin. |

## Sitemap Result

| Check | Status | Evidence |
|---|---|---|
| Public clean routes included | PASS | Static, promotion, category, and book providers. |
| Absolute URLs | PASS | Sitemap builder uses SEO config origin. |
| No query strings | PASS | Regression tests. |
| No fragments | PASS | Regression tests. |
| No private routes | PASS | Regression tests and provider boundaries. |
| No duplicates | PASS | Builder validation and regression tests. |
| Deterministic ordering | PASS | Builder sorts final URLs. |
| Canonical origin consistency | PASS | Cross-asset regression tests. |
| `lastModified` | DEFERRED | No reliable public timestamp exposed by current web DTO/API. |
| Google Search Console submission | REQUIRES PUBLIC DEPLOYMENT | No public domain. |

## Redirect Inventory

| Source | Destination | Permanent | Status | Evidence |
|---|---|---:|---|---|
| `/san-pham/:slug` | `/sach/:slug` | true | PASS | `apps/web/next.config.ts`; `tests/seo/on-page-compliance.test.ts`. |

No redirect chain or loop was added in M7.2B.

## `lastModified` Decision

M7.2B intentionally does not implement `lastModified`.

Rejected:

- `new Date()` per sitemap request.
- Fake static timestamps.
- Timestamp guessing from unrelated data.
- API or Prisma change solely for sitemap freshness.

Accepted:

- Keep sitemap deterministic.
- Revisit only when public product/category update timestamps are approved in the read model/API.

## Tests

- `apps/web/tests/seo/sitemap-regression.test.ts`
- `apps/web/app/sitemap.test.ts`
- `apps/web/tests/seo/route-policy.test.ts`
- `apps/web/tests/seo/on-page-compliance.test.ts`

## Remaining Limitations

- Full public crawler validation belongs to M7.5 or post-deployment.
- Search Console sitemap submission requires public deployment.
