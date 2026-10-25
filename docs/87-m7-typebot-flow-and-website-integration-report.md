# M7.4C Typebot Flow and Website Integration Report

Status: repository integration complete; the M7.4C-W1 runtime correction is documented in `docs/90-m7-typebot-widget-runtime-corrective-report.md`.

## Repository implementation

The public SiteChrome mounts a client-only `TypebotWidget` inside the existing `CartProvider`. Admin routes keep their existing early return and do not mount the public shell or widget. The component injects the official Typebot browser module after idle time, uses stable singleton identifiers, and survives App Router navigation without duplicate scripts or bubbles. The launcher stays disabled until the bubble UI is initialized.

No Typebot package was added. The embed loads `https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js`, the official HTML/JavaScript module documented by Typebot. A validated `NEXT_PUBLIC_TYPEBOT_PUBLIC_ID` supplies the public bot identifier; `NEXT_PUBLIC_TYPEBOT_ENABLED=true` is required to activate it. Both values are public configuration, not secrets. Missing or invalid values disable the widget safely.

## Accessibility and mobile behavior

The custom launcher is a native button with visible text `Trợ lý RoSach`, the closed accessible label `Mở Trợ lý RoSach`, and the open label `Đóng Trợ lý RoSach`. It is keyboard reachable, visibly focusable, and at least 48px high. Desktop and mobile rules use safe-area offsets. The compact mobile launcher avoids covering a wide content area, while the chat surface is constrained to the viewport. Its layer is below application dialogs and toasts, preserving critical cart and checkout feedback.

## M7.4C-W1 runtime correction

Manual certification exposed a zero-width visible surface despite successful module and `startChat` requests. The original integration hid Typebot's button through CSS while giving the chat window `maxWidth: 100%`; the percentage resolved against the collapsed fixed container. W1 now hides the built-in button through `theme.button.isHidden`, initializes a bounded `400px` bubble, and uses the supported `Typebot.toggle({ id })` command with `onOpen`/`onClose` lifecycle callbacks. The page-runtime state machine is `disabled` / `loading-script` / `initialized` / `open` / `failed`.

Runtime inspection confirms a single `typebot-bubble` custom element with a shadow root and native `part="bot"` surface, not an iframe. Desktop and 390x844 mobile checks show a visible bounded surface, successful close/reopen, one host across public App Router navigation, no Admin mount, and no console or hydration error. Full evidence is in document 90.

## Privacy and security boundary

The website passes no prefilled variables and copies no cookie, authentication token, customer, cart, account, order, email, phone, address, password, OTP, or payment value into Typebot. Product links originate only from `data.productNUrl`. Global CORS, API security, database, schema, migrations, Commerce Core, and Next security configuration were not changed.

The current repository has no CSP header. If CSP is introduced later, activation requires a reviewed exact allowlist for the Typebot module/viewer origins; it must not be bypassed with a wildcard. Typebot Free branding remains accepted.

## Automated verification

Repository tests cover valid/missing/malformed configuration, disabled behavior, accessible launcher, single script injection, singleton open behavior, SiteChrome/CartProvider preservation, public commerce routes, Admin exclusion, the exact wrapped API mapping, result counts 0-3, null product slots, guide responses, public errors, and the credential-free request fixture.

Latest W1 evidence: 25 focused Typebot/widget tests passed; the root suite passed 168 API, 214 web, and 1 shared test (383 total); the approved SEO regression passed 48 tests. Format check, lint, strict type-check, Prisma/API/Next/shared production build, and `git diff --check` passed. The only diff-check output was the repository's known Windows LF/CRLF warning.

## Manual certification status

The published public bot ID `ro-sach-typebot-capability-poc-5iwhpqi` was used for local W1 runtime certification through environment configuration; it is not hardcoded in application source. The repository remains disabled by default when the environment switch or valid public ID is absent. No dead Quick Tunnel or localhost API URL is embedded.

## M7.4D prerequisites

- Recorded Typebot flow screenshots or exported configuration showing every approved variable and branch.
- Successful HTTP tests against the stable public API origin for results, no-results, guide, rate-limit, timeout/failure, and retry.
- Published public bot ID configured in the website environment followed by a clean rebuild/restart.
- Real Chromium desktop/mobile verification of the bubble, cards, dynamic links, keyboard behavior, navigation persistence, checkout/cart clearance, console/network errors, and accepted Typebot Free branding.
- SEO and performance confirmation after the real embed becomes active.

## M7.4C-W2 runtime follow-up

Document 91 is authoritative for the ngrok/trust-proxy and transient catalog-404 investigation. The verified local tunnel has exactly one reverse-proxy hop into an API bound to `127.0.0.1`; W2 adds a bounded `TRUST_PROXY_HOPS=0|1` environment policy and uses `1` only for that topology. Direct and ngrok chatbot requests return HTTP 200 without the previous forwarded-header validation log, while the 30/minute dedicated limiter remains effective and isolated from public catalog routes.

The catalog 404 symptom was not caused by the chatbot endpoint or rate-limit validation. Catalog APIs stayed HTTP 200 and the source already distinguishes genuine 404 from upstream failure. A clean restart of a stale Next development process restored `/san-pham`, `/danh-muc`, and known product detail routes; unknown slugs remain 404.

Manual Typebot search through ngrok returned valid results. The workspace's `Xem sản phẩm` branch did not navigate the browser even though the returned canonical product URL independently opens successfully. W2 does not modify Typebot flow, so final certification still requires that workspace action to be corrected and re-evidenced.

## M7.4C-W3A dynamic-route recovery

W3A reproduced known product/category links returning 404 while their exact detail APIs returned 200. A clean RoSach watcher restart restored all 24 approved product routes and all 8 category routes without deleting `.next` or reseeding. The observed incident was stale Next development route state; it was not caused by ngrok or the chatbot limiter.

W3A additionally hardened the shared catalog client so a malformed HTTP 200 envelope throws to the error boundary instead of becoming a false missing entity. Canonical chatbot product URLs now independently resolve to verified detail pages. Typebot button-action correction remains W3 scope and was not changed by W3A.

## M7.4C-W3 navigation closure

Document 92 is authoritative for the final product-action and privileged-access pass. The Redirect URL was cleared and `product_1_url` was inserted through the Typebot variable picker, then published with supported new-tab navigation. Chrome standalone and embedded checks opened the exact current product route. A second standalone query after `Tìm lại` opened a different current product, proving the mapping is not stale.

The chatbot API, public URL generation, website widget source, CORS, and private-data boundary did not change. The local Admin UI now submits the existing email form of the backend's email-or-username login contract; environment-driven Admin/Staff seed alignment is documented in documents 31, 34, 36, and 92.
