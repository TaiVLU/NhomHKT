# M7.3A Performance Audit

Status: READY FOR TECHNICAL LEAD REVIEW

## 1. Executive Summary

M7.3A completed an audit-only baseline for RoSach performance. Source inspection, teacher checklist review, quality gates, production build output, and a limited local production HTTP runtime check were recorded.

Final audit status: WARN.

Reason: code quality gates pass, but public PageSpeed/Core Web Vitals are not measured; the local production runtime has deployment/API environment blockers (`NEXT_PUBLIC_SITE_URL` missing in production runtime and API unavailable at `127.0.0.1:4000`). Several performance risks are source-confirmed and should drive M7.3B.

## 2. Scope

In scope:

- Application routes under `apps/web/app/**`.
- Feature modules under `apps/web/features/**`.
- Service/data clients under `apps/web/services/**`.
- SEO runtime helpers under `apps/web/lib/seo/**`.
- Assets under `apps/web/public/**`.
- Next, package, TypeScript, ESLint, Tailwind/PostCSS, and test configuration by read-only inspection.
- Teacher Chapter 8 SEO Audit Checklist workbook: `CHUONG 8 - SEO AUDIT CHECKLIST .xlsx` with sheets `TECHNICAL SEO`, `ONPAGE SEO`, `OFFPAGE SEO`, and `CAC CONG CU PHO BIEN`.

## 3. Non-goals

No performance optimization, UI redesign, CSS cleanup, image migration, bundle refactor, dependency replacement, backend/database optimization, caching implementation, deployment, analytics/Search Console setup, SEO implementation, test implementation, commit, or push was performed.

## 4. Environment

| Item | Value |
|---|---|
| OS | Microsoft Windows NT 10.0.26200.0 |
| Node | `v22.23.1` |
| npm | `10.9.8` |
| Next.js | `16.2.10` from `apps/web/package.json` and build output |
| React | `19.2.7` from `apps/web/package.json` |
| TypeScript | `5.9.3` root devDependency |
| Web URL | `http://localhost:3000` planned local dev; production audit server used `http://localhost:3100` |
| API URL | `http://127.0.0.1:4000/api/v1` expected; API check returned unable to connect |
| Runtime mode | Production build with `npm run build`; local production server with `npm run start -w @rosach/web -- -p 3100` |
| Browser/runtime tooling | Playwright is installed as root devDependency, but no repository Lighthouse/PageSpeed script exists; browser CWV was not measured |
| Env variables observed | No matching `NEXT_PUBLIC_*`, `API`, `DATABASE`, `NODE_ENV`, `SITE`, `SEO`, `INDEX`, or `PORT` variables were printed by the safe env-name check |
| Secrets | No secret values printed |

## 5. Repository State

Initial `git status --short --branch` showed a pre-existing dirty worktree on `master`, including M6/M7 source and docs changes plus untracked M7.2B files. M7.3A did not reset, clean, stash, restore, commit, or push.

Pre-existing dirty examples:

