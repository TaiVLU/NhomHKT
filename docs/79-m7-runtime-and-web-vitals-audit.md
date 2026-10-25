# M7.3A Runtime And Web Vitals Audit

Status: AUDIT ONLY

## Measurement Tooling

Available:

- Existing `npm run build`.
- Existing `npm run start -w @rosach/web`.
- Existing Playwright dependency in root package, but no repository Lighthouse/PageSpeed/browser performance script.
- PowerShell `Invoke-WebRequest` for local HTTP response status/timing.

Not used:

- Lighthouse: NOT AVAILABLE WITHOUT PACKAGE INSTALLATION OR APPROVED SCRIPT.
- Public PageSpeed Insights: REQUIRES PUBLIC DEPLOYMENT.
- Google mobile-friendly test: REQUIRES PUBLIC DEPLOYMENT.
- Field Core Web Vitals: REQUIRES PUBLIC DEPLOYMENT/REAL USERS.

## Routes Measured

Production server command:

`npm run start -w @rosach/web -- -p 3100`

Server:

- URL: `http://localhost:3100`
- Mode: local production runtime after `npm run build`
- Ready in: 501ms from Next output
- Stopped after audit

API check:

- Command target: `http://127.0.0.1:4000/api/v1/products?pageSize=1`
- Result: unavailable, unable to connect

## Cold/Warm Method

For each route, 3 HTTP requests were issued sequentially after production server startup. The first run is a local cold-ish route hit for that process; later runs are warm-ish. Median is reported for reference only.

This is not browser load time and not Core Web Vitals.

## Runtime Metrics

| Route | Statuses | Runs ms | Median ms | Interpretation |
|---|---|---|---:|---|
| `/` | 500,500,500 | 548.4,28.4,30.5 | 30.5 | Not valid performance metric; root metadata failed without production site URL/API readiness. |
| `/khuyen-mai` | 200,200,200 | 89.4,19.1,41.3 | 41.3 | Static route HTTP baseline only. |
| `/gio-hang` | 200,200,200 | 26.5,52.9,15.3 | 26.5 | Static shell/client route HTTP only; cart hydration not measured. |
| `/thanh-toan` | 200,200,200 | 24.3,18.9,18.4 | 18.9 | Static shell/client route HTTP only; checkout hydration not measured. |
| `/thanh-toan/thanh-cong` | 200,200,200 | 34.0,18.7,39.3 | 34.0 | Static shell/client route HTTP only. |
| `/dang-nhap` | 200,200,200 | 109.8,54.1,153.2 | 109.8 | HTTP only; form interaction not measured. |
| `/dang-ky` | 200,200,200 | 31.3,21.3,20.1 | 21.3 | HTTP only. |
| `/quen-mat-khau` | 200,200,200 | 31.6,18.0,18.6 | 18.6 | HTTP only. |
| `/dat-lai-mat-khau` | 200,200,200 | 76.7,57.3,55.7 | 57.3 | HTTP only. |
| `/tai-khoan` | 200,200,200 | 29.4,18.3,17.8 | 18.3 | Auth guard hydration not measured. |
| `/admin` | 404,404,404 | 26.4,3.9,3.2 | 3.9 | No route file; expected not-found behavior. |
| `/admin/login` | 200,200,200 | 23.2,12.7,16.3 | 16.3 | HTTP only. |
| `/san-pham` | 200,200,200 | 86.2,62.6,44.3 | 62.6 | HTTP only; content correctness/browser render not verified under API outage. |
| `/san-pham?q=sach` | 200,200,200 | 49.1,53.3,46.8 | 49.1 | HTTP only. |
| `/san-pham?page=2` | 200,200,200 | 41.5,54.4,50.7 | 50.7 | HTTP only; valid page 2 data not verified. |
| `/danh-muc` | 500,500,500 | 29.9,31.7,22.7 | 29.9 | Not valid performance metric; API fetch failed. |
| `/danh-muc/van-hoc-viet-nam` | 500,500,500 | 49.3,27.0,21.0 | 27.0 | Not valid performance metric; API/slug not verified. |
| `/sach/atomic-habits` | 500,500,500 | 49.3,23.1,22.2 | 23.1 | Not valid performance metric; API/slug not verified. |

## Network Observations

No browser network waterfall was captured. PowerShell HTTP timing observed status/time only.

Server log observations:

- `Invalid root SEO runtime config` occurred in production runtime without `NEXT_PUBLIC_SITE_URL`.
- `TypeError: fetch failed` with `ECONNREFUSED` occurred for API-backed routes.

## Console/Hydration Issues

Browser console/hydration warnings were not measured in M7.3A. Full tests pass; web tests printed a jsdom navigation limitation while still passing.

## Core Web Vitals Readiness

