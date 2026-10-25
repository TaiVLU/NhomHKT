# M7.4B Chatbot Threat Model and Test Plan

## Controls and evidence

| Threat | Implemented control | Automated evidence |
|---|---|---|
| Prompt injection or hallucination | Deterministic parser only; no LLM or AI key | All 12 intents and injection-like input |
| URL spoofing and unsafe input | Strict Zod object, backend-owned canonical URLs | Unknown fields, arbitrary URL, SQL-like text, token and ID-field rejection |
| Oversized or malformed input | 500-character message limit and typed bounded filters | Empty, whitespace, wrong source/type, invalid range, oversized body |
| Price ambiguity | Context-aware Vietnamese VND parser | Nine approved positive forms plus ISBN/year/quantity/phone/code negatives |
| Scraping and resource exhaustion | Dedicated 30/minute rate limit, 3-second catalog timeout, maximum 3 results | Deterministic 31st-request 429 and timeout mapping |
| Private or internal leakage | Public CatalogService boundary and explicit flattened DTO | No array, internal IDs, stock quantity, raw SQL/Prisma error, stack, or secret |
| Stale or non-public products | Catalog Read Model remains price, publication and availability authority | Boundary parameter assertions plus existing catalog integration suite |
| Cross-route throttling | Limiter mounted only on chatbot router | Public catalog probe remains HTTP 200 after chatbot limit |
| Cookie/session exposure | Public route has no auth or credential dependency | API request succeeds without authentication |
| CORS weakening | Existing app-level exact-origin CORS remains unchanged | Source inspection and root regression gates |

## Test layers

- Unit: normalization, intent precedence, all intents, price positives/negatives, strict validation, filters, flattened slots, maximum three results, canonical URL, guide no-query behavior, timeout, and upstream error translation.
- Route/API: public access, success/error envelope, malformed and oversized input, injection-like input, upstream leakage prevention, and endpoint-only rate limiting.
- Existing integration/regression: Catalog Read Model public visibility/sellability constraints, SQL Server behavior, web SEO suite, full root tests, and production build.

## Deferred scope

Typebot widget integration, production flow publishing, browser embed security, deployed-origin CORS verification, public Core Web Vitals, LLMs, private account/order support, dashboard, and deployment remain outside M7.4B-1.

## M7.4C website controls

- The website embed uses the official `@typebot.io/js@0` browser module from jsDelivr without a package dependency.
- Loading is client-only and deferred to browser idle time, with click-triggered initialization as a fallback.
- A stable DOM script ID plus a window singleton prevents duplicate module injection and duplicate initialization across client navigation.
- Missing, disabled, or malformed public bot configuration renders no widget and does not break local development or production rendering.
- The custom launcher has a Vietnamese accessible label, visible keyboard focus, 48px minimum target, safe-area offsets, mobile sizing, and a layer below dialogs/toasts.
- Only the public bot ID is exposed. The embed does not prefill customer, cookie, token, cart, order, account, contact, or payment data.
- Product actions remain backend-owned URLs from the mapped API response. User text is never converted into an external URL or HTML by website code.
- Current global CORS and Next security configuration remain unchanged. A future CSP must allow the exact Typebot module and viewer origins before activation.

M7.4C automated tests cover configuration, disabled behavior, singleton initialization, accessible launch, shell/provider preservation, commerce/Admin route behavior, response-envelope paths, null slots, result counts 0-3, guide responses, public failures, and backend-owned product URLs. Manual Typebot workspace and published embed evidence remains required for M7.4D certification.
