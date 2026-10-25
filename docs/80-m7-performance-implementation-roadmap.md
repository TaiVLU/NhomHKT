# M7.3B Performance Implementation Roadmap

Status: PROPOSED FROM M7.3A AUDIT

No item in this roadmap is implemented in M7.3A.

## Frontend M7.3B

### Sprint 1 - Measurement Environment And Safety Gates

1. Objective: make local production measurement trustworthy before optimization.
2. Findings addressed: PERF-02, PERF-08.
3. Exact files: documentation/run command only unless Technical Lead approves source tooling.
4. Allowed changes: add approved measurement script or runbook; configure non-secret local env for measurement.
5. Forbidden changes: weakening SEO production origin validation, hard-coding fake domain, package install without approval.
6. Before state: API unavailable; production root 500 without `NEXT_PUBLIC_SITE_URL`; no CWV metrics.
7. Target state: data-driven routes return valid content in local production mode.
8. Measurement method: API health check, route status check, browser check if tooling approved.
9. Acceptance criteria: valid product/category slugs selected from real data; no route 500 caused by missing local env/API.
10. Required tests: SEO regression, build.
11. SEO regression: root metadata, canonical, robots, sitemap, JSON-LD unchanged.
12. Accessibility regression: no UI changes expected.
13. Commerce regression: no commerce behavior change.
14. Risks: environment work can be mistaken for source fix.
15. Rollback strategy: remove runbook/script if approved script causes churn.
16. Stop condition: if API/database cannot run locally, mark runtime metrics deferred.

### Sprint 2 - Server/Client Boundary

1. Objective: reduce high-level hydration scope while preserving global header/cart/auth behavior.
2. Findings addressed: PERF-01, PERF-04.
3. Exact files: `apps/web/app/layout.tsx`, `apps/web/features/shell/site-chrome.tsx`, `apps/web/features/shell/site-header.tsx`, `apps/web/features/cart/cart-provider.tsx`, `apps/web/features/catalog/product-image.tsx`.
4. Allowed changes: split static server shell from interactive children; isolate cart badge/menu/auth controls; split image fallback detector if measured beneficial.
5. Forbidden changes: client-only public pages, removing SSR navigation/content, breaking cart provider, removing image alt/fallback.
6. Before state: `SiteChrome` client wraps all non-admin routes; `ProductImage` client hydrates all product images.
7. Target state: smaller client subtree or accepted risk with measurement.
8. Measurement method: build output, route JS/hydration if tooling available, browser network.
9. Acceptance criteria: header/menu/auth/cart tests pass; public SSR content and SEO assets unchanged.
10. Required tests: `site-header.test.tsx`, cart provider tests, product-card tests, full SEO regression.
11. SEO regression: metadata, canonical, Open Graph/Twitter, JSON-LD, H1, internal links preserved.
12. Accessibility regression: keyboard focus/menu/dialog behavior preserved.
13. Commerce regression: cart badge, add-to-cart, cart page, checkout unaffected.
14. Risks: medium-high because provider placement touches many routes.
15. Rollback strategy: restore current `SiteChrome` and `ProductImage`.
16. Stop condition: if no measurable benefit or tests become brittle, defer.

### Sprint 3 - Data Fetching

1. Objective: remove confirmed duplicate public fetches without changing freshness or privacy.
2. Findings addressed: PERF-03.
3. Exact files: `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx`, `apps/web/services/catalog-client.ts`.
4. Allowed changes: verify duplicate fetches with API logs; add request-level memoization only for public product/category resources if safe.
5. Forbidden changes: caching private/cart/account/checkout/admin data; static generation of commerce-sensitive price/stock; client-side metadata.
6. Before state: metadata and page code paths call same logical resource.
7. Target state: one public same-resource fetch per route render if confirmed duplication exists.
8. Measurement method: API logs/network request count in local production with API running.
9. Acceptance criteria: duplicate fetch count 0 for product/category detail or accepted as framework-deduped.
10. Required tests: metadata regression, structured-data regression, product/category route tests.
11. SEO regression: dynamic titles/descriptions/JSON-LD unchanged.
12. Accessibility regression: no UI regression.
13. Commerce regression: price/stock freshness preserved.
14. Risks: stale or shared cache if implemented incorrectly.
15. Rollback strategy: restore independent fetch calls.
16. Stop condition: if Next already dedupes or freshness risk is too high, document accepted debt.

