# M7.5C UX, Responsive, Accessibility and Runtime Polish Report

Status: bounded implementation and local certification complete; pending final Technical Lead review.

## Executive Result

**APPROVE WITH ACCEPTED DEBT.** Two directly reproduced LOW responsive defects were fixed with local CSS changes and focused regression tests. No BLOCKER, HIGH, or unresolved MEDIUM issue was found in the audited paths.

## Reconstructed Baseline

- Current documents 94-97, defect register, project memory, source, tests, CSS, and runtime were re-read. Earlier milestone notes were treated as historical evidence only.
- The accumulated dirty worktree was preserved. No reset, restore, stash, clean, destructive cleanup, commit, or push was used.
- Local Web URL: `http://localhost:3000`; API URL: `http://127.0.0.1:4000/api/v1`.
- Chrome responsive evidence: `360x800`; prior approved M7.5A-V1 evidence: `390x844`; desktop evidence: `1440x900`.

## Audit Scope

Public homepage, catalog, category, product, cart, checkout, login/register, 404, Customer account/address/order history/order detail, public chatbot, Admin dashboard/revenue/product statistics/orders/catalog/inventory, Staff read-only catalog, loading/empty/error/retry states, keyboard/labels/focus/table semantics, document overflow, console/hydration symptoms, image policy, and M75-PERF-001 were reviewed.

## Defects Discovered

### M75-UX-001 - Admin taxonomy document overflow

- Route/component: `/admin/catalog`, `.admin-taxonomy-table-wrap`.
- Environment: Chrome development runtime, `360x800`; `clientWidth=345`.
- Before: `documentElement.scrollWidth=775`; programmatic root horizontal scroll reached `430.4px`.
- Evidence: taxonomy wrapper was about `279px` wide with an intentional `960px` table; its paint overflow contributed to root scrollable overflow.
- Correction: `contain: paint` on the taxonomy scroll wrapper, bounded mobile-nav width, and Admin mobile root clipping.
- After: root `scrollWidth=345`, `scrollX=0`; inner wrapper retained `scrollWidth=960` for controlled horizontal scrolling.
- Status: FIXED / VERIFIED, LOW.

### M75-UX-002 - Customer order-detail responsive reflow

- Route/component: `/tai-khoan/don-hang/RS20260720164841ZKZRZ3`, order-detail grid and heading.
- Environment: deterministic Customer fixture, Chrome `360x800`; `clientWidth=345`.
- Before: root `scrollWidth=365`; the detail grid expanded to about `349px` because the long immutable order number supplied a min-content width.
- Evidence/root cause: detail/grid/heading boundaries lacked a shrink contract and the order H1 did not wrap anywhere.
- Correction: `min-width: 0` on the detail/grid/heading boundaries and `overflow-wrap: anywhere` on the order heading.
- After: root `scrollWidth=345`; H1 remained inside the `312.8px` account content width.
- Status: FIXED / VERIFIED, LOW.

## Directly Corrected Defects

Only the two findings above were changed. No product redesign, business logic, API, RBAC, Commerce Core, Typebot, schema, migration, image priority, or deployment change was made.

## Public UX

`/`, `/san-pham`, `/danh-muc`, `/danh-muc/van-hoc`, three representative `/sach/[slug]` routes, `/gio-hang`, `/thanh-toan`, `/tai-khoan`, `/tai-khoan/don-hang`, login/register, and 404 rendered expected primary content at the audited desktop/mobile widths. No public document-level horizontal overflow was observed. Checkout was inspected without submitting an order.

## Customer Flows

The redacted deterministic Customer fixture reached account overview, order history (six cards plus pagination), an owned order detail (shipping snapshot, payment, timeline, item and totals), cart, and checkout. Customer order detail is now bounded at `360x800`. No order, address, cart, price, stock, or historical record was mutated.

## Chatbot UX

One launcher was observed. Open, close, reopen, accessible names, touch target, mobile fit, and absence from Admin routes were verified. No duplicate host was found. Typebot flow and chatbot API contract were not changed.

## Admin UX

Admin SPA navigation rendered the expected headings for dashboard, revenue, product statistics, orders, catalog, and inventory. Catalog product cards, pagination, classification tabs, category/author/publisher sections, descriptions, sort-order inputs, labels, and separated actions remained usable. Staff read-only behavior and the M7.5A-V1 `390x844` evidence remain valid; no mutation control or API contract was changed.

## Responsive Matrix

| Route/surface | Actor | Viewport | Result |
|---|---|---:|---|
| Public core routes | Anonymous | 1440x900, 390x844, 360x800 | PASS; expected H1/content; no document overflow |
| Customer account/orders/checkout | Customer | 360x800 | PASS after M75-UX-002 |
| Admin six-route shell | Admin | desktop/mobile evidence | PASS; navigation and content usable |
| Admin taxonomy | Admin | 360x800 and prior 390x844 certification | PASS after M75-UX-001; inner scroll retained |
| Admin taxonomy read-only | Staff | prior 390x844 certification | PASS; no mutation controls |
| Chatbot launcher | Anonymous | public desktop/mobile | PASS; absent on Admin |

## Accessibility

Critical paths retain H1 structure, explicit labels, named buttons, visible focus styles, meaningful image alt text, semantic table captions/headers, keyboard-capable controls, and status text independent of color. The two fixes improve reflow without hiding content or replacing semantic tables. This was a bounded critical-path review, not WCAG certification.

## Loading, Empty, Error and Retry