- API source/tests: `apps/api/src/modules/**`, `apps/api/test/**`.
- Web source/tests: `apps/web/app/**`, `apps/web/features/**`, `apps/web/lib/seo/**`, `apps/web/services/**`, `apps/web/tests/seo/**`.
- Docs: `docs/00-document-map.md`, `docs/99-project-memory.md`, docs 35-72.
- Assets: `apps/web/public/favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `social-preview.png`.
- Teacher workbook: `CHUONG 8 - SEO AUDIT CHECKLIST .xlsx`.

M7.3A allowed documentation changes:

- Created docs 73-80.
- Updated `docs/00-document-map.md`.
- Updated `docs/99-project-memory.md`.

## 6. Baseline Quality Gates

| Gate | Exact Command | Result | Duration | Notes |
|---|---|---|---:|---|
| format | `npm run format:check` | PASS | 10.37s | Prettier check only. |
| lint | `npm run lint` | PASS | 47.98s | API, web, shared lint passed. |
| type-check | `npm run type-check` | PASS | 16.71s | API, web, shared TypeScript passed. |
| full tests | `npm run test` | PASS | 102.91s | API 21 files / 104 tests; web 38 files / 187 tests; shared 1 file / 1 test. Output also printed jsdom `Not implemented: navigation to another Document`; tests still passed. |
| SEO regression | `npm run test -w @rosach/web -- tests/seo/on-page-compliance.test.ts tests/seo/site-identity.test.ts tests/seo/route-policy.test.ts tests/seo/sitemap-regression.test.ts tests/seo/structured-data-regression.test.ts tests/seo/metadata-regression.test.ts tests/seo/cross-asset.test.ts app/sitemap.test.ts app/seo-policy.test.ts` | PASS | 11.76s | 9 files / 34 tests. |
| build | `npm run build` | PASS | 38.97s | API Prisma generate + tsc; web Next build; shared tsc. |
| git diff --check | `git diff --check` | PASS | 0.22s | CRLF warnings only; no whitespace errors. |

## 7. Route Audit Matrix

| Route | Data State | Rendering Type | Server/Client | Main Data Sources | Loading Boundary | Error Boundary | Main Image/LCP Candidate | Client JS Risk | Fetch Risk | CLS Risk | Runtime Measurement | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | API unavailable | Dynamic | Server page inside client `SiteChrome` | `getProducts`, `getCategories` | None route-specific | Root error only | Hero text/book CSS and product cards | Medium | High when API absent; fetch parallelized | Low-medium | 500; 548.4/28.4/30.5ms HTTP | RISK |
| `/san-pham` | Local API unavailable | Dynamic | Server route plus client drawer/images | products/categories/authors/publishers | `app/san-pham/loading.tsx` | `app/san-pham/error.tsx` | Product card grid | Medium | Medium; parallelized public fetches | Medium | 200; 86.2/62.6/44.3ms HTTP, content not browser-verified | WARN |
| `/san-pham?q=sach` | Query state | Dynamic, noindex | Server route plus client drawer/images | Same as catalog | Same | Same | Product grid or empty state | Medium | Medium | Medium | 200; 49.1/53.3/46.8ms HTTP | WARN |
| `/san-pham?page=2` | Page 2 not data-verified | Dynamic, noindex | Server route plus client drawer/images | Same as catalog | Same | Same | Product grid/empty state | Medium | Medium | Medium | 200; 41.5/54.4/50.7ms HTTP | REQUIRES VALID DATA |
| `/danh-muc` | API unavailable | Dynamic | Server route in client chrome | `getCategories` | None route-specific | Root error only | Category cards text | Low | High when API absent | Low | 500; 29.9/31.7/22.7ms HTTP | RISK |
| `/danh-muc/van-hoc-viet-nam` | Slug not verified through API | Dynamic | Server route plus product cards/images | `getCategory`, `getProducts` | None route-specific | Root error only | Product cards | Medium | Metadata/page duplicate category fetch risk | Medium | 500; 49.3/27.0/21.0ms HTTP | REQUIRES VALID DATA |
| `/sach/atomic-habits` | Slug not verified through API | Dynamic | Server route plus client product detail | `getProduct` | None route-specific | Root error only | Product cover in detail gallery | High | Metadata/page duplicate product fetch risk | Medium | 500; 49.3/23.1/22.2ms HTTP | REQUIRES VALID DATA |
| `/khuyen-mai` | Static copy | Static | Server page in client chrome | None | N/A | Root error only | Text hero | Low | Low | Low | 200; median 41.3ms HTTP | PASS |
| `/gio-hang` | Guest/local auth | Static route, client-rendered feature | Client cart provider/API after hydration | cart API when authenticated | Component skeleton | Component states | Placeholder/product cover | High | Client refetch by auth/cart state | Low-medium | 200; median 26.5ms HTTP | WARN |
| `/thanh-toan` | Guest/local auth | Static route, client-rendered feature | Client checkout/cart/address | cart/account/checkout APIs | Component skeleton | Component states | Product summary covers | High | Client auth/cart/address fetch chain | Low-medium | 200; median 18.9ms HTTP | WARN |
| `/thanh-toan/thanh-cong` | SessionStorage only | Static route, client-rendered feature | Client confirmation page | sessionStorage | Component loading | Component fallback | Text confirmation | Medium | Low | Low | 200; median 34.0ms HTTP | WARN |
| `/dang-nhap` | Public auth | Dynamic | Client form | auth API on submit | N/A | Form error state | Text/form | Medium | Low until submit | Low | 200; median 109.8ms HTTP | PASS |
| `/dang-ky` | Public auth | Static | Client form | auth API on submit | N/A | Form error state | Text/form | Medium | Low until submit | Low | 200; median 21.3ms HTTP | PASS |
| `/quen-mat-khau` | Public auth | Static | Client form | auth API on submit | N/A | Form error state | Text/form | Medium | Low until submit | Low | 200; median 18.6ms HTTP | PASS |
| `/dat-lai-mat-khau` | Public auth | Dynamic | Client form | auth API on submit | N/A | Form error state | Text/form | Medium | Low until submit | Low | 200; median 57.3ms HTTP | PASS |
| `/tai-khoan` | Requires session | Static route, client auth guard | Client account shell | auth refresh | `AccountShell` busy state | Redirect/login behavior | Text/account card | Medium | Client auth bootstrap | Low | 200; median 18.3ms HTTP | REQUIRES AUTH |
| `/admin` | No route file | Not verified | N/A | N/A | N/A | Not-found | N/A | N/A | N/A | N/A | 404; median 3.9ms HTTP | PASS |
| `/admin/login` | Public admin auth | Static | Client form | auth API on submit | N/A | Form error state | Text/form | Medium | Low until submit | Low | 200; median 16.3ms HTTP | PASS |

Runtime numbers are local HTTP response timing only. They are not LCP, CLS, INP, FCP, TBT, Speed Index, transfer size, browser load time, or PageSpeed scores.

## 8. Findings Summary

| ID | Title | Domain | Severity | Priority | Status |
|---|---|---|---|---|---|
| PERF-01 | Root client chrome hydrates all non-admin public pages | Server/Client Boundary | High | P1 | Confirmed risk |
| PERF-02 | Production local runtime blocked by deployment/API readiness | Environment/Data | High | Deferred | Confirmed blocker for runtime certification |
| PERF-03 | Product/category metadata and page fetch same resource separately | Data Fetching | Medium | P2 | Duplicate fetch risk |
| PERF-04 | Product image component is client-only and every public product image hydrates | Images/Boundary | Medium | P2 | Confirmed risk |
| PERF-05 | Product detail imports markdown stack on product route | Build & Bundle | Medium | P2 | Bundle/server cost risk |
| PERF-06 | Global stylesheet is large and contains paint/animation-heavy surfaces | CSS Runtime | Low | P3 | Opportunity |
| PERF-07 | Cart/checkout/account interactions are client-heavy by business need | Runtime Interaction | Medium | Maintain/P2 | Maintain with targeted measurement |
| PERF-08 | Public PageSpeed/Lighthouse/Core Web Vitals not measured | Teacher Checklist | Info | Deferred | Requires tooling/deployment |

## 9. Severity Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 2 |
| Medium | 4 |
| Low | 1 |
| Info | 1 |

## 10. Priority Summary

| Priority | Count |
|---|---:|
| P0 | 0 |
| P1 | 1 |
| P2 | 4 |
| P3 | 1 |
| P4 | 0 |
| Maintain | 1 |
| Deferred | 1 |

## 11. Teacher Checklist Alignment

| Teacher Criterion | Current Evidence | Locally Measurable | M7.3B Action | Public Deployment Required | Final Status |
|---|---|---|---|---|---|
| Desktop PageSpeed > 60 | No public URL; no PageSpeed script/package. | No | Prepare performance fixes; verify in M7.5. | Yes | REQUIRES PUBLIC DEPLOYMENT / NOT GUARANTEED |
| Mobile loading GOOD | Source responsive CSS and M7.1 evidence; no public mobile test. | Partly | Keep responsive safety while optimizing. | Yes | PARTIAL |
| Load under 3-5 seconds | Local HTTP timing only; not browser load/CWV. | Partly | M7.3B should add before/after route measurements. | Yes for certification | NOT MEASURED |
| Mobile friendly | Viewport exists; responsive CSS exists; no public Google validator. | Partly | Do not break responsive layout. | Yes | PARTIAL |
| Image optimization | `next/image` used; product images remote/unoptimized; fill sizes present. | Source-only | Audit/adjust LCP strategy with evidence. | Public validation later | DEFER TO M7.3B |
| CSS/JavaScript optimization | Build output lacks route JS sizes; source shows broad client boundary. | Source/build | Split only evidence-backed boundaries. | No for local work | DEFER TO M7.3B |
| User experience | M7.1 evidence plus route source states. | Partly | Preserve loading/empty/error states. | Public validation later | PARTIAL |
| PageSpeed Insights | Not available for localhost. | No | None in M7.3B except prepare. | Yes | REQUIRES PUBLIC DEPLOYMENT |
| Lighthouse | No repo Lighthouse script/package; no package installed. | Not currently | Use only if Technical Lead approves existing tooling or adds script. | Public URL optional but lab can be local if tooling exists | NOT MEASURED |
| Public mobile validation | Local-only app. | No | None. | Yes | REQUIRES PUBLIC DEPLOYMENT |

## 12. Performance Score

| Domain | Weight | Score | Weighted | Status | Confidence | Evidence | Missing Measurement |
|---|---:|---:|---:|---|---|---|---|
| Build & Bundle | 15% | 6.0/10 | 0.90 | WARN | Medium | Next build route classification; dependency imports | Route JS sizes/transfer sizes not emitted |
| Server/Client Boundary | 15% | 5.0/10 | 0.75 | WARN | High | 33 `"use client"` files; root `SiteChrome` client wrapper | Hydration cost not measured |
| Data Fetching | 15% | 5.5/10 | 0.83 | WARN | Medium | `fetch` inventory; metadata/page duplicate risk; API unavailable | Network waterfall/API timing not measured |
| Images | 15% | 6.0/10 | 0.90 | WARN | Medium | `ProductImage`, `next/image`, assets inventory | Actual LCP image and decoded bytes not measured |
| Fonts/CSS | 10% | 6.5/10 | 0.65 | WARN | Medium | System fonts; `globals.css` 2771 lines; motion reduction exists | CSS bytes/coverage not measured |
| Runtime Interaction | 10% | 5.5/10 | 0.55 | WARN | Medium | Cart/checkout/account/admin client effects and handlers | INP/long tasks not measured |
| Core Web Vitals Readiness | 10% | 4.5/10 | 0.45 | WARN | Low | Source-based LCP/CLS/INP risk only | LCP/CLS/INP/FCP/TBT/TTFB not measured by browser |
| SEO/Accessibility/Commerce Safety | 10% | 8.0/10 | 0.80 | PASS | High | M7.2 SEO tests pass; accessibility states preserved in source | Browser regression not rerun visually |

Overall weighted score: 5.83/10.

Calculation: `0.90 + 0.75 + 0.83 + 0.90 + 0.65 + 0.55 + 0.45 + 0.80 = 5.83`.

Overall status: WARN.

## 13. Measurement Limitations

- No public deployment, SSL, canonical production host, Search Console, Analytics, PageSpeed, or public mobile validator.
- API at `http://127.0.0.1:4000/api/v1/products?pageSize=1` was unavailable during audit.
- Local production runtime lacked `NEXT_PUBLIC_SITE_URL`; root metadata returned `Invalid root SEO runtime config` in production runtime.
- Local HTTP timings are not browser performance metrics.
- Build output did not emit route size or first-load JS numbers.
- No package was installed for Lighthouse or bundle analyzer.

