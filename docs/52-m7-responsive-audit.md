# M7.1A Responsive Audit

## M7.5C Containment Addendum

- Wide semantic tables must keep their own horizontal scroll region from contributing to document-level overflow. The Admin taxonomy wrapper uses paint containment while preserving `overflow-x: auto`.
- Grid and flex children containing immutable identifiers such as order numbers must opt into shrinking with `min-width: 0`; identifiers must wrap rather than be clipped.
- Mobile certification compares root `scrollWidth` with `clientWidth` and separately verifies that intended inner scrollers retain a larger `scrollWidth`.

Status: AUDIT ONLY

## Viewports Tested

| Viewport | Size | Result |
|---|---:|---|
| Desktop | `1366x850` | PASS |
| Tablet | `768x900` | WARN |
| Mobile | `390x844` | WARN |

Routes tested:

- `/`
- `/san-pham`
- `/san-pham?q=atomic`
- `/danh-muc`
- `/danh-muc/m6-demo-van-hoc`
- `/sach/m6-demo-regular-in-stock`
- `/sach/m6-demo-out-of-stock-visible`
- `/dang-nhap`
- `/dang-ky`
- `/quen-mat-khau`
- `/dat-lai-mat-khau`
- `/gio-hang`
- `/thanh-toan`
- `/thanh-toan/thanh-cong`
- `/khong-ton-tai`

## Layout Findings

| Page group | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|
| Home | PASS | PASS | WARN | Header nav scrolls horizontally on mobile; hero typography is natural |
| Catalog | PASS | PASS | WARN | Mobile filter trigger appears; header nav scroll is the only overflow finding |
| Category list | PASS | PASS | WARN | Category cards collapse correctly |
| Category detail | PASS | PASS | WARN | Product grid remains usable |
| Product detail | PASS | WARN | WARN | Tablet product facts overflow on long ISBN; mobile stacks well |
| Auth pages | PASS | PASS | WARN | Forms fit; mobile warning comes from shared header nav overflow |
| Cart | PASS | PASS | WARN | Guest state fits; mobile warning comes from shared header nav overflow |
| Checkout | PASS | PASS | WARN | Guest login state fits; full authenticated checkout needs UX pass in M7.1B |
| Order success | PASS | PASS | WARN | Fallback state fits |
| Account | PASS | PASS | WARN | Account nav becomes two-column links; usable but dense |
| Admin catalog | PASS | WARN | WARN | Dense forms/tables; mobile usable but not polished |
| Admin orders | PASS | PASS | WARN | Desktop table plus mobile cards is a good pattern |
| 404 | PASS | PASS | WARN | Page fits; shared header nav warning |

## Grid and Flex Behavior

| Pattern | Status | Evidence |
|---|---|---|
| Product grid | PASS | Uses `auto-fill` minmax card sizing |
| Product detail | WARN | Desktop 2-column; mobile stacks; tablet facts overflow |
| Catalog layout | PASS | Sidebar hidden under `700px`, drawer trigger shown |
| Cart layout | PASS | Responsive two-column to one-column rules exist |
| Checkout layout | PASS | Responsive main/summary stacking exists |
| Admin orders table | PASS | Desktop table hidden on mobile; mobile card list displayed |
| Account layout | WARN | Sidebar links become two-column grid on mobile; acceptable but dense |

## Overflow Findings

| Severity | Location | Evidence | Recommendation |
|---|---|---|---|
| Medium | Product detail tablet | `.product-info`, `.product-facts`, ISBN `dd` overflow at `768px` | Add wrapping policy in approved implementation |
| Medium | Mobile header nav | `NAV` has `scrollWidth=223`, `clientWidth=32`, `overflow-x:auto` | Add mobile menu or stronger scroll affordance |
| Low | Open Library delayed images | Several lazy images not complete by audit snapshot | Keep fallback; consider owned assets/performance plan |

## Responsive Typography

| Check | Status |
|---|---|
| Hero H1 mobile line breaks | PASS |
| Catalog H1 mobile | PASS |
| Product H1 mobile | PASS |
| Long product names | PASS |
| Long ISBN/fact values | WARN |
| Button label wrapping | PASS |
| Form label wrapping | PASS |

## Overall Responsive Rating

Score: 7.5/10.

Conclusion: responsive architecture is sound. The main next steps are header navigation affordance, product facts wrapping, and admin density polish.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Product detail tablet `.product-facts` overflow | FIXED | Added `overflow-wrap:anywhere` to product fact values. | `apps/web/app/globals.css` | Runtime desktop/tablet/mobile route smoke reported 0 horizontal page overflow. | None for the reproduced long metadata case. |
| Mobile header nav horizontal scroll | FIXED | Added explicit mobile menu button and mobile grid menu, removing reliance on hidden horizontal scroll. | `apps/web/features/shell/site-header.tsx`, `apps/web/app/globals.css`, `apps/web/features/shell/site-header.test.tsx` | Header tests passed; runtime mobile keyboard check reported body overflow `0`. | Compact menu only; no full-screen drawer redesign. |
| Open Library delayed images | PARTIALLY FIXED | Added fallback for unusable Open Library 1px covers and already-complete image checks after hydration. | `apps/web/features/catalog/product-image.tsx`, `apps/web/features/catalog/product-card.test.tsx` | Runtime scroll through catalog showed 0 complete Open Library 1px images displayed; no failed image requests. | Some offscreen lazy Open Library images may remain pending until scrolled into view. |
| Full authenticated checkout responsive UX | DEFERRED | No checkout UI redesign was performed. | No checkout source change | Customer browser smoke reached checkout after login/cart flow. | Deep checkout layout polish remains a later approved UX task. |
