# M7.1A UI and CSS Consistency Audit

Status: AUDIT ONLY

## Design Language

Current design language:

- Editorial bookstore storefront.
- Warm paper background.
- Burgundy primary accent.
- Serif display headings.
- Sans-serif body UI.
- Rounded cards and pill CTAs.
- Dense, utilitarian admin surfaces using the same color tokens.

Overall status: WARN.

The public storefront feels coherent. The admin area is usable but less polished and mixes older operational wording with newer editorial visual tokens.

## Component Consistency

| Component | Status | Evidence | Notes |
|---|---|---|---|
| Button | WARN | `.button-link`, form buttons, admin buttons, secondary/danger buttons | Visual treatment varies between public, auth, cart, and admin |
| Card | PASS | Product, account, checkout, order, admin cards share surface/border tokens | Border radius varies but remains acceptable |
| Input | PASS | Inputs/selects use border, radius, min-height patterns | Admin and auth forms are consistent enough |
| Select | PASS | Catalog/admin filters use native selects with labels | Good for local demo |
| Badge | PASS | Stock, discount, order status badges present | Color semantics are clear |
| Dialog | WARN | Cart confirmation, checkout address selector, admin transition dialog | Roles present; focus trap not confirmed |
| Toast | PASS | Cart provider uses toast region with `aria-live` | Good baseline |
| Icon | WARN | Mostly text and symbolic characters, few icon buttons | M7 UX can add icons later if approved |
| Table | PASS | Admin orders table has desktop table and mobile card list | Good responsive strategy |
| Form | PASS | Labels are present; submit locking exists in key flows | Some helper copy can improve |
| Pagination | PASS | Catalog pagination is clear and keyboard-link based | Good |
| Navbar | WARN | Desktop is clear; mobile horizontal scroll is functional but not obvious | Consider mobile menu or scroll affordance |
| Footer | PASS | Minimal and consistent | Good |
| Sidebar | PASS | Account sidebar is clear and responsive | Admin has no global sidebar |
| Color | PASS | Uses paper, surface, burgundy, muted, error, success tokens | Good brand consistency |
| Border radius | WARN | Public hero/cards use 18-28px; admin uses 8-10px | Difference is acceptable but should be documented |
| Shadow | PASS | Light editorial shadows | No excessive visual noise |
| Hover | PASS | Product cards and CTAs have hover states | Good |
| Transition | PASS | Short transitions; reduced-motion block exists | Good |
| Animation | PASS | Toast/skeleton/cart badge only | Reduced motion partially handled |

## CSS Consistency

| CSS area | Status | Evidence | Notes |
|---|---|---|---|
| Margin | PASS | Major layouts use centered containers and section spacing | Good |
| Padding | PASS | Cards/forms use stable padding | Good |
| Gap | PASS | Grid/flex gaps are consistent | Good |
| Grid | PASS | Catalog/product/checkout/admin use predictable grids | Good |
| Flex | PASS | Header/actions/card footers are simple | Good |
| Responsive spacing | WARN | Mobile works but header nav compresses into scroll | Improve affordance later |
| Alignment | PASS | No major alignment breaks observed | Good |
| Overflow | WARN | Tablet product detail metadata overflow; mobile header nav scroll | No page-wide horizontal body overflow observed beyond intended nav |
| Z-index | PASS | Header, drawer, dialog, toast layers are separated | Good |
| Transition | PASS | Simple transitions only | Good |
| Animation | PASS | Skeleton shimmer, toast, cart badge | No excessive animation |

## UI Consistency Findings

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| Medium | Public and admin button styles diverge | `.button-link` pill buttons vs admin rectangular buttons | Define admin/public button variants in UX plan |
| Medium | Admin terminology is inconsistent | `Product`, `Variant`, `Soft-delete`, `Active`, `Inactive` appear beside Vietnamese copy | Create UI glossary and apply later |
| Medium | Mobile header navigation is functional but not self-evident | Runtime reports `NAV` horizontal overflow with `overflow-x:auto` at `390px` | Add scroll hint or approved mobile nav pattern |
| Medium | Product detail facts need wrapping hardening | ISBN overflow at tablet width | Add `overflow-wrap:anywhere`/grid constraints later |
| Low | Icon usage is sparse | Mostly text controls | Add icons only where they clarify tools/actions |

## Dialog, Toast, Empty, Error, Loading

| Experience | Status | Evidence |
|---|---|---|
| Confirmation dialog | PASS | Cart confirmation uses `role=alertdialog`, modal labeling, cancel ref |
| Address selector dialog | PASS | Checkout selector uses `role=dialog`, `aria-modal`, title id |
| Admin transition dialog | PASS | Uses `role=dialog`, cancellation reason validation |
| Toast | PASS | Toast region uses `aria-live=polite`, `role=status`, close button |
| Empty cart | PASS | Guest/empty cart pages exist |
| Empty orders | PASS | Orders empty panel exists |
| API error | PASS | Checkout/admin/orders expose alert/status messages |
| Loading | PASS | Cart, checkout, admin orders use skeleton or busy states |

## Overall UI/CSS Rating

Score: 7.5/10.

Conclusion: the visual language is coherent enough for local demo. M7.1B should focus on consistency polish, not redesign.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Public and admin button styles diverge | DEFERRED | No broad button redesign was performed because M7.1B is polish and this was not a blocking demo defect. | No source change | Existing UI tests and runtime admin/customer smoke passed. | Button variant system can be revisited in a later UX system milestone. |
| Admin terminology is inconsistent | FIXED | Applied Vietnamese-facing terminology in admin catalog list, product editor, taxonomy manager, and admin orders intro copy. | `apps/web/app/admin/catalog/page.tsx`, `apps/web/app/admin/catalog/[id]/page.tsx`, `apps/web/features/catalog/taxonomy-manager.tsx`, `apps/web/features/admin-orders/admin-orders-page.tsx` | Focused admin tests and full `npm run test` passed. | Internal type/API names remain English. |
| Mobile header navigation is functional but not self-evident | FIXED | Added explicit mobile menu button and visible grid menu with ARIA state. | `apps/web/features/shell/site-header.tsx`, `apps/web/app/globals.css`, `apps/web/features/shell/site-header.test.tsx` | Header regression passed; runtime keyboard check passed for Tab, Enter, Space, Escape, link click, and route close. | This is a compact menu, not a redesigned drawer. |
| Product detail facts need wrapping hardening | FIXED | Added wrapping policy for product facts. | `apps/web/app/globals.css` | Runtime responsive smoke reported no horizontal overflow. | None for reproduced case. |
| Icon usage is sparse | DEFERRED | No icon system or new dependency was added. | No source change | Scope compliance: no package/dependency added. | Optional UX enhancement later. |