## 14. Risks

- Root `SiteChrome` is a high-level client boundary and wraps all non-admin routes with `CartProvider`.
- Public product imagery uses a client `ProductImage` wrapper for fallback detection, causing hydration for every product image.
- Product/detail and category/detail metadata/page paths may duplicate same-resource fetches unless Next request memoization applies to identical native fetch inputs.
- Cart/checkout/account pages are appropriately client-heavy, but they need runtime INP and rerender validation before optimizing.
- Global CSS includes sticky, fixed, backdrop-filter, shadows, and animations; source risk exists, but paint/layout cost is not measured.

## 15. M7.3B Recommendation

M7.3B should start with low-risk boundary/data/image work that preserves SSR SEO and commerce correctness:

1. Split `SiteChrome` so header/footer static structure can remain server-rendered where possible, while cart/auth/menu interactions stay isolated in client children.
2. Investigate product/category detail metadata/page duplicate fetches with logs or tests before adding memoization.
3. Evaluate `ProductImage` split: server-safe static Next Image path plus isolated client fallback detector only where remote Open Library detection is needed.
4. Add an approved measurement command or lightweight local script if Technical Lead wants repeatable route HTTP/browser baselines.
5. Defer public PageSpeed/Core Web Vitals certification to M7.5 deployment.

