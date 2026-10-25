# M7.5A Full System Defect Register

Status: M7.5D APPROVED / CLOSED by the final Technical Lead and Product Owner scope decision dated 2026-07-23. Earlier V1-V3 findings below are retained as historical evidence and are superseded where noted.

## M7.5D Defect Summary

| ID | Severity | Area | Current Status | Decision |
|---|---|---|---|---|
| M75-CONFIG-001 | HIGH deployment gate | Production-like Web/API configuration | FIXED / VERIFIED / CLOSED | Central full `/api/v1` base and same-site local origin |
| M75-SEED-001 | HIGH data-integrity gate | Repeated seed after runtime inventory movement | FIXED / VERIFIED / CLOSED | Reconcile deterministic baseline with non-seed ledger deltas |
| M75-PERF-001 | LOW | Catalog image LCP advisory | CLOSED - NOT REPRODUCED IN PRODUCTION | Production image loaded once; retain lazy/default card policy |
| M75-CHATBOT-001 | Former HIGH certification gate | Published Typebot result integration | ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION | Working search and canonical product navigation retained unchanged |
| M75-CHATBOT-001A | Former presentation gate | Typebot product image presentation | ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION | Chatbot image rendering is out of project scope |
| M75-CHATBOT-001B | Former UX gate | Typebot no-result retry | ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION | No-result retry improvement is out of project scope |

### M75-CHATBOT-001

- Reproduced: fresh embedded Chromium starts the published Typebot session and submits input successfully; Typebot Cloud returns HTTP 200 with the no-result branch and no product card/link for searches intended to exercise the catalog flow.
- Local boundary evidence: the production-like local chatbot API returns real products for supported search intent, with valid image and canonical product URLs.
- Impact: V1 cannot certify keyword/category/author-price result cards, `Tìm lại`, first/different product navigation, or stale-URL prevention in either standalone or embedded Typebot.
- Scope decision: no workspace/flow change was made. The next action requires Technical Lead approval to inspect and correct the published HTTP endpoint/tunnel or response-variable mapping, followed by a fresh full chatbot rerun.
- Final status: OPEN / HIGH certification gate; M7.5D remains open.

#### V2 divergence and correction status

- Local and current HTTPS tunnel calls use the exact Typebot body and return matching HTTP 200 semantics; a supported category request returns three products.
- The published flow diverges first: it did not hit the current ngrok inspection session and retained the no-result behavior, confirming a stale published tunnel endpoint.
- Actual backend slots are camelCase (`product1Title`, `product1Url`, etc.) inside the wrapped `data.data` response. Typebot must map these actual fields; the backend API contract remains unchanged.
- Typebot workspace authentication was unavailable in this execution environment. Required save/publish and fresh standalone/embedded product navigation evidence remain pending Product Owner action.
- V2 status: OPEN / REQUEST CHANGES. Repository-side correction is neither required nor authorized.

#### Final published-runtime rerun (2026-07-23)

- Fresh standalone public bot returned `startChat` HTTP 200 with the same public ID and a published timestamp/version. The current ngrok tunnel received the Typebot/Vercel POSTs at exactly `/api/v1/chatbot/search`; observed responses were HTTP 200 with no 429/500.
- Price search and a second category search returned real product titles, authors, prices and valid canonical URLs. Product A opened `/sach/luoc-su-nhung-phat-minh`; product B opened `/sach/chuyen-cua-nhung-vi-sao`; URLs differed. “Tìm lại” returned the input and the second request was fresh.
- First published-runtime divergence after the corrected result branch: the rendered Typebot product message contains title/author/price text but no image element, although the tunnel response contains `product1Image`/`product2Image` URLs. The required image certification therefore fails.
- No-result query returned the safe no-result text, but the published branch exposed no “Tìm lại” control. The required no-result retry certification therefore also fails.
- Embedded widget repeated the product A/B and retry behavior at `390x844`, with one launcher, one host, no document overflow, and no console errors. Its rendered product result likewise contained no image element.
- A fresh authenticated Admin exclusion check could not be completed after the local API/Web/SQL runtime stopped during reconnect; the anonymous route redirected to `/` and is not valid evidence for Typebot absence. Existing approved Admin evidence is not reused as fresh V2 evidence.
- Final status remains OPEN / HIGH certification gate. These are published-flow presentation/branch defects; backend, catalog, Admin, Staff and Commerce Core remain closed and are not reopened.