### Sprint 4 - Images And Fonts

1. Objective: tune confirmed LCP image strategy and image hydration only after browser evidence.
2. Findings addressed: PERF-04.
3. Exact files: `apps/web/features/catalog/product-image.tsx`, `apps/web/features/catalog/product-detail-experience.tsx`, `apps/web/features/catalog/product-card.tsx`, `apps/web/app/globals.css` if CLS wrapper fixes are needed.
4. Allowed changes: adjust product detail LCP image priority only if confirmed; tailor `sizes` by surface; split fallback logic if safe.
5. Forbidden changes: priority on many grid images, removing fallback/alt, changing backend image contract, external font changes.
6. Before state: all product images share one `sizes`; product detail cover eager but no priority; system fonts only.
7. Target state: true LCP image optimized; below-fold images stay lazy; no CLS regression.
8. Measurement method: browser LCP candidate/network image request audit.
9. Acceptance criteria: one or zero priority images per page as appropriate; no missing dimensions/alt.
10. Required tests: product-card, on-page compliance, SEO/social regression, build.
11. SEO regression: image metadata and alt preserved.
12. Accessibility regression: alt/fallback semantics preserved.
13. Commerce regression: product/gallery/cart/checkout images still accurate.
14. Risks: remote image behavior and Open Library fallbacks.
15. Rollback strategy: restore current `ProductImage`.
16. Stop condition: if LCP candidate is text or no image bottleneck measured, skip priority changes.

### Sprint 5 - Bundle And CSS

1. Objective: address only measured bundle/CSS cost.
2. Findings addressed: PERF-05, PERF-06.
3. Exact files: `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/globals.css`, optional approved measurement config.
4. Allowed changes: conditional markdown path with SSR/sanitization preserved; targeted CSS cleanup only with coverage evidence.
5. Forbidden changes: broad redesign, unsafe markdown, removing focus/reduced-motion states, dependency removal without proof.
6. Before state: markdown stack imported on product route; global CSS 2771 lines.
7. Target state: measured lower route/server/CSS cost or accepted debt.
8. Measurement method: approved bundle/CSS coverage or server timing.
9. Acceptance criteria: no route/visual/SEO regression.
10. Required tests: product detail, SEO regression, build.
11. SEO regression: product description SSR preserved.
12. Accessibility regression: focus/reduced motion preserved.
13. Commerce regression: product detail purchase flow unaffected.
14. Risks: product content/security and shared CSS blast radius.
15. Rollback strategy: restore direct imports/global CSS.
16. Stop condition: if exact cost cannot be measured, defer.

### Sprint 6 - Runtime Interaction

1. Objective: improve only measured INP/rerender bottlenecks in commerce/private flows.
2. Findings addressed: PERF-07.
3. Exact files: `apps/web/features/cart/cart-provider.tsx`, `apps/web/features/cart/cart-page.tsx`, `apps/web/features/checkout/checkout-page.tsx`, `apps/web/features/account/account-shell.tsx`, `apps/web/features/orders/orders-page.tsx`.
4. Allowed changes: reduce rerender scope, localize state, add cancellation/debounce only where measurement shows issue.
5. Forbidden changes: changing price/stock/cart/checkout semantics, cross-user caching, weakening auth, removing idempotency.
6. Before state: client-heavy workflows by design; INP not measured.
7. Target state: smoother measured interactions without business change.
8. Measurement method: browser interaction profiling if available.
9. Acceptance criteria: all commerce/auth tests pass; no security/privacy regression.
10. Required tests: cart, checkout, auth, account, order tests.
11. SEO regression: noindex/private metadata preserved.
12. Accessibility regression: dialogs/focus/live regions preserved.
13. Commerce regression: totals, idempotency, stock, order submission preserved.
14. Risks: high because commerce correctness matters more than micro-optimization.
15. Rollback strategy: restore previous component state structure.
16. Stop condition: if interactions are not measured as slow, no change.

### Sprint 7 - Performance Regression And Before/After Certification