## 16. Final Audit Status

M7.3A is documentation-only and source-safe.

Audit result: WARN.

M7.3B readiness: READY WITH CONDITIONS.

Conditions: configure local production `NEXT_PUBLIC_SITE_URL`, run API/database for data-driven route measurement, and use only approved existing tooling unless Technical Lead approves new measurement tooling.

## M7.3A Runtime Baseline Closure — 2026-07-22

Runtime closure replaced the earlier API-unavailable local observation with production-mode browser evidence. No application source, CSS, configuration source, API/database source, package, commit, or push changed.

### Environment and fixtures

- SQL Server TCP probe: `127.0.0.1:1433` reachable; `prisma migrate status` reported 10 migrations and schema up to date; `npm run seed:validate -w @rosach/api` reported `blocking: false`.
- Existing API process at `127.0.0.1:4000` returned health 200 with `api: up`, `environment: valid`, and `database: up`. Attempting `npm run dev:api` correctly reported `EADDRINUSE`; the pre-existing process was not stopped.
- Production web build first failed in root workspace because the existing API watcher locked Prisma's Windows query engine (`EPERM` rename). A web-only production build then passed with process-only `NEXT_PUBLIC_SITE_URL=http://127.0.0.1.nip.io:3100` and `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1`. The `nip.io` hostname resolves locally but avoids weakening the production localhost SEO guard; it is not a public deployment domain.
- Fixtures: product `m6-demo-regular-in-stock` (Rừng Na Uy), category `m6-demo-van-hoc` (Văn học), query `Sổ Tay` (1 result), and page 2 (30 public products at page size 10).

### Browser route matrix correction

Chromium Playwright baseline used `http://localhost:3100`, desktop `1440x900`, mobile `390x844`, and three fresh-context runs per route/viewport (78 navigations). `NEXT_PUBLIC_SITE_URL` canonical output consistently used the local measurement origin `http://127.0.0.1.nip.io:3100`.

| Route group | Result |
|---|---|
| `/`, catalog base/query/page 2, category index/detail, product detail, promotion, cart, login, admin login | HTTP 200; expected H1 and main content observed in every run. |
| `/thanh-toan` as anonymous | Expected client redirect to login; final title was `Đăng nhập | RoSach`, so it is an authentication behavior, not a performance failure. |
| `/m7-3a-missing-route` | Expected HTTP 404 with not-found title/content; not a performance route. |
| Browser console | No console error or hydration mismatch on successful public/auth route renders. The 404 route emitted expected 404 messages only. |
| Browser direct API requests | Zero: public catalog data is fetched server-side, so browser network cannot prove server-side duplicate fetch count. |

`networkidle` elapsed medians ranged from roughly 0.6s on static/auth routes to 6.1s for desktop catalog page 2; these include local remote-image/network-idle behavior and are **not** CWV, PageSpeed, LCP, or field metrics. `ERR_ABORTED` observations were RSC prefetches still in flight when each fresh browser context closed; they produced no successful-route console error and are recorded as a limitation, not a failed navigation.

### Recalibrated findings and score

| ID | Runtime closure decision |
|---|---|
| PERF-01 | Medium-High / validation-only: public routes load 30–39 script responses per three fresh runs and no anonymous cart/auth API request was observed on promotion. Shared hydration cost is not sized, so High is not justified. |
| PERF-02 | PASS as measurement prerequisite: local DB/API and production route content are now measurable. Public deployment certification remains deferred. |
| PERF-03 | Not confirmed: browser sees no server-side SSR API requests. Preserve as P2 validation/accepted debt; do not add memoization. |
| PERF-04 | Confirmed image evidence, split by cause: grid image is lazy with `fetchPriority=auto`; product detail cover is eager but `fetchPriority=auto`, remote Open Library cover measured 324×500 natural and 420×560 desktop / 358×477 mobile. This is an LCP-priority and remote-host candidate, not measured LCP. |
| PERF-05 | Info/P4 measurement candidate: no separate markdown package request was identifiable in browser resources and SSR product content rendered. No dynamic import work is justified. |
| PERF-06 | Info/P4: one CSS resource per cold page had 11,475 transfer bytes / 53,459 decoded bytes in this local baseline. Line count is not a failure and no CSS sprint is justified. |
| PERF-07 | Maintain/Info: anonymous cart/checkout did not create a direct API request or console error. Checkout redirected safely to login; authenticated interaction profiling remains future measurement. |
| PERF-08 | Deferred/Public Deployment: local baseline does not certify PageSpeed or Core Web Vitals. |