#### V3 split disposition

- `M75-CHATBOT-001A` — Product image presentation — **OPEN / HIGH certification gate**. Local and tunnel responses contain three non-empty Class B absolute local URLs under `http://127.0.0.1:3000/product-images/...`. They are not public HTTPS assets and an HTTPS Typebot standalone page cannot treat loopback HTTP as a public image origin. In addition, the embedded local result created no `<img>` element, so binding cannot yet be proven correct; this is not accepted as deployment-only debt until the editor mapping/Image block is inspected and rebound.
- `M75-CHATBOT-001B` — No-result retry — **OPEN / HIGH certification gate**. Published no-result text renders, but no `Tìm lại` button is emitted. It must connect to new user input, then result reset, HTTP request and condition. No backend/API correction is required.
- Fresh authenticated Admin exclusion is **CLOSED / PASS**. Admin loaded dashboard, revenue, product statistics, orders, catalog and inventory; every route had zero custom launcher, zero `typebot-bubble`, zero Typebot script/host, no Console error and no failed response.
- The current execution environment has no authenticated Typebot editor session. No mapping, Image block, no-result wiring, save or publish action was claimed. 001A/001B remain open pending Product Owner workspace correction and a fresh published rerun.

#### Final Product Owner scope disposition (authoritative, 2026-07-23)

- The Product Owner accepts the chatbot in its current state. Its working catalog search and canonical product navigation remain unchanged.
- `M75-CHATBOT-001A` is **ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION**. Chatbot image binding/rendering and standalone/embedded chatbot image certification are out of scope.
- `M75-CHATBOT-001B` is **ACCEPTED / CLOSED BY PRODUCT OWNER SCOPE DECISION**. The no-result `Tìm lại` improvement is out of scope.
- No Typebot flow, response mapping, chatbot API, source, schema, migration, package, or Commerce Core correction is required. These historical findings no longer block M7.5D, M7.6, or deployment.
- The remaining normal-catalog image gate passes: 24 active public products have 24 valid, unique PNG primary covers; every product has exactly one primary `ProductImage`, `sortOrder=0`, a meaningful Vietnamese alt, and `/product-images/<slug>/cover.png` without a stored runtime origin.
- Final milestone disposition: **M7.5D APPROVED / CLOSED; M7.6 READY**.

### M75-CONFIG-001

- Reproduced: origin-only/mismatched Web configuration caused `/san-pham` error state; mixed `localhost`/`127.0.0.1` also prevented refresh-cookie reuse after hard navigation.
- Correction: one strict `NEXT_PUBLIC_API_URL` resolver, all clients routed through it, examples aligned to `127.0.0.1`, and malformed/missing/double-prefix tests added.
- Evidence: production build, HTTP 200 real catalog, Customer login plus cookie refresh, focused 15/15 config tests.
- Final status: CLOSED.

### M75-SEED-001

- Reproduced: after a real checkout moved variant 2021 from 13 to 11 with ledger delta -2, repeated demo seed reset on-hand to 13 but retained the ledger.
- Root cause: the inventory upsert unconditionally wrote the deterministic `onHandQuantity`.
- Correction: derive reconciled stock from the deterministic baseline plus non-seed ledger deltas; retain seed-owned initial/demo-order movements separately.
- Evidence: seed x2, validation `blocking: false`, seed integration 9/9 and full suite 432/432.
- Final status: CLOSED.

## M7.5C Defect Summary

