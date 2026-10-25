# M7.3A Image And Font Audit

Status: AUDIT ONLY

## Image Inventory

| Component/Route | Image Source | next/image or img | Rendered Size | Source Size Known | Width/Height | sizes | priority | loading | fetchPriority | Above Fold | LCP Candidate | Remote | Fallback | Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Logo/header | Text logo `RoSach` | N/A | Text | N/A | N/A | N/A | N/A | N/A | N/A | Yes | Possible text LCP on simple pages | No | N/A | Low |
| Homepage hero | CSS `.hero-book` decorative book | CSS/text | Aspect ratio 3/4 max 300px | N/A | CSS aspect ratio | N/A | N/A | N/A | N/A | Yes | Possible visual candidate, not image request | No | N/A | Low |
| Homepage featured/newest cards | product primary image | `ProductImage` -> `next/image` | Card ratio 3/4 | Remote unknown | `fill` | `(max-width: 700px) 50vw, (max-width: 1200px) 25vw, 220px` | No | Lazy default | Not set | Some above fold | Product cover candidate | Often Open Library/API | `/book-placeholder.svg` | Medium |
| Catalog product grid | product primary image | `ProductImage` | Card ratio 3/4 | Remote unknown | `fill` | Same | No | Lazy default | Not set | Yes | Product cover candidate | Often Open Library/API | Yes | Medium |
| Category detail grid | product primary image | `ProductImage` | Card ratio 3/4 | Remote unknown | `fill` | Same | No | Lazy default | Not set | Yes | Product cover candidate | Often remote | Yes | Medium |
| Product detail primary cover | selected product image | `ProductImage` | `.detail-image`, ratio inherited from `.product-image` | Remote unknown | `fill` | Same as cards | No | Eager | Not set | Yes | Strong LCP candidate | Often remote | Yes | Medium-high |
| Product gallery thumbnails | product images | `ProductImage` | 86px ratio 3/4 | Remote unknown | `fill` | Same as cards | No | Lazy default | Not set | Below/near fold | No | Often remote | Yes | Low-medium |
| Related products | product primary image | `ProductImage` | Card ratio 3/4 | Remote unknown | `fill` | Same | No | Lazy default | Not set | Below fold | Usually no | Often remote | Yes | Low-medium |
| Cart item cover | cart product metadata cover | `ProductImage` | 82-92px mobile, CSS cover | Remote unknown | `fill` | Same | No | Lazy default | Not set | Yes on cart | Possible but noindex | Remote/API | Yes | Medium |
| Checkout summary item | cart metadata cover | `ProductImage` | small summary image | Remote unknown | `fill` | Same | No | Lazy default | Not set | Yes on checkout | Possible but noindex | Remote/API | Yes | Medium |
| Admin order item | order item image | raw `<img>` | 72px ratio 3/4 | Remote/API unknown | CSS width/aspect; one admin editor img has width attr only | N/A | N/A | Browser default | N/A | Admin-only | No public LCP | Remote/API | Fallback div in some places | Low |
| Placeholder | `/book-placeholder.svg` | CSS background / `next/image` fallback | Ratio 3/4 | 944 bytes | SVG intrinsic not relied on | N/A | N/A | Lazy when failed | N/A | Sometimes | fallback | Local | N/A | Low |
| Identity icons | favicon/icon/apple | Metadata/manifest | Browser/app metadata | PNG sizes known | Manifest declares sizes | N/A | N/A | N/A | N/A | No | No | Local | N/A | Low |
| Social preview | `/social-preview.png` | Metadata only | 1200x630 semantic metadata | 4353 bytes | OG/Twitter metadata | N/A | N/A | N/A | N/A | No | Not runtime LCP | Local | SVG fallback also present | Low |

## LCP Candidates

| Route | Likely Candidate | Risk | Note |
|---|---|---|---|
| `/` | Hero H1/text or CSS book; product grid below | Medium | Runtime failed without site URL/API, so real LCP not measured. |
| `/san-pham` | First product cover or heading | Medium | Product images lazy by default; true LCP needs browser measurement. |
| `/danh-muc` | H1/category cards | Low-medium | Text-heavy route. |
| `/danh-muc/[slug]` | H1 or first product cover | Medium | API unavailable. |
| `/sach/[slug]` | Product cover or H1 | Medium-high | Primary cover eager but no `priority` confirmed. |
| `/khuyen-mai` | Text hero | Low | Static route. |