Scores (not Core Web Vitals): source-readiness **5.8/10** (medium confidence), local browser-readiness **6.3/10** (medium-low confidence), overall provisional **6.0/10** (medium-low confidence). CWV certification: **NOT MEASURED**.

Final audit result: **WARN**. M7.3B readiness: **READY WITH CONDITIONS** — only confirmed low-risk work may enter a future approved sprint; server-fetch duplication, shell split, markdown, CSS, and commerce work remain validation-only/accepted debt until measurable impact exists.

### Closure quality gates

| Gate | Result |
|---|---|
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run test` | PASS on repeat: API 104/104, web 187/187, shared 1/1. The first full run had one transient `SiteHeader` guest-navigation failure; its isolated rerun passed before the successful full rerun. |
| SEO regression command | PASS: 9 files / 34 tests |
| `npm run build` | WARN/environment lock: API `prisma generate` failed `EPERM` renaming the Windows engine while the pre-existing API watcher held it. Web-only production build passed. |
| `git diff --check` | PASS; CRLF warnings only. |

## Findings

### PERF-01

ID: PERF-01
Title: Root client chrome hydrates all non-admin public pages
Domain: Server/Client Boundary
Severity: High
Priority: P1
Status: Confirmed risk

Affected routes: `/`, `/san-pham`, `/danh-muc`, `/danh-muc/[slug]`, `/sach/[slug]`, `/khuyen-mai`, `/gio-hang`, `/thanh-toan`, `/dang-nhap`, `/dang-ky`, `/tai-khoan`
Affected files: `apps/web/app/layout.tsx`, `apps/web/features/shell/site-chrome.tsx`, `apps/web/features/shell/site-header.tsx`, `apps/web/features/cart/cart-provider.tsx`
Affected components: `RootLayout`, `SiteChrome`, `SiteHeader`, `CartProvider`

Evidence:
- source evidence: `RootLayout` renders `<SiteChrome>{children}</SiteChrome>`.
- source evidence: `SiteChrome` is `"use client"` and wraps non-admin routes with `CartProvider`, `SiteHeader`, `SiteFooter`.
- source evidence: `SiteHeader` uses `usePathname`, `useRouter`, auth subscription, keyboard listener, and cart context.
- runtime evidence: hydration cost was not measured.

Observed behavior: Static and server-rendered content under non-admin routes sits below a client boundary.
Root cause: Header/auth/cart state currently live at shell level.
Why this is a performance issue: It can increase hydration surface and shared client JS for routes that mostly need static SSR content.
User impact: Potential slower interactivity and more JS on public browsing routes.
SEO impact: Low if SSR output remains intact; high if M7.3B moves public text/JSON-LD to client-only rendering.
Accessibility impact: Medium; header menu/focus behavior must remain keyboard safe.
Commerce impact: Medium; cart badge and cart provider must remain correct.
Security/privacy impact: Low; auth state must not leak private data into public SSR output.

Recommended M7.3B action: Split static shell/server structure from interactive header/cart/auth children after measuring route JS.
Allowed implementation: Server `SiteChrome` wrapper plus isolated client header controls/cart badge if tests prove behavior preserved.
Forbidden implementation: Client-only public pages; removing cart/auth correctness; hiding navigation from SSR.

Acceptance criteria: Public routes still SSR main content, metadata/JSON-LD unchanged, cart badge/auth/menu tests pass.
Before metric: NOT MEASURED; source boundary confirmed.
After target: Reduced public route hydration scope or documented accepted risk.
Measurement method: Build route output, browser network/hydration if tooling approved, SEO regression tests.
Regression tests: `site-header.test.tsx`, cart provider tests, SEO regression suite, build.

Implementation risk: Medium.
Rollback strategy: Revert shell split to current `SiteChrome`.
Dependencies: Need M7.3B approval and runtime measurement.
Deferred reason: Audit-only milestone.

### PERF-02

ID: PERF-02
Title: Production local runtime blocked by deployment/API readiness
Domain: Environment/Data
Severity: High
Priority: Deferred
Status: Confirmed blocker for runtime certification

Affected routes: `/`, `/danh-muc`, `/danh-muc/[slug]`, `/sach/[slug]`, data-driven runtime measurements
Affected files: `apps/web/lib/seo/core/config.ts`, `apps/web/services/catalog-client.ts`
Affected components: root metadata generation, catalog fetch services

Evidence:
- command evidence: `Invoke-WebRequest http://127.0.0.1:4000/api/v1/products?pageSize=1` returned unable to connect.
- runtime evidence: `npm run start -w @rosach/web -- -p 3100` started Next production server.
- runtime evidence: `/` returned 500 and server log included `Invalid root SEO runtime config`.
- runtime evidence: category/product routes returned 500 when API-backed fetches failed.
- source evidence: production SEO config requires explicit `NEXT_PUBLIC_SITE_URL`.

