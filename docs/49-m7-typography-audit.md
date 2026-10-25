# M7.1A Typography Audit

Status: AUDIT ONLY

## Scope

Reviewed typography through:

- `apps/web/app/globals.css`
- Home, catalog, category, product detail, auth, cart, checkout, order success, account, admin catalog, admin orders, and 404 pages.
- Chromium runtime at desktop `1366x850`, tablet `768x900`, and mobile `390x844`.

## Typography System

| Token | Current value | Status | Notes |
|---|---|---|---|
| Serif display | `Cambria, "Times New Roman", Georgia, "Segoe UI", serif` | PASS | Good Vietnamese rendering in Chromium; homepage hero spacing is natural |
| Sans body | `"Segoe UI", ui-sans-serif, system-ui, ...` | PASS | Good readability for Vietnamese UI copy |
| Body line height | `1.55` | PASS | Comfortable for form and list pages |
| Body letter spacing | `0` | PASS | No global letter-spacing distortion |
| Body word spacing | `normal` | PASS | Prevents the previous abnormal word spacing class of defect |
| Eyebrow letter spacing | `0` | PASS | Avoids Vietnamese uppercase spacing issues |
| Hero H1 | `clamp(2.5rem, 5.2vw, 4.75rem)/1.04` | WARN | Visually strong; line height is tight but acceptable |
| General page H1 | `clamp(2.2rem, 4.5vw, 3.8rem)/1.12` | PASS | Consistent across catalog/product/message pages |
| Admin editor H1 | `clamp(1.8rem, 4vw, 2.6rem)` | PASS | Better density for admin context |
| Product card H2 | `1.15rem/1.35`, clamped to 3 lines | PASS | Stable cards and no observed overflow |

## Known Homepage Hero Typography Defect

Audit result: PASS.

Runtime computed styles for homepage H1 at mobile width `390px`:

- Text: `Đọc một trang, mở thêm một thế giới.`
- `font-family`: `Cambria, "Times New Roman", Georgia, "Segoe UI", serif`
- `font-size`: `40px`
- `line-height`: `41.6px`
- `letter-spacing`: `normal`
- `word-spacing`: `0px`
- `text-align`: `start`
- `max-width`: `760px`

The previous abnormal spacing around `thế giới.` did not reproduce. There is no `text-align: justify`, forced `text-wrap`, negative letter spacing, or non-normal word spacing on the hero heading.

## Heading Hierarchy

| Page group | Status | Evidence | Notes |
|---|---|---|---|
| Home | PASS | One clear H1 and section H2s | Good editorial hierarchy |
| Catalog | PASS | H1 `Khám phá sách`; filters use labels/headings | Good scan structure |
| Category list/detail | PASS | H1 category context; H2 not overused | Good |
| Product detail | WARN | H1 product name; H2 detail/related sections | Metadata values can overflow on tablet for long ISBN |
| Auth pages | PASS | Compact H1 and labeled inputs | Good |
| Cart/checkout | PASS | Clear H1/H2 and section titles | Good |
| Account | PASS | H1 inside content panels | Sidebar context is clear |
| Admin catalog/orders | WARN | Admin headings work, but language mixes English/Vietnamese | Terminology pass recommended |
| 404 | PASS | H1 `Không tìm thấy trang` | Clear |

## Vietnamese Rendering

| Check | Status | Evidence |
|---|---|---|
| Diacritics in hero | PASS | Runtime H1 rendered `Đọc một trang, mở thêm một thế giới.` |
| Diacritics in navigation | PASS | Header text rendered correctly at runtime |
| Diacritics in account/orders | PASS | Customer order page rendered Vietnamese labels correctly |
| Terminal output encoding | WARN | Some PowerShell `Get-Content` output is mojibake due console encoding, not source/runtime rendering |
| Admin terminology | WARN | Mixed language: `Product`, `Variant`, `Soft-delete`, `Active`, `Inactive` |

## Responsive Typography

| Viewport | Status | Evidence |
|---|---|---|
| Desktop `1366px` | PASS | No text overflow detected on audited public routes |
| Tablet `768px` | WARN | Product detail ISBN metadata overflow detected |
| Mobile `390px` | WARN | Header nav intentionally scrolls horizontally; content remains readable |

## Typography Findings

| Severity | Finding | Status | Recommendation |
|---|---|---|---|
| Medium | Product metadata values can overflow on tablet | WARN | Add wrapping policy for `dd` values and metadata grid in approved implementation |
| Medium | Admin copy mixes English/Vietnamese | WARN | Define Vietnamese admin terminology dictionary |
| Low | Hero line height is tight | WARN | Keep if brand-approved; verify on Safari/iOS before final polish |
| Low | Some demo text lacks Vietnamese accents | WARN | Content cleanup, not CSS defect |

## Overall Typography Rating

Score: 8.0/10.

Conclusion: typography is stable and brand-consistent, with focused polish needed for admin terminology and edge-case wrapping.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Product metadata values can overflow on tablet | FIXED | Added wrapping for product fact values so long ISBN/SKU/fact values stay inside their container. | `apps/web/app/globals.css` | Runtime desktop/tablet/mobile route smoke reported 0 horizontal page overflow; `npm run build` passed. | None for the reproduced product facts overflow class. |
| Admin copy mixes English/Vietnamese | FIXED | Replaced user-facing admin labels/messages with Vietnamese terminology for product, variant, inventory, history, hidden/inactive states, and admin/staff context. | `apps/web/app/admin/catalog/page.tsx`, `apps/web/app/admin/catalog/[id]/page.tsx`, `apps/web/features/catalog/taxonomy-manager.tsx`, `apps/web/features/admin-orders/admin-orders-page.tsx` | Admin catalog/detail focused tests passed; full `npm run test` passed. | Internal identifiers and API/domain model names remain English by design. |
| Hero line height is tight | NOT REPRODUCIBLE | Rechecked homepage hero typography; abnormal spacing around `thế giới.` did not reproduce. | No source change | Runtime computed style remained non-justified with natural spacing. | Safari/iOS visual QA remains a later broader device check. |
| Some demo text lacks Vietnamese accents | FIXED | Curated visible demo content and fallback descriptions with Vietnamese accents. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts` | Seed validation passed; public API returned curated Vietnamese demo product names and descriptions. | Stable slugs/SKUs remain ASCII and may include `m6-demo` for deterministic tests/contracts. |