## Dimensions, Sizes, Priority, Loading

Confirmed:

- `ProductImage` uses `next/image` with `fill`.
- CSS `.product-image` defines `aspect-ratio: 3/4`, reducing CLS risk.
- `ProductImage` defines a responsive `sizes` string.
- Product detail primary image uses `loading="eager"` through `ProductDetailExperience`.
- Product grid images use lazy default.
- No source-confirmed `priority` or `fetchPriority` is present for product images.

Risk:

- Product detail primary cover may need priority/fetch priority if it is confirmed as LCP.
- The same `sizes` string is used for card, detail image, thumbnails, cart, and checkout; this may overfetch/underfetch on some surfaces, but bytes were not measured.
- Remote Open Library images are `unoptimized`, so transfer/latency depends on remote host.

## Remote Images

`apps/web/next.config.ts` allows `https://covers.openlibrary.org/b/isbn/**`.

`ProductImage` treats missing/fake/example URLs as unusable and falls back to `/book-placeholder.svg`. It also detects Open Library 1px images through `naturalWidth <= 1` on load.

Risk: this robustness requires client hydration.

## Social Versus UI Asset Distinction

`/social-preview.png` is a crawler/social metadata asset and is not treated as a runtime LCP image. Runtime performance work should focus on visible route images, not social preview unless public social validators report failures.

## Font Inventory

| Font | Source | Weights | Used Weights | Preloaded | Display | Routes | Risk | Recommendation |
|---|---|---|---|---|---|---|---|---|
| Cambria | system/local | Browser/system | 700 in headings/logo | No web preload needed | System | Global headings | Low | Maintain |
| Times New Roman | system fallback | Browser/system | fallback | No | System | fallback | Low | Maintain |
| Georgia | system fallback | Browser/system | fallback | No | System | fallback | Low | Maintain |
| Segoe UI | system/local | Browser/system | regular/600/700/800/900 | No | System | body/buttons | Low | Maintain |
| ui-sans-serif/system-ui/Arial | system fallback | Browser/system | fallback | No | System | fallback | Low | Maintain |

No external Google font, `next/font`, or custom webfont file was found. Font blocking risk is low. Font metric CLS is not measured but likely lower than external webfont scenarios.

## CSS/Tailwind Observations

- `apps/web/app/globals.css` imports `tailwindcss` and has 2771 lines.
- PostCSS config uses `@tailwindcss/postcss`.
- CSS contains sticky header/sidebar, fixed dialogs/toasts, `backdrop-filter`, shadows, transitions, skeleton shimmer, and toast/cart badge animations.
- `@media (prefers-reduced-motion: reduce)` disables selected animations/transitions.
- No CSS byte size or browser coverage was measured.

## Findings

Image findings: PERF-04.

CSS/font finding: PERF-06.

## M7.3A Runtime Baseline Closure — 2026-07-22

Browser evidence using the valid product fixture confirms separate image risks:

- Catalog first visible image used the local placeholder, `loading=lazy`, `fetchPriority=auto`, natural 113×150 and rendered about 226×301.
- Product-detail primary cover used remote Open Library, `loading=eager`, `fetchPriority=auto`, natural 324×500, rendered about 420×560 desktop and 358×477 mobile.
- No image was identified as measured LCP; remote host latency and eager-without-priority are candidates only. Grid hydration, LCP priority, remote latency, and fallback correctness remain separate concerns.
- One loaded CSS resource measured 11,475 transfer bytes, 11,175 encoded bytes, and 53,459 decoded bytes on representative fresh desktop navigations. This is not a CSS coverage result; PERF-06 is Info/P4 and does not justify a CSS implementation sprint.

No font loading error, hydration mismatch, or external webfont request was observed. Typography remains system serif/sans fallback as documented; no font change is approved.
## M7.3B image decision — 2026-07-22

No low-risk image correction was justified. `ProductImage` supplies responsive `sizes`, lazy loading by default, eager loading for the selected product hero, and a retained fallback. No confirmed duplicate fallback loop, failed-image regression, or oversized requested image was established in the local baseline.
### M7.3B final build-lock closure

Environment-only build-lock resolution did not change image or font behavior.