Observed behavior: Local production runtime can start, but production-like public routes are not fully measurable without API and public site URL configuration.
Root cause: Environment not configured for production runtime measurement and API not running.
Why this is a performance issue: Missing runtime readiness blocks trustworthy route timing, waterfall, and CWV baseline.
User impact: Not a deployed user issue in this audit; blocks measurement.
SEO impact: Medium in production if `NEXT_PUBLIC_SITE_URL` is not configured; this is an existing approved SEO safety guard.
Accessibility impact: N/A for source behavior.
Commerce impact: Data-driven routes and cart/checkout measurements need API availability.
Security/privacy impact: Positive guard; production refuses unsafe localhost/implicit origin.

Recommended M7.3B action: Create an approved local performance runbook requiring non-secret `NEXT_PUBLIC_SITE_URL`, running API/database, and valid demo data before measuring.
Allowed implementation: Documentation/run command only unless Technical Lead approves config changes.
Forbidden implementation: Weakening production SEO origin validation or hard-coding fake production domain.

Acceptance criteria: Data-driven routes return expected content in local production mode before route performance measurement.
Before metric: API unavailable; root 500 in local production without site URL.
After target: Measurement environment ready; no fake production URL.
Measurement method: Safe env-name check, API health check, route HTTP/browser checks.
Regression tests: SEO config tests and build.

Implementation risk: Low for docs/runbook; high if changing SEO config.
Rollback strategy: Revert only runbook edits if needed.
Dependencies: Local API/database/demo data and env configuration.
Deferred reason: Environment/deployment readiness, not M7.3A source work.

### PERF-03

ID: PERF-03
Title: Product/category metadata and page fetch same resource separately
Domain: Data Fetching
Severity: Medium
Priority: P2
Status: Duplicate fetch risk

Affected routes: `/sach/[slug]`, `/danh-muc/[slug]`
Affected files: `apps/web/app/sach/[slug]/page.tsx`, `apps/web/app/danh-muc/[slug]/page.tsx`, `apps/web/services/catalog-client.ts`
Affected components: `generateMetadata`, `ProductPage`, `CategoryPage`

Evidence:
- source evidence: product `generateMetadata()` calls `getProduct(slug)` and page render also calls `getProduct(slug)`.
- source evidence: category `generateMetadata()` calls `getCategory(slug)` and page render also calls `getCategory(slug)`.
- source evidence: service uses native `fetch` with `cache: 'no-store'` for products and `next: { revalidate: 300 }` for categories.
- runtime evidence: API unavailable, so duplicate network requests were not verified.

Observed behavior: Same logical product/category resource appears in metadata and page code paths.
Root cause: Metadata needs entity data for SEO, and page needs entity data for content.
Why this is a performance issue: If memoization does not apply or options differ, route render can double API latency.
User impact: Potential slower product/category detail TTFB.
SEO impact: High safety requirement; metadata must stay server-generated.
Accessibility impact: N/A.
Commerce impact: Product price/stock freshness must remain backend-authoritative.
Security/privacy impact: Public product/category data only; do not apply pattern to private routes.

Recommended M7.3B action: Verify actual duplicate request behavior with API logs or instrumentation, then use safe per-request memoization only if duplication is confirmed.
Allowed implementation: React `cache()` or service-level request sharing for public product/category reads if freshness remains correct.
Forbidden implementation: Static generation/private caching of price, stock, cart, checkout, account, auth, or admin data; client-side metadata.

Acceptance criteria: Duplicate same-route public product/category fetch count is 0 or accepted with evidence.
Before metric: DUPLICATE FETCH RISK, not measured.
After target: One same-resource API request per route render when possible.
Measurement method: API logs/network capture in local production with API running.
Regression tests: Metadata regression, structured-data regression, product/category route tests.

Implementation risk: Medium.
Rollback strategy: Restore independent fetches if freshness or SEO breaks.
Dependencies: Running API/database and valid slugs.
Deferred reason: Audit-only milestone and runtime evidence missing.

### PERF-04

ID: PERF-04
Title: Product image component is client-only and every public product image hydrates
Domain: Images/Boundary
Severity: Medium
Priority: P2
Status: Confirmed risk

Affected routes: `/`, `/san-pham`, `/danh-muc/[slug]`, `/sach/[slug]`, `/gio-hang`, `/thanh-toan`
Affected files: `apps/web/features/catalog/product-image.tsx`, `apps/web/features/catalog/product-card.tsx`, `apps/web/features/catalog/product-detail-experience.tsx`, `apps/web/features/cart/cart-page.tsx`, `apps/web/features/checkout/checkout-page.tsx`
Affected components: `ProductImage`, `ProductCard`, product gallery, cart item cover, checkout summary image

Evidence:
- source evidence: `ProductImage` is `"use client"`, imports `next/image`, uses `useState`, `useRef`, `useEffect`, `onLoad`, and `onError`.
- source evidence: `ProductCard` uses `ProductImage` for each grid card.
- source evidence: product detail primary image passes `loading="eager"` but no source-confirmed `priority`/`fetchPriority`.
- source evidence: all product images use `fill` and `sizes`.
- asset evidence: `book-placeholder.svg` exists.

