# M7.4A Typebot Architecture and Safety Audit

Status: AUDIT ONLY — no source implementation.

## Decision

Typebot Cloud Free is suitable for a controlled local/demo chatbot, subject to a 200-chats/month cap. Official Typebot material confirms unlimited bots, webhooks/native integrations, custom JS/CSS, and web embed forms; exact retention, region, plan-level analytics, HTTP-array mapping, rate limits, branding, backup/export and any AI entitlement are **UNKNOWN — REQUIRE POC**. Do not require LLM for the minimum demo.

| Capability | Status | Impact |
|---|---|---|
| Visual flow, variables, conditions, webhooks | AVAILABLE | sufficient for deterministic demo |
| Bubble/popup/inline web embed | AVAILABLE | use lazy, feature-flagged bubble only |
| Free allowance | LIMITED: 200 chats/month | demo quota/fallback needed |
| HTTP request and JSON array mapping | UNKNOWN — REQUIRE POC | choose flattened response for v1 |
| AI/API keys | UNKNOWN/avoid | not in minimum scope |
| Privacy, retention, location, backup | UNKNOWN — REQUIRE POC | no private data allowed |

Evidence: official Typebot site states Free includes unlimited typebots, 200 chats/month, native integrations, webhooks and custom JS/CSS; it describes bubble, popup and inline embed modes.

## Current RoSach capability

Public catalog routes already expose `GET /products` (`q`, category, author, publisher, sort, page, pageSize), `GET /products/:slug`, taxonomy lists/details, and search suggestions. Product DTOs contain IDs, price, image, author and canonical slug. API CORS is currently one configured `WEB_ORIGIN` with credentials; public catalog has only suggestions rate limiting. Therefore reuse is safe for a POC but not recommended for Typebot production because it returns unnecessary fields and permits a larger response/page size.

## Architecture options

| Option | Reliability | Privacy | Complexity | Demo |
|---|---:|---:|---:|---:|
| A: Typebot deterministic controls -> catalog API | high | high | low | high |
| B: text -> dedicated deterministic chatbot API -> CatalogReadModel | high | high | medium | highest |
| C: LLM extracts filters -> validated backend -> CatalogReadModel | medium | medium | high | not needed |

Recommendation: **B**, with A as a no-parser fallback. Flow: Typebot -> unauthenticated public read-only chatbot endpoint -> validation/keyword parser -> CatalogReadModel -> SQL Server -> allowlisted response. Typebot never receives DB credentials, JWT, cookies, cart/order/account/admin data, internal IDs, or authority over price/stock/URLs.

## Network, failure and rollback

Use a dedicated no-credentials endpoint, explicit Typebot/embed origin allowlist, short timeout, rate limit, max three results, HTTPS after deployment, and stable error mapping. Typebot server-side HTTP behavior versus browser CORS requires POC; never use wildcard CORS. Proposed frontend public flags: `NEXT_PUBLIC_TYPEBOT_ENABLED` and `NEXT_PUBLIC_TYPEBOT_PUBLIC_ID`; no admin secret in browser. Flag-off must render no widget and leave commerce intact.

## Performance/accessibility budget

Do not make root layout client-only; lazy-load only after interaction/idle, no preload on every route, closed-state overhead must be measured, and failure must not fail the page. Launcher label: `Hỏi Trợ lý RoSach`; title: `Trợ lý RoSach`. Require keyboard open/close, focus management, visible close control, no auto-open/sound, reduced motion, live error/loading message, 44px target, no mobile overlap with cart/checkout.
