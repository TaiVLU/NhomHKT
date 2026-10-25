# M7.3A Build And Bundle Audit

Status: AUDIT ONLY

## Build Command

Command: `npm run build`

Result: PASS in 38.97s.

Build notes:

- API: `prisma generate && tsc -p tsconfig.build.json`.
- Web: `next build` with Next.js 16.2.10 / Turbopack.
- Shared: `tsc -p tsconfig.build.json`.
- Web compiled successfully in 8.1s, TypeScript finished in 9.3s, static page generation finished 23/23 in 954ms.
- Build output did not show route byte size, first-load JS, shared chunk size, or transfer size.

## Route Rendering Types

| Route | Build Classification | Audit Note |
|---|---|---|
| `/` | Dynamic | Homepage fetches featured/newest/category data. |
| `/_not-found` | Static | Friendly 404 page. |
| `/admin/403` | Static | Admin denial page. |
| `/admin/catalog` | Static | Client admin catalog UI. |
| `/admin/catalog/[id]` | Dynamic | Client admin editor route with dynamic id. |
| `/admin/don-hang` | Static | Client admin orders UI. |
| `/admin/don-hang/[orderNumber]` | Dynamic | Client admin order detail route. |
| `/admin/login` | Static | Admin login UI. |
| `/dang-ky` | Static | Register UI. |
| `/dang-nhap` | Dynamic | Login route. |
| `/danh-muc` | Dynamic | Category index fetches categories. |
| `/danh-muc/[slug]` | Dynamic | Category detail fetches category/products. |
| `/dat-lai-mat-khau` | Dynamic | Reset password route. |
| `/gio-hang` | Static | Client cart route. |
| `/khuyen-mai` | Static | Informational route. |
| `/manifest.webmanifest` | Static | Manifest generated from metadata route. |
| `/quen-mat-khau` | Static | Forgot password route. |
| `/robots.txt` | Static | Robots policy route. |
| `/sach/[slug]` | Dynamic | Product detail fetches product. |
| `/san-pham` | Dynamic | Catalog fetches product/taxonomy data. |
| `/san-pham/[slug]` | Dynamic | Permanent redirect to `/sach/[slug]`. |
| `/sitemap.xml` | Static | Sitemap route. |
| `/tai-khoan` | Static | Client account shell. |
| `/tai-khoan/dia-chi` | Static | Client account/address UI. |
| `/tai-khoan/doi-mat-khau` | Static | Client account/password UI. |
| `/tai-khoan/don-hang` | Static | Client order list UI. |
| `/tai-khoan/don-hang/[orderNumber]` | Dynamic | Client order detail route. |
| `/tai-khoan/ho-so` | Static | Client profile UI. |
| `/thanh-toan` | Static | Client checkout UI. |
| `/thanh-toan/thanh-cong` | Static | Client confirmation UI. |

## Route/Client JS Evidence

Confirmed:

- Build output provides static/dynamic classification only.
- Route JS byte sizes, shared JS byte sizes, and first-load JS were not emitted.
- No bundle analyzer package or script exists in repository scripts.

Status: NOT MEASURED for exact bundle size.

## Shared Chunk Evidence

No exact shared chunk size was measured. Source-level shared client concerns are:

- `apps/web/features/shell/site-chrome.tsx` is a root-level client wrapper for all non-admin routes.
- `apps/web/features/cart/cart-provider.tsx` is mounted around public routes and provides cart state to header and commerce pages.
- `apps/web/features/catalog/product-image.tsx` is client-only and used by product grids, product detail, cart, and checkout.

## Dependency Inventory

| Package | Location | Import Evidence | Bundle Risk | Recommendation |
|---|---|---|---|---|
| `next`, `react`, `react-dom` | `apps/web/package.json` | Framework dependencies | Required | Maintain |
| `react-markdown` | `apps/web/package.json`; `apps/web/app/sach/[slug]/page.tsx` | Product detail description rendering | Medium route/server cost risk | Measure before changing |
| `rehype-sanitize` | same | Sanitizes markdown output | Security requirement | Maintain unless equivalent safety |
| `remark-gfm` | same | GFM markdown support | Medium route/server cost risk | Measure before changing |
| `zod` | `apps/web/package.json` | Environment/schema usage | Low | Maintain |
| `@tailwindcss/postcss`, `tailwindcss` | web devDeps/PostCSS | CSS pipeline | Build-time | Maintain |
| `@rosach/shared` | web dependency | Types/shared contract | Required | Maintain |
| `cloudinary`, `file-type`, `multer` | API package | API image upload only | Backend/runtime API, not web client | Out of M7.3B frontend unless backend follow-up |