Observed behavior: Image fallback robustness is client-driven for every product image surface.
Root cause: Open Library 1px/corrupt cover fallback detection uses browser image state.
Why this is a performance issue: Hydrating many product images can increase client JS and main-thread work on catalog/product grids.
User impact: Potential slower interaction readiness on image-heavy routes.
SEO impact: Low if alt and SSR image markup remain; high if images/text become client-only.
Accessibility impact: Alt behavior must be preserved.
Commerce impact: Product image fallback helps product trust; do not remove without replacement.
Security/privacy impact: Remote image host remains allow-listed in Next config.

Recommended M7.3B action: Split static server image rendering from optional client fallback verification where needed, and verify LCP image priority before changing.
Allowed implementation: Server-safe image component for known good/local images; isolated client fallback detector for remote Open Library edge cases.
Forbidden implementation: Removing fallback, dropping alt text, setting priority on many grid cards, or lazy-loading true LCP image without measurement.

Acceptance criteria: Product images retain alt/fallback, no image 404, no multiple high-priority images, SEO/social metadata unchanged.
Before metric: Source risk confirmed; LCP not measured.
After target: Reduced image hydration scope or documented accepted risk.
Measurement method: Browser/network/LCP candidate audit with API data.
Regression tests: image alt/on-page tests, product-card tests, build.

Implementation risk: Medium.
Rollback strategy: Restore current `ProductImage`.
Dependencies: Valid product data and browser runtime audit.
Deferred reason: Audit-only milestone.

### PERF-05

ID: PERF-05
Title: Product detail imports markdown stack on product route
Domain: Build & Bundle
Severity: Medium
Priority: P2
Status: Bundle/server cost risk

Affected routes: `/sach/[slug]`
Affected files: `apps/web/app/sach/[slug]/page.tsx`, `apps/web/package.json`
Affected components: `ProductPage` description section

Evidence:
- source evidence: product page imports `react-markdown`, `rehype-sanitize`, and `remark-gfm`.
- dependency evidence: these packages are runtime web dependencies.
- build evidence: build passes but route JS/server chunk sizes are not emitted by current build output.
- runtime evidence: route runtime was not measurable because API was unavailable.

Observed behavior: Markdown parsing/rendering stack is always imported by the product route module.
Root cause: Product descriptions support markdown rendering with sanitization.
Why this is a performance issue: Markdown libraries may add server bundle weight and route processing cost, especially if many products have long descriptions.
User impact: Potential slower product detail render.
SEO impact: Positive current behavior: description is SSR and sanitized. Must preserve.
Accessibility impact: Markdown output semantic structure should remain readable.
Commerce impact: Product description content must remain accurate.
Security/privacy impact: `rehype-sanitize` protects against unsafe HTML; do not remove without equivalent.

Recommended M7.3B action: Measure route bundle/server impact before considering lazy or conditional markdown rendering.
Allowed implementation: Conditional render path only if product has description, while preserving SSR and sanitization.
Forbidden implementation: Client-only product descriptions, unsanitized markdown/HTML, or removing product descriptions for speed.

Acceptance criteria: Product detail SSR content and sanitized markdown remain intact.
Before metric: NOT MEASURED.
After target: Only if measured, reduced route processing/bundle without SEO loss.
Measurement method: Build/bundle analyzer if approved or server trace timing.
Regression tests: product detail tests, SEO structured-data tests, security/sanitization checks if changed.

Implementation risk: Medium.
Rollback strategy: Restore direct markdown imports.
Dependencies: Measurement tooling approval.
Deferred reason: Audit-only milestone and missing bundle size metric.

### PERF-06

ID: PERF-06
Title: Global stylesheet is large and contains paint/animation-heavy surfaces
Domain: Fonts/CSS
Severity: Low
Priority: P3
Status: Opportunity

Affected routes: all web routes
Affected files: `apps/web/app/globals.css`
Affected components: global shell, catalog, cart, checkout, account, admin

Evidence:
- source evidence: `globals.css` has 2771 lines.
- source evidence: contains sticky headers/sidebars, `backdrop-filter`, fixed overlays, shadows, transitions, and skeleton/toast animations.
- source evidence: `prefers-reduced-motion` disables selected animations/transitions.
- runtime evidence: CSS coverage/paint cost not measured.

Observed behavior: One global stylesheet covers public, commerce, account, and admin surfaces.
Root cause: RoSach uses a simple global CSS architecture from earlier milestones.
Why this is a performance issue: Unused CSS and expensive paint effects can affect parse/style/paint costs, but impact is unmeasured.
User impact: Potential lower-end device paint cost.
SEO impact: Low; CSS must preserve content visibility and layout.
Accessibility impact: Reduced motion handling exists and must be preserved.
Commerce impact: Checkout/cart layout and states must remain stable.
Security/privacy impact: N/A.

Recommended M7.3B action: Measure CSS size/coverage first; only then consider scoped CSS cleanup.
Allowed implementation: Targeted removal of proven unused CSS or heavy effects if visual/accessibility regressions pass.
Forbidden implementation: Redesign, broad palette/spacing rewrite, or removing focus/reduced-motion/accessibility states.

Acceptance criteria: No visual/UX regression on M7.1-approved routes.
Before metric: CSS line count only; bytes/coverage NOT MEASURED.
After target: Measurement-backed reduction or accepted debt.
Measurement method: Build asset inspection/browser coverage if available.
Regression tests: route tests, visual/browser QA if approved.

