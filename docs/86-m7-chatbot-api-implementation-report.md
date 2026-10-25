# M7.4B-1 RoSach Chatbot API Foundation Implementation Report

Status: implementation complete; awaiting final Technical Lead review.

## Delivered

- Public, read-only `POST /api/v1/chatbot/search` route with no auth, cookie, session, private-data, schema, or migration dependency.
- Strict Zod request validation and six stable public error codes, with `CHATBOT_NO_RESULTS` reserved while valid empty searches return a successful flattened response.
- Deterministic Vietnamese parser covering all 12 approved intents and the approved price vocabulary while excluding non-price numeric forms.
- Product discovery through `CatalogService.publicProducts()` only, with approved category/author/publisher/price/availability parameters and at most three public results.
- Flattened Typebot v1 DTO with stable product slots, null missing slots, public-safe availability, backend-owned image values, and canonical `/sach/{slug}` URLs.
- Dedicated 30 requests/minute limiter and bounded catalog lookup timeout.
- Focused unit and API coverage for parsing, validation, public DTOs, no-query guide behavior, timeout/upstream failures, leakage, and route-isolated throttling.

## Security posture

The implementation does not expose internal IDs, exact stock, raw catalog records, credentials, cookies, SQL/Prisma details, stacks, paths, or secrets. Global CORS was not loosened. Typebot server-side HTTP requests do not require browser CORS, and future embed work must retain the approved origin policy.

## Scope exclusions

No Typebot widget or final publish, LLM, AI key, database schema/migration, Commerce Core change, customer/cart/order/account/admin access, dashboard, deployment, package installation, commit, or push belongs to this implementation.

## Verification

Focused API type-check and 59 chatbot tests passed before the root gates. Final command results are recorded in the Technical Lead closure report for this work package.

## M7.4C cross-reference

The website integration consumes this API without changing its contract. Typebot maps success fields below `data.*`, maps public failure text from `error.message`, and treats no-results as HTTP 200 with `data.resultCount = 0`. The complete flow and embed evidence is recorded in document 87.