No dependency removal is recommended without bundle evidence.

## Use-Client Inventory

| File | Component | Reason for Client | Hooks/APIs Used | Boundary Scope | Child Tree Size | Can Move to Server? | Recommendation | Risk |
|---|---|---|---|---|---|---|---|---|
| `apps/web/features/shell/site-chrome.tsx` | `SiteChrome` | Pathname branch and provider/header composition | `usePathname` | High, wraps all non-admin routes | Large | Partly | Split Boundary | High |
| `apps/web/features/shell/site-header.tsx` | `SiteHeader` | menu/auth/cart interactions | `usePathname`, `useRouter`, `useEffect`, `useState`, `window` listener | Header | Medium | Partly | Isolate Interactive Child | Medium |
| `apps/web/features/cart/cart-provider.tsx` | `CartProvider` | cart context, auth sync, toast | context/state/effect/timers/fetch | All non-admin public routes | Large | No | Keep Client, reduce scope if proven | High |
| `apps/web/features/catalog/product-image.tsx` | `ProductImage` | remote image fallback detection | state/ref/effect/onLoad/onError | Repeated image nodes | Potentially large | Partly | Split Boundary | Medium |
| `apps/web/features/catalog/mobile-filter-drawer.tsx` | `MobileFilterDrawer` | dialog state/focus trap | state/ref/effect/document | Catalog filter child | Small-medium | No | Keep Client | Low |
| `apps/web/features/catalog/product-detail-experience.tsx` | `ProductDetailExperience` | variant/image/quantity state | state/effect/memo/window/history | Product detail main interactive area | Medium | No for interactive area | Keep Client / isolate static facts later | Medium |
| `apps/web/features/cart/add-to-cart-button.tsx` | `AddToCartButton` | cart mutation/router | state/router/context | Button | Small | No | Keep Client | Low |
| `apps/web/features/cart/cart-page.tsx` | `CartPage` | cart state and confirmations | state/callback/context | Full cart page | Medium | No | Keep Client | Medium |
| `apps/web/features/cart/confirmation-dialog.tsx` | `ConfirmationDialog` | focus and event handling | effect/ref | Dialog | Small | No | Keep Client | Low |
| `apps/web/features/checkout/checkout-page.tsx` | `CheckoutPage` | address/cart/submit/idempotency/dialog | state/effect/memo/ref/router/storage | Full checkout | Large | No | Keep Client | High |
| `apps/web/features/checkout/checkout-success-page.tsx` | `CheckoutSuccessPage` | sessionStorage read | state/effect | Success page | Medium | Partly | Needs Runtime Evidence | Medium |
| `apps/web/features/account/account-shell.tsx` | `AccountShell` | auth guard/redirect | state/effect/router/pathname | Account subtree | Medium | No | Keep Client | Medium |
| `apps/web/features/account/address-book.tsx` | `AddressBook` | CRUD form | state/effect/fetch | Account child | Medium | No | Keep Client | Medium |
| `apps/web/features/account/password-form.tsx` | `PasswordForm` | submit state | state | Form | Small | No | Keep Client | Low |
| `apps/web/features/account/profile-form.tsx` | `ProfileForm` | load/update form | state/effect/fetch | Form | Small-medium | No | Keep Client | Low |
| `apps/web/features/orders/orders-page.tsx` | `OrdersPage` | private orders fetch/pagination | searchParams/state/effect | Account child | Medium | No | Keep Client | Medium |
| `apps/web/features/orders/order-detail-page.tsx` | `OrderDetailPage` | private order fetch | state/effect | Account child | Medium | No | Keep Client | Medium |
| `apps/web/features/auth/auth-form.tsx` | `AuthForm` | pending/error submit | state | Form | Small | No | Keep Client | Low |
| `apps/web/features/auth/login-page.tsx` | `LoginPage` | auth submit/redirect | router | Form page | Small | No | Keep Client | Low |
| `apps/web/features/auth/reset-password-form.tsx` | `ResetPasswordForm` | OTP/reset flow | router | Form page | Small | No | Keep Client | Low |
| `apps/web/app/dang-ky/page.tsx` | register page | auth submit/redirect | router | Full page | Small | No | Keep Client | Low |
| `apps/web/app/quen-mat-khau/page.tsx` | forgot page | auth submit/redirect | router | Full page | Small | No | Keep Client | Low |
| `apps/web/app/san-pham/error.tsx` | catalog error | reset handler | event handler | Error fallback | Small | No | Keep Client | Low |
| `apps/web/features/admin-orders/admin-orders-page.tsx` | admin orders | admin filters/fetch | state/effect/router/searchParams | Admin page | Medium | No | Keep Client | Medium |
| `apps/web/features/admin-orders/admin-order-detail-page.tsx` | admin order detail | transitions/dialog | state/effect/ref | Admin detail | Medium | No | Keep Client | Medium |
| `apps/web/features/catalog/taxonomy-manager.tsx` | admin taxonomy | CRUD/fetch | state/effect/fetch | Admin child | Medium | No | Keep Client | Medium |
| `apps/web/app/admin/catalog/page.tsx` | admin catalog | CRUD/search/fetch | state/effect/router | Admin page | Medium | No | Keep Client | Medium |
| `apps/web/app/admin/catalog/[id]/page.tsx` | admin editor | full product editor | state/effect/memo/ref/router/searchParams | Large admin route | Large | No | Keep Client | High, admin-only |
| `apps/web/services/auth-client.ts` | auth service | browser token/localStorage | localStorage/window/fetch | Client service | N/A | No | Keep Client | Low |
| `apps/web/services/cart-client.ts` | cart service | bearer token/cart API | fetch/auth | Client service | N/A | No | Keep Client | Low |
| `apps/web/services/checkout-client.ts` | checkout service | checkout/sessionStorage | fetch/storage/crypto | Client service | N/A | No | Keep Client | Low |
| `apps/web/services/orders-client.ts` | orders service | private order API | fetch/auth | Client service | N/A | No | Keep Client | Low |
| `apps/web/services/admin-orders-client.ts` | admin service | admin API auth | fetch/auth | Client service | N/A | No | Keep Client | Low |