1. Objective: record before/after evidence for every M7.3B change.
2. Findings addressed: all implemented findings.
3. Exact files: docs 75-80 plus affected implementation files.
4. Allowed changes: documentation report and approved tests.
5. Forbidden changes: claiming public PageSpeed/Core Web Vitals pass without deployment.
6. Before state: M7.3A baseline.
7. Target state: M7.3B implementation report with measured deltas.
8. Measurement method: same commands before/after.
9. Acceptance criteria: gates pass, source changes limited to approved M7.3B scope.
10. Required tests: format, lint, type-check, full tests, SEO regression, build, diff check.
11. SEO regression: full M7.2B regression suite.
12. Accessibility regression: affected interactions manually or automated if tooling exists.
13. Commerce regression: cart/checkout/order tests.
14. Risks: measurement drift if API/data/env changes between runs.
15. Rollback strategy: revert M7.3B implementation patch if gates fail.
16. Stop condition: unresolved P0/P1 regression.

## Backend Follow-up

- API/database response time for product list/detail/category endpoints.
- Catalog query/read model profiling.
- Image storage/Cloudinary latency.

These are not frontend M7.3B unless Technical Lead expands scope.

## M7.5 Deployment Verification

- Public PageSpeed Insights.
- Public mobile-friendly validation.
- HTTPS/canonical host.
- CDN/static cache headers.
- Search Console sitemap submission.
- Public crawl/waterfall.
- Field or lab Core Web Vitals.

## Accepted Debt

- No exact bundle size baseline yet.
- No browser CWV baseline yet.
- No public PageSpeed score.
- No API-backed valid slug runtime audit until API/database are running.

## Not Worth Optimizing Yet

- Off-page SEO and marketing tools through code.
- Social preview image as runtime LCP.
- Virtualization for current product grids without list-size evidence.
- Removing system fonts.

## Performance Budget Proposal

| Budget | Proposal | Basis | Status |
|---|---|---|---|
| Duplicate same-resource public fetch | 0 per route render when proven | Source duplicate risk in product/category detail | Proposed |
| Priority images | Max 1 true LCP image per route | Image priority principle | Proposed |
| CLS-risk product image wrapper without aspect ratio | 0 | Current CSS already uses aspect ratio | Proposed |
| New client dependency | 0 without Technical Lead approval | No bundle baseline | Proposed |
| Shared client JS | BUDGET DEFERRED UNTIL MEASUREMENT | Build did not emit size | Deferred |
| Route client JS | BUDGET DEFERRED UNTIL MEASUREMENT | Build did not emit size | Deferred |
| Hero/LCP asset size | BUDGET DEFERRED UNTIL MEASUREMENT | Image bytes not measured | Deferred |
| Request count guideline | BUDGET DEFERRED UNTIL API/BROWSER MEASUREMENT | API unavailable | Deferred |

## M7.3B Stop Condition

Stop M7.3B if an optimization risks SEO SSR, accessibility, commerce correctness, auth/privacy isolation, or closed milestone behavior and cannot be proven safe with tests and measurement.

## M7.3A Runtime Baseline Closure — Roadmap Correction

The future roadmap begins with **Sprint 1 — Confirmed Low-Risk Optimization**, not a SiteChrome refactor.

| Classification | Future action |
|---|---|
| Confirmed implementation | Only a small, measured image request-priority or remote-cover improvement may be proposed after an actual LCP/resource bottleneck is confirmed. No item is implemented by this closure. |
| Validation-only | PERF-01 shell/client boundary, PERF-03 server duplicate fetch, PERF-04 grid hydration/LCP split, and PERF-07 authenticated commerce interaction. Each needs a measured before-state, exact test, rollback, and SEO/accessibility/commerce safety proof. |
| Accepted debt | PERF-05 markdown and PERF-06 CSS: no measured meaningful browser cost, so no sprint is created. |
| Measurement prerequisite | Local API/database and production measurement origin are now available; preserve the process-only configuration method. |
| Deferred | PERF-08 PageSpeed/CWV/public network verification belongs to M7.5 deployment, not M7.3B. |

No future sprint may use the pre-closure source-risk severity alone as an implementation mandate.
## M7.3B closure recommendation — 2026-07-22

All M7.3B candidates are closed without source change: PERF-01 accepted/deferred measurement, PERF-03 validation-only, PERF-04 no change required, PERF-05 and PERF-06 info/no implementation, PERF-07 maintain, PERF-08 deferred to public measurement. Future work must begin with reproducible production telemetry, not speculative refactoring.
### M7.3B final build-lock closure

The M7.3B environment gate is resolved. No further optimization implementation is required before the next approved milestone.