| ID | Severity | Area | Current Status | Decision |
|---|---|---|---|---|
| M75-UX-001 | LOW | Admin catalog responsive containment | FIXED / VERIFIED | Paint-contain the intentional taxonomy scroller; preserve inner scrolling |
| M75-UX-002 | LOW | Customer order-detail responsive reflow | FIXED / VERIFIED | Allow grid shrink and wrap immutable order number |
| M75-PERF-001 | LOW | Catalog image LCP advisory | NOT MEASURED IN PRODUCTION / ACCEPTED DEBT | Production build passed; production route data was unavailable under the current local API-base configuration |

### M75-UX-001

- Route/component: `/admin/catalog`; `.admin-taxonomy-table-wrap`.
- Environment: Chrome development runtime, `360x800`, `clientWidth=345`.
- Before: root `scrollWidth=775`; programmatic root horizontal scroll reached `430.4px`.
- Root cause: the intentional `960px` semantic table was inside a `279px` scroll wrapper, but paint overflow contributed to root scrollable overflow.
- Correction: `contain: paint` on the table wrapper, bounded mobile navigation, and Admin mobile root clipping.
- After: root `scrollWidth=345`, `scrollX=0`; inner wrapper retained `scrollWidth=960`.
- Regression/manual retest: focused taxonomy CSS contract plus existing taxonomy tests; root remained bounded after hot reload.
- Final status: FIXED / VERIFIED, LOW.

### M75-UX-002

- Route/component: `/tai-khoan/don-hang/RS20260720164841ZKZRZ3`; order-detail grid/H1.
- Environment: deterministic Customer fixture, Chrome `360x800`, `clientWidth=345`.
- Before: root `scrollWidth=365`; the implicit detail track expanded to about `349px` due to the long order number.
- Root cause: detail/grid/heading boundaries lacked a shrink contract and the H1 could not wrap anywhere.
- Correction: `min-width: 0` on the detail/grid/heading boundaries and `overflow-wrap: anywhere` on the order heading.
- After: root `scrollWidth=345`; H1 remained inside the `312.8px` account content width.
- Regression/manual retest: focused order-detail CSS contract plus existing Customer order-detail safety tests.
- Final status: FIXED / VERIFIED, LOW.

## Confirmed defects

| ID | Severity | Area | Current status | Decision |
|---|---|---|---|---|
| M75-ADMIN-CATALOG-001 | HIGH candidate | Admin catalog classification UI | Confirmed from source and reported browser evidence | Authorized bounded correction |
| M75-ADMIN-AUTH-001 | HIGH candidate | Admin route access and unauthorized UX | Confirmed from source: CUSTOMER is accepted by the client shell and anonymous routes go to login rather than the required safe denial path | Authorized bounded correction |

### M75-ADMIN-CATALOG-001

- Preconditions: an authenticated Admin or Staff opens `/admin/catalog` and the taxonomy request returns categories, authors, or publishers.
- Reproduction: inspect the lower section; switch classification type; edit a row; resize to mobile width.
- Expected: separate tabs, aligned headers/cells, wrapped descriptions, usable numeric input, distinct labelled controls, and explicit loading/empty/error/retry states.
- Actual baseline: an unstructured `<ul>` contains three forms with no table/grid contract. Controls and labels can concatenate and there is no status filter or retry state.
- Root cause: `apps/web/features/catalog/taxonomy-manager.tsx` renders all row fields and actions inline; no taxonomy-specific CSS layout exists.
- Correction: semantic table with tabs, status filter, bounded overflow, responsive behavior, and explicit action groups. Keep existing API/mutations.
- Regression: taxonomy component tests plus desktop/mobile browser checks.

### M75-ADMIN-AUTH-001

- Preconditions: anonymous, CUSTOMER, STAFF, or ADMIN visits an `/admin/*` route directly or through client navigation.
- Expected: only `/admin/login` is anonymous-accessible; CUSTOMER and anonymous users do not receive Admin shell/content; CUSTOMER receives the safe denial message and is redirected to `/`; privileged users enter the shell according to RBAC; privileged users visiting login go to dashboard.
- Actual baseline: `AdminShell` checks only whether `bootstrapSession()` succeeds, so a CUSTOMER can receive the Admin shell. Anonymous operational routes are redirected to the Admin login form.
- Root cause: `apps/web/features/admin/admin-shell.tsx` has an authentication-only gate and no role decision. `LoginPage` does not bootstrap an existing Admin session.
- Correction: one client layout-boundary policy that gates before children render, distinguishes ADMIN/STAFF from CUSTOMER/anonymous, and handles the privileged login route.
- Regression: route matrix tests, direct URL/browser checks, no protected-content flash, and API 401/403 checks.