Current public catalog, Customer orders, Admin reporting/orders/catalog/inventory/taxonomy implementations and tests expose deterministic loading and terminal states. Taxonomy failure retains a named retry action; missing/unowned Customer order retains a safe not-found state and return link. No raw API/Prisma payload or blank permanent error panel was observed.

## Runtime Console and Network

Successful audited routes showed no reproduced hydration failure, unhandled exception, or unexpected route error. Representative local images, manifest icons, and fallbacks rendered. Development timing is not production performance evidence. Network/Lighthouse/PageSpeed certification remains deployment-dependent.

## M75-PERF-001 Disposition

The formal record remains in `docs/96-m7-full-system-defect-register.md`. `npm run build` passed and an optimized Web server was started on port 3100. Production image measurement was not valid: the current local `NEXT_PUBLIC_API_URL` omitted the required `/api/v1` prefix, so `/san-pham` rendered its bounded catalog error state while API health and `/api/v1/products` remained HTTP 200. No catalog image rendered; therefore the development warning was neither confirmed nor disproved in production. Status is **NOT MEASURED IN PRODUCTION / ACCEPTED DEBT**, LOW/P3. Catalog cards retain default/lazy image priority and the detail hero remains the only eager/high-priority product image. No image-priority patch was made from the advisory alone.

## Security and Privacy Regression

Existing M7.5A-V1 evidence remains valid: Anonymous/Customer Admin denial without protected-shell flash, Back/Forward protection, refresh denial, direct Customer Admin API HTTP 403, Staff mutation denial, Customer order isolation, reporting PII exclusion, sanitized markdown, public-only Typebot data, and no frontend secret exposure. Auth architecture was not changed.

## Tests

- Focused: `npm run test -w @rosach/web -- --run features/catalog/taxonomy-manager.test.tsx features/orders/order-detail-page.test.tsx` -> PASS, 2 files, 7 tests.
- Format: `npm run format:check` -> PASS.
- Lint: `npm run lint` -> PASS.
- Type-check: `npm run type-check` -> PASS.
- Full tests: `npm run test` -> PASS on the serial rerun: API 27 files/185 tests, Web 47 files/243 tests, Shared 1 file/1 test; 429 tests total. The first attempt exceeded the 120-second command window and emitted an environment-related EPIPE/navigation diagnostic; no source change was made, and the 300-second serial rerun completed successfully.
- SEO regression: `npm run test -w @rosach/web -- tests/seo` -> PASS, 9 files/48 tests.
- Seed validation: `npm run seed:validate -w @rosach/api` -> PASS, `blocking: false`, all blocker counts zero; no data mutation.
- Build: `npm run build` -> PASS, 47.8 seconds total command duration; Next production compilation completed in 8.9 seconds.
- `git diff --check` -> PASS after the documentation update.

## Manual Route Matrix

| Actor | Routes/surfaces | Result |
|---|---|---|
| Anonymous | `/`, `/san-pham`, `/danh-muc`, `/danh-muc/van-hoc`, `/sach/du-lieu-ke-chuyen`, `/gio-hang`, `/dang-nhap`, `/dang-ky`, unknown route | PASS in the development runtime; expected content/states and no observed document overflow |
| Customer | `/tai-khoan`, `/tai-khoan/don-hang`, owned order detail, `/thanh-toan` | PASS; no order submitted and no customer data mutated |
| Admin | dashboard, revenue, product statistics, orders, catalog, inventory | PASS; SPA navigation and catalog controls remained usable |
| Staff | `/admin/catalog` classification surface | PASS using retained M7.5A-V1 read-only evidence |
| Chatbot | public launcher open/close/reopen and Admin exclusion | PASS; one host and no duplicate launcher |

## Quality Gates

| Gate | Result |
|---|---|
| Format | PASS |
| Lint | PASS |
| Type-check | PASS |
| Focused regression | PASS, 7 tests |
| Full tests | PASS, 429 tests |
| SEO regression | PASS, 48 tests |
| Seed validation | PASS, `blocking: false` |
| Production build | PASS |
| `git diff --check` | PASS |

## Files Created

- `docs/98-m7-ux-responsive-accessibility-polish-report.md`

## Files Modified

- `apps/web/app/globals.css` (bounded responsive containment and order reflow rules; file already contained prior approved dirty work).
- `apps/web/features/catalog/taxonomy-manager.test.tsx`
- `apps/web/features/orders/order-detail-page.test.tsx`
- `docs/00-document-map.md`
- `docs/52-m7-responsive-audit.md`
- `docs/96-m7-full-system-defect-register.md`
- `docs/99-project-memory.md`

## Database Records Changed

None.

## Scope Verification

Package installed: NO. Package files changed: NO. Schema/migration: NO. API/database source: NO. Commerce Core/historical order or inventory data: NO. Typebot flow/API contract: NO. Deployment: NO. Commit: NO. Push: NO.

## Remaining Defects

No unresolved BLOCKER, HIGH, or MEDIUM M7.5C defect was found.

## Accepted Debt

Public field Core Web Vitals, Safari/iOS, CDN/hosting, public PageSpeed, and multi-browser E2E/screenshot infrastructure remain deployment or future QA work. Remaining LOW/accepted debt is explicit in the defect register.

## M7.5D Readiness

READY WITH ACCEPTED DEBT after Technical Lead confirms the two LOW fixes and the evidence-based M75-PERF-001 disposition.

## Final Recommendation

Close M7.5C with the bounded corrections above. No redesign or architecture change is recommended from this pass.