## Provider Boundary

`CartProvider` is mounted inside `SiteChrome` for all non-admin routes. This is behaviorally convenient because the header cart badge is global, but it broadens the client boundary. M7.3B should only reduce this scope if cart badge, guest/auth states, commerce tests, and header accessibility remain intact.

## Dynamic Import Candidates

No dynamic import implementation is approved in M7.3A. Candidates requiring measurement:

- Product markdown stack on `/sach/[slug]`.
- Admin-only product editor sections.
- Checkout address dialog.

Forbidden without evidence: dynamic importing primary product content, H1, metadata, structured data, cart/checkout logic that changes business behavior, or accessibility-critical controls.

## Bundle Findings

Confirmed findings are recorded in `docs/75-m7-performance-audit.md`: PERF-01, PERF-04, PERF-05.

## Limitations

- No route JS size or first-load JS size emitted by build.
- No bundle analyzer installed or run.
- Raw `.next` file-size summing was not used as transfer-size evidence.

## M7.3A Runtime Baseline Closure — 2026-07-22

The web-only production build passed with process-only local measurement variables. The root workspace build was not accepted as a quality pass because Prisma generate failed with Windows `EPERM` while a pre-existing API watcher held the query engine. No process owned by the user was stopped.

Browser resource evidence (first fresh desktop navigation) recorded 10–11 script resources with about 156–162 KB transfer bytes for representative `/khuyen-mai`, `/san-pham`, and `/sach/[slug]` navigations. These values are local browser resource-timing observations, not a Next first-load bundle budget. Promotion had no browser-side cart/auth API request despite the root client boundary. This lowers PERF-01 from High to Medium-High validation-only; no SiteChrome refactor is approved.
## M7.3B validation decision — 2026-07-22

No client-boundary extraction was implemented. `SiteChrome` owns pathname-aware admin exclusion, header/footer, cart state, and toast behavior; build-artifact inspection alone is not a valid measured target. Markdown imports stay on the server product route. Any future boundary work requires reproducible shared-JS or bootstrap cost evidence.
### M7.3B final build-lock closure

Root build passed after the environment closure gate. Prisma Client generation and the Next.js production build completed without the prior `EPERM` rename failure.