## Discovery-only register

The final pass must record any additional BLOCKER/HIGH/MEDIUM/LOW or ACCEPTED DEBT issue discovered in authentication, public catalog, Commerce, Typebot, Admin, runtime, security, SEO, or build. Unrelated BLOCKER/HIGH items require separate Technical Lead authorization.

## Fixture decision

Technical taxonomy records remain governed by the existing bounded cleanup and seed-validation rules. M7.5A does not raw-delete records or alter order/cart/inventory history. The Admin default operational filter excludes inactive/deleted and recognized technical fixture identities; an explicit all/QA view keeps history inspectable without polluting normal work.

## M7.5A final discovery evidence

- `npm run seed:validate -w '@rosach/api'` completed with `blocking: false`; all blocker counts were `0`. No database records were changed during this audit.
- Focused web regression passed with 17 tests. Full tests passed with API 185, Web 241, and Shared 1 tests; SEO regression passed with 48 tests.
- Browser evidence: Admin reached `/admin/dashboard`, `/admin/catalog` exposed the three classification tabs and active/inactive/all filter, page 2 navigation changed the product set, and Staff reached `/admin/catalog` with the shell present but no catalog mutation controls.
- Chrome certification used the deterministic customer fixture with a redacted identity only. `/admin`, `/admin/login`, `/admin/dashboard`, `/admin/revenue`, `/admin/product-statistics`, `/admin/orders`, `/admin/catalog`, `/admin/inventory`, and `/admin/khong-ton-tai` rendered no protected content or Admin navigation; operational routes ended at `/`, while `/admin/login` remained accessible.
- Customer Back/Forward verification did not reveal Admin content. Direct protected Admin API access returned HTTP 403 for the customer token. No console errors were recorded.
- Chrome responsive certification used `390x844`. Admin catalog product content, pagination, classification tabs, category/author/publisher sections, labels, inputs and action groups were verified. The taxonomy table used its intended horizontal scroll container; effective page horizontal scrolling stayed at `scrollX=0` after a horizontal gesture. Staff at the same viewport had no mutation controls.
- A directly reproduced LCP advisory is registered below. It is a LOW development warning only; no M7.5A image patch was made.

## M75-PERF-001

- **Title:** Next Image reports an above-the-fold catalog image as a possible LCP candidate.
- **Domain:** Performance / image loading.
- **Severity:** LOW.
- **Priority:** P3 / Deferred.
- **Exact route:** `/san-pham`.
- **Exact image source:** `/product-images/du-lieu-ke-chuyen/cover.png`.
- **Browser warning:** Next.js warned that the image was detected as LCP and suggested `loading="eager"` if it is above the fold.
- **Reproducibility:** Reproduced three times in the local Chrome development runtime during M7.5A-V1; no matching LCP value or user-facing delay was measured.
- **User impact:** Not demonstrated; advisory only.
- **Production-mode verification:** `npm run build` passed (47.8 seconds total command duration). The optimized server was started with the repository's existing `npm run start -w @rosach/web -- -p 3100` command. `/san-pham` reached the bounded catalog error state because the current local `NEXT_PUBLIC_API_URL` host was configured without the required `/api/v1` prefix; the API health endpoint remained HTTP 200 and `/api/v1/products` remained HTTP 200. No catalog image rendered, so the production LCP advisory and user-facing image timing were not measurable.
- **Current status:** NOT MEASURED IN PRODUCTION / ACCEPTED DEBT.
- **Proposed disposition:** Retain LOW/P3. Recheck with a valid production-like runtime environment or public deployment. Do not patch image priority from a development advisory alone and do not treat it as an M7.5C blocker.
