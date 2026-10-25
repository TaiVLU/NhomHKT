# M7.1A Accessibility Audit

Status: AUDIT ONLY

## Scope

Reviewed accessibility basics for:

- Semantic landmarks and headings.
- Form labels.
- Image alt text.
- Focus styles.
- Keyboard-oriented controls.
- Dialog roles.
- Toast live region.
- Empty/error/loading states.

No automated accessibility package was installed. No source code was changed.

## Accessibility Checklist

| Area | Status | Evidence | Notes |
|---|---|---|---|
| Landmarks | PASS | Header/footer/main present across pages | Good baseline |
| Navigation labels | PASS | Header nav has `aria-label`; breadcrumbs use `aria-label=Breadcrumb` | Good |
| Heading structure | PASS | Pages expose clear H1 | Good |
| Focus visible | PASS | Global `:focus-visible` outline exists for button/link/input/select/textarea | Good |
| Forms labels | PASS | Auth, catalog filters, account, checkout, admin forms use labels | Good |
| Buttons | PASS | Quantity, cart, dialogs, admin controls are button elements | Good |
| Images alt | WARN | Product cards have alt; product thumbnails use `alt=""` inside labeled buttons | Acceptable if treated as decorative |
| Dialog roles | PASS | Confirmation, address selector, admin transition dialogs have modal roles | Focus trap not confirmed |
| Toast | PASS | Toast region uses `aria-live=polite` and `role=status` | Good |
| Error states | PASS | Several errors use `role=alert` or status regions | Good |
| Loading states | PASS | `aria-busy` used in cart, checkout, admin order loading | Good |
| Reduced motion | PASS | CSS includes `prefers-reduced-motion` for animations/transitions | Good |
| Contrast | WARN | Palette appears readable, but no numeric contrast tool was run | Needs formal contrast pass later |
| Keyboard flow | WARN | Native controls are keyboardable; drawer/dialog focus trapping not fully verified | Add browser keyboard QA in later milestone |
| ARIA completeness | WARN | Some controls rely on visible text; generally okay | Confirm mobile drawer and dialogs thoroughly later |

## Empty and Error State Audit

| State | Status | Evidence |
|---|---|---|
| 404 | PASS | `/khong-ton-tai` returns custom 404 with H1 |
| No result | PASS | Catalog code has empty-state branch |
| Empty cart | PASS | Cart guest/empty message page renders |
| No order | PASS | Orders empty panel exists |
| API error | PASS | Admin/catalog/order/checkout components expose error text |
| Timeout/network error | WARN | Generic user messages exist; no dedicated timeout copy observed |
| Permission error | PASS | `/admin/403` exists |
| Validation error | PASS | Forms expose inline or alert messages |
| Toast | PASS | Cart provider handles success/error toast |
| Dialog | PASS | Dialog components have accessible roles and labels |

## Loading Experience Audit

| Area | Status | Evidence |
|---|---|---|
| Catalog route loading | PASS | `apps/web/app/san-pham/loading.tsx` exists |
| Cart loading | PASS | Skeleton cards and `aria-busy` |
| Checkout loading | PASS | Skeleton cards and `aria-busy` |
| Admin orders loading | PASS | Skeleton title/card |
| Account loading | WARN | Simple `Đang xác thực...` text, no skeleton | Acceptable but less polished |
| Layout shift | WARN | Remote images may settle late; fixed aspect ratios reduce impact | M7 performance/image pass recommended |

## Accessibility Findings

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| Medium | Dialog focus management not proven | Dialog roles present, but no focus trap evidence in audit | Add keyboard QA and focus trap if needed |
| Medium | Product thumbnail accessibility depends on button label | Nested images use `alt=""`; buttons have `aria-label` | Keep as decorative or add stronger thumbnail semantics |
| Medium | Mobile header nav discoverability | Horizontally scrollable nav | Improve mobile nav accessibility |
| Low | Contrast not numerically certified | Visual review only | Run formal contrast audit later |
| Low | Account loading is text-only | `Đang xác thực...` | Optional skeleton/polite status polish |

## Overall Accessibility Rating

Score: 7.0/10.

Conclusion: accessibility has a good semantic baseline. M7 should strengthen keyboard/dialog/mobile navigation and formal contrast evidence.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Dialog focus management not proven | DEFERRED | No dialog system redesign was performed in M7.1B. | No dialog source change | Existing dialog tests and runtime smoke did not find blocking errors. | Deeper dialog focus-trap audit remains future accessibility work. |
| Product thumbnail accessibility depends on button label | NOT REPRODUCIBLE | Kept thumbnail images decorative because the enclosing buttons provide descriptive labels. | No source change | Accessibility review found no blocking label issue in current product detail model. | Screen-reader-specific QA can revisit later. |
| Mobile header nav discoverability | FIXED | Added explicit menu button, `aria-controls`, `aria-expanded`, Escape close, link click close, route-change close, and focus restoration after Escape. | `apps/web/features/shell/site-header.tsx`, `apps/web/features/shell/site-header.test.tsx`, `apps/web/app/globals.css` | Unit regression passed; runtime keyboard closure check passed. | No full focus trap is used because the menu is inline navigation, not a modal drawer. |
| Contrast not numerically certified | DEFERRED | No formal contrast tooling was added. | No source change | Visual/runtime smoke found no blocking contrast issue. | Numeric contrast certification remains later accessibility QA. |
| Account loading is text-only | DEFERRED | No loading skeleton redesign was performed. | No source change | Runtime protected route smoke passed. | Optional UX polish later. |

### Mobile Navigation Keyboard Closure Evidence

Runtime check on `http://localhost:3000/` at `390x844`:

| Check | Result |
|---|---|
| Tab reaches Menu button | PASS |
| Enter opens menu | PASS, `aria-expanded=true` |
| Escape closes menu | PASS, `aria-expanded=false` |
| Focus returns to Menu after Escape | PASS |
| Space opens menu | PASS, `aria-expanded=true` |
| Tab moves through menu links | PASS, first link `Trang chủ`, second link `Danh mục` |
| Shift+Tab moves backward through links | PASS |
| Link click closes menu | PASS, `aria-expanded=false` |
| Route change closes menu | PASS, `aria-expanded=false` |
| Keyboard trap | PASS, no trap observed |
| Blocking console error | PASS, none observed |
| Failed network requests | PASS, none observed |