| Route | LCP Candidate | LCP Risk | CLS Risk | INP Risk | TTFB Dependency | Runtime Metric Available | Status |
|---|---|---|---|---|---|---|---|
| `/` | Hero H1/CSS book/product cards | Medium | Low-medium | Medium via header/cart hydration | SEO config + API + Next server | No CWV | NOT MEASURED |
| `/san-pham` | H1 or first product card image | Medium | Medium due product images/layout | Medium via drawer/filter/header | API product/taxonomy | No CWV | SOURCE RISK |
| `/danh-muc` | H1/category cards | Low | Low | Low-medium via shell | API categories | No CWV | NOT MEASURED |
| `/danh-muc/[slug]` | H1 or product card | Medium | Medium | Medium | API category/products | No CWV | REQUIRES VALID DATA |
| `/sach/[slug]` | Product cover or product H1 | Medium-high | Medium | Medium-high via variant/quantity/add-to-cart | API product | No CWV | REQUIRES VALID DATA |
| `/khuyen-mai` | Text hero | Low | Low | Low-medium via shell | Next static/server | No CWV | SOURCE PASS |
| `/gio-hang` | Cart/guest content | Low-medium | Low-medium | Medium-high quantity/remove/dialog | Client cart API/auth | No CWV | INP RISK ONLY |
| `/thanh-toan` | Checkout form/summary | Low-medium | Low-medium | High submit/address/dialog | Client auth/cart/account/checkout API | No CWV | INP RISK ONLY |

## LCP Readiness

Confirmed source factors:

- Product detail primary image uses eager loading but no priority/fetch priority.
- Product grids lazy-load product images.
- Homepage hero is mostly text/CSS, not external image.
- Social preview asset is not runtime LCP.

Not measured:

- LCP element, LCP time, image bytes, decode time, request priority.

## CLS Readiness

Source positives:

- Product image wrappers use `aspect-ratio: 3/4`.
- Skeleton cover uses stable aspect ratio.
- Header has fixed sticky structure.

Risks:

- Font metric shift not measured, though fonts are system.
- Async cart/auth/header badge changes may shift small header/account areas.
- Error/loading fallbacks for data routes may differ from final content.

## INP Risk

INP was not measured. Source risk areas:

- Header menu open/close and auth refresh.
- Catalog mobile filter drawer focus trap.
- Product variant/image/quantity changes.
- Add-to-cart mutation and toast.
- Cart quantity/remove/clear updates.
- Checkout address selector, delivery note, submit flow, refreshCart after checkout.
- Admin editor forms are heavy but private/admin-only.

## TTFB Dependency

TTFB depends on:

- Next production server.
- Public SEO origin configuration.
- API availability.
- Database/API query response time for products/categories.
- Remote image host does not affect document TTFB but affects LCP/image rendering.

## Accessibility Interaction

Performance recommendations must preserve:

- Header menu keyboard close/focus return.
- Mobile filter focus behavior.
- Dialog focus management in cart/checkout/admin.
- Button disabled states.
- Live regions in cart/checkout.
- Meaningful image alt and fallback alt.
- Reduced motion media query.

## Limitations

All browser Core Web Vitals are NOT MEASURED. HTTP route timings are local environment observations only and must not be used as PageSpeed/load-time claims.

## Public Deployment Requirements

M7.5 should validate:

- HTTPS and canonical production host.
- PageSpeed Insights.
- Mobile-friendly/public validation.
- Public Lighthouse if approved.
- Field or lab Core Web Vitals.
- Public crawl/network waterfall with API and CDN/hosting active.

## M7.3A Runtime Baseline Closure — 2026-07-22

### Method

- API/database readiness: SQL Server TCP `127.0.0.1:1433`, Prisma migration status, seed validation, and public API probes all passed.
- Production web: web-only `next build` and `next start -p 3100`, built/run with process-only `NEXT_PUBLIC_SITE_URL=http://127.0.0.1.nip.io:3100` and API URL `http://127.0.0.1:4000/api/v1`.
- Browser: Playwright Chromium, fresh browser context per run, desktop 1440×900 and mobile 390×844, three runs per route/viewport. The browser navigation URL was `http://localhost:3100`; canonical values consistently used the configured local measurement hostname.
- Fixtures: `m6-demo-regular-in-stock`, `m6-demo-van-hoc`, query `Sổ Tay`, and valid page 2.

### Result

All public core routes rendered valid 200 content with H1/main in all measured runs. Missing route was expected 404; anonymous checkout safely redirected to login. No successful-route console error or hydration mismatch was observed.

Representative median `networkidle` elapsed observations: desktop promotion 759.6ms, catalog query 853.9ms, category detail 1,294.3ms, product detail 2,828.7ms, homepage 4,317ms, and catalog page 2 6,146.1ms. They are local browser navigation observations influenced by remote images and `networkidle`; they are not LCP, CLS, INP, FCP, TBT, PageSpeed, or field CWV.

Resource Timing supplied local CSS transfer/decoded values and navigation milestones, but browser resource timing does not expose SSR API fetches. Fresh-context closure aborted pending RSC prefetches (`net::ERR_ABORTED`), with no console error on successful pages. A mobile-menu control matching the safe audit selector was unavailable, so no destructive interaction was attempted.

### Runtime conclusion

PERF-02 measurement prerequisite is closed locally. PERF-03 server duplicate fetch and authenticated commerce interaction remain unmeasured. Public PageSpeed, HTTPS/CDN behavior, and Core Web Vitals certification remain **NOT MEASURED / M7.5 deployment**.
## M7.3B runtime decision — 2026-07-22

The local production runtime remains a readiness measurement, not public CWV certification. No new console or hydration defect was used to justify an optimization. Server-side fetch and provider-bootstrap attribution require production-like telemetry before any source refactor.
### M7.3B final build-lock closure

The build-lock closure is an environment result only; it does not add public CWV evidence.