Implementation risk: Medium because CSS is shared.
Rollback strategy: Revert targeted CSS patch.
Dependencies: Browser/CSS coverage tooling.
Deferred reason: Audit-only milestone.

### PERF-07

ID: PERF-07
Title: Cart/checkout/account interactions are client-heavy by business need
Domain: Runtime Interaction
Severity: Medium
Priority: Maintain/P2
Status: Maintain with targeted measurement

Affected routes: `/gio-hang`, `/thanh-toan`, `/thanh-toan/thanh-cong`, `/tai-khoan`, `/tai-khoan/*`
Affected files: `apps/web/features/cart/cart-provider.tsx`, `apps/web/features/cart/cart-page.tsx`, `apps/web/features/checkout/checkout-page.tsx`, `apps/web/features/checkout/checkout-success-page.tsx`, `apps/web/features/account/account-shell.tsx`
Affected components: cart provider, quantity controls, checkout form, address selector, account guard

Evidence:
- source evidence: cart provider uses state, context, request versioning, optimistic updates, toast timers, and product metadata enrichment.
- source evidence: checkout uses address loading, selector dialog, idempotency key lifecycle, submit state, session storage confirmation.
- source evidence: account shell uses client auth guard.
- runtime evidence: INP/long task/rerender count NOT MEASURED.

Observed behavior: Commerce/private routes depend on client state and browser storage.
Root cause: Authenticated cart/checkout/account workflows are user-specific and interactive.
Why this is a performance issue: High-frequency updates and broad context changes can affect INP if the subtree grows.
User impact: Potential latency on quantity updates, checkout submit, address selector, and cart changes.
SEO impact: Low; these routes are noindex/private/transactional.
Accessibility impact: High safety requirement for dialogs, focus, disabled states, and live regions.
Commerce impact: High; do not compromise pricing, stock, cart, idempotency, or order semantics.
Security/privacy impact: High; do not cache or SSR private data publicly.

Recommended M7.3B action: Measure interactions before optimizing; keep client implementation where business behavior requires it.
Allowed implementation: Narrow rerender scope or localize state only with tests and no commerce change.
Forbidden implementation: Cross-user caching, static/private data generation, removing idempotency, or weakening auth guard.

Acceptance criteria: Cart/checkout/account tests pass and interaction remains accessible.
Before metric: INP NOT MEASURED.
After target: Measured improvement only if bottleneck confirmed.
Measurement method: Browser interaction profiling if tooling available.
Regression tests: cart, checkout, account, auth tests.

Implementation risk: High for commerce.
Rollback strategy: Restore current client flows.
Dependencies: Browser/runtime profiling.
Deferred reason: Audit-only milestone.

### PERF-08

ID: PERF-08
Title: Public PageSpeed/Lighthouse/Core Web Vitals not measured
Domain: Teacher Checklist
Severity: Info
Priority: Deferred
Status: Requires tooling/deployment

Affected routes: all public routes
Affected files: `CHUONG 8 - SEO AUDIT CHECKLIST .xlsx`, docs 72, docs 75-79
Affected components: N/A

Evidence:
- teacher checklist evidence: rows require Google PageSpeed, mobile-friendly test, PageSpeed Insights, and Lighthouse-style validation.
- tooling evidence: no repository Lighthouse script/package found; no package installed.
- deployment evidence: no public URL.
- runtime evidence: only local HTTP timing was collected.

Observed behavior: Teacher performance certification cannot be honestly marked PASS.
Root cause: Public deployment and/or approved tooling are not present.
Why this is a performance issue: It blocks external certification, not source-code correctness.
User impact: Unknown until measured.
SEO impact: Public PageSpeed and mobile validation remain deployment requirements.
Accessibility impact: N/A.
Commerce impact: N/A.
Security/privacy impact: N/A.

Recommended M7.3B action: Keep as deferred unless Technical Lead approves local Lighthouse/browser audit tooling.
Allowed implementation: Add measurement-only script in M7.3B only with approval.
Forbidden implementation: Installing packages in M7.3A, claiming PageSpeed/CWV pass without data, or optimizing blindly.

Acceptance criteria: Public validation marked M7.5; local lab metrics only if measured.
Before metric: NOT MEASURED.
After target: Baseline numbers exist when tooling/deployment is available.
Measurement method: Public PageSpeed after deployment; local Lighthouse only if available/approved.
Regression tests: N/A.

Implementation risk: Low.
Rollback strategy: N/A.
Dependencies: Deployment or approved tooling.
Deferred reason: No public URL and no approved Lighthouse script.
## M7.3B validation-only closure — 2026-07-22

M7.3B used the accepted M7.3A local runtime baseline and a source-first validation pass. No candidate met the evidence threshold for source implementation. Product image behavior remains correct for the observed surfaces: grid images are lazy, the product hero is eager, and the fallback is retained. Server-side product/category metadata and page fetches could not be counted reliably from the browser; this remains validation-only rather than a basis for memoization. The global SiteChrome/CartProvider boundary has real interactive responsibilities, but no measured overhead justified a refactor. Markdown stays server-rendered and sanitized; CSS and commerce runtime had no measured defect.
### M7.3B final build-lock closure

The Windows Prisma query-engine lock was resolved operationally after repository-owned runtime/watch processes were stopped. A root `npm run build` then passed; no performance finding, score, or source implementation changed.
