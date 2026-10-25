# M7.4C-W1 Typebot Widget Runtime Corrective Report

Status: implementation and local browser verification complete; ready for Technical Lead review.

## Root cause

The original loader did call the supported `Typebot.initBubble` API and the custom launcher did call the supported `Typebot.open` command. The browser module loaded and `startChat` succeeded, but the visible bot surface collapsed to zero width.

The collapse was caused by two integration choices acting together:

- the built-in bubble button was hidden only through `typebot-bubble::part(button) { display: none; }`, so Typebot still calculated its runtime as a normal button-backed bubble;
- `theme.chatWindow.maxWidth` was set to `100%`. That percentage resolved against the bubble's zero-width fixed containing block after the button was removed from layout.

Runtime evidence before the correction showed one `typebot-bubble` shadow host, an open `part="bot"` with `opacity: 1` and height `608px`, but computed width `0px`. The successful `startChat` request therefore proved session creation, not visible UI mounting.

The corrupted strings originated as mojibake literals in `typebot-widget.tsx`, its widget tests, and the SiteChrome test mock.

## Corrected browser integration

The loader remains client-only and package-free. It imports the existing official browser module from `https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js`, creates exactly one `typebot-bubble` with the stable ID `rosach-typebot-bubble`, and stores the public API at the existing browser boundary.

The corrected bubble configuration now:

- uses `theme.button.isHidden = true`, the supported Typebot option, so no default launcher is rendered;
- uses an explicit `400px` maximum width and `704px` maximum height instead of the collapsing percentage width;
- uses the supported `inlineStyle` key `'z-index': '55'`, placing the vendor wrapper above public content but below RoSach dialogs and toasts;
- provides `onOpen` and `onClose` callbacks for reliable lifecycle state;
- waits for the `typebot-bubble` custom element definition and one animation frame before publishing the initialized state;
- binds the RoSach launcher to the documented `Typebot.toggle({ id })` command.

No `startChat` API is called directly by RoSach. Typebot owns session creation after the visible bubble is opened. No internal Typebot element is clicked, no private/minified API is called, and no iframe is scraped.

## Lifecycle and failure behavior

The widget implements the explicit states `disabled`, `loading-script`, `initialized`, `open`, and `failed`.

- Disabled, missing, or invalid configuration renders nothing through the existing validated configuration boundary.
- A valid configuration renders a disabled launcher while the module initializes.
- The launcher becomes interactive only after the visible bubble host is ready.
- Module-load or initialization failure moves to `failed`, keeps the launcher disabled, and exposes only a safe Vietnamese status title.
- Open and close callbacks switch between `open` and `initialized`; the custom button therefore closes and reopens the same UI instance.
- Script, browser API, state, and host IDs are page-runtime singletons. React Strict Mode and App Router navigation do not reinitialize or duplicate them.

## UTF-8 and accessibility

The source now contains literal UTF-8 Vietnamese:

- visible label: `Trợ lý RoSach`;
- closed accessible label: `Mở Trợ lý RoSach`;
- open accessible label: `Đóng Trợ lý RoSach`.

The launcher is a native `button` with `type="button"`, a visible focus style, a minimum 48px interaction height, native Enter/Space behavior, `aria-expanded`, and safe-area-aware placement. It remains absent from Admin routes.

## DOM and CSS findings

Typebot v0.10.7 creates a `typebot-bubble` custom element with an open shadow root. The visible conversation is rendered natively inside `part="bot"`; this integration creates no iframe and no dialog element. The built-in `part="button"` is absent because it is disabled through the supported theme option.

No RoSach global iframe or dialog rule hid the widget. The corrective CSS is limited to the RoSach launcher, the exposed `part="bot"`, and the mobile breakpoint. The previous CSS-only hiding rule and redundant part z-index were removed. At 390x844 the measured bot rectangle was fully inside the viewport (`left 8.8`, `right 367.2`, `top 44`, `bottom 748` CSS pixels), with no horizontal document overflow.

## Browser evidence

Local Chromium verification used the approved public ID through process/local environment configuration and covered desktop 1440x900 and mobile 390x844.

- Desktop open surface: `400x704`, opacity `1`, pointer events enabled, wrapper z-index `55`.
- Mobile open surface: approximately `358.4x704`, fully within the viewport and above the 49.6px launcher.
- Conversation content rendered (`Chào mừng bạn đến với Rổ Sách.`) and the Typebot input/actions were present.
- The custom launcher opened, closed, and reopened the same host.
- Client navigation through `/`, `/san-pham`, `/sach/du-lieu-ke-chuyen`, and `/gio-hang` retained exactly one launcher, one script, and one bubble host.
- `/admin` contained no launcher, Typebot script, or bubble host.
- No browser console warning, runtime error, or hydration error was observed.

## Automated verification

Focused Typebot/config/SiteChrome tests cover UTF-8 text, accessible labels, non-submit semantics, disabled and invalid configuration, loading state, supported bubble initialization, hidden default launcher, single script injection, singleton behavior, toggle invocation, open/close callbacks, failure containment, public shell preservation, route behavior, and Admin exclusion.

Closure quality gates were run sequentially after the source and documentation changes:

- `npm run format:check`: PASS.
- `npm run lint`: PASS for API, web, and shared workspaces.
- `npm run type-check`: PASS for API, web, and shared workspaces.
- focused Typebot/widget tests: PASS, 4 files / 25 tests.
- `npm run test`: PASS, API 24 files / 168 tests, web 43 files / 214 tests, shared 1 file / 1 test (383 tests total).
- SEO regression (`npm run test -w @rosach/web -- tests/seo`): PASS, 9 files / 48 tests.
- `npm run build`: PASS, including Prisma Client generation, API/shared TypeScript builds, and Next 16.2.10 Turbopack production build.
- `git diff --check`: PASS; only the repository's known LF-to-CRLF warnings were printed.

Before the root build, only RoSach-owned development processes were stopped: Next dev PID 10724, API `tsx watch` PID 1320, and its Next development worker PID 7832. The Codex browser-control process was not stopped. API/web watchers were not restarted.

## Scope verification

- Package installed: NO.
- Package files changed by W1: NO.
- Schema changed: NO.
- Migration created: NO.
- Commerce Core changed: NO.
- Chatbot API contract changed: NO.
- Typebot workspace or flow changed: NO.
- Global CORS changed: NO.
- Deployment: NO.
- Commit: NO.
- Push: NO.

## Known limitations

- Typebot Free branding remains visible and accepted.
- The browser module URL follows the existing major alias `@typebot.io/js@0`; a future dependency governance pass may pin an exact reviewed patch version, but W1 does not change package or deployment policy.
- Final public deployment certification, production CSP allowlisting if CSP is introduced, and public Core Web Vitals remain separate release activities.

## M7.4C-W2 follow-up

The later ngrok warning and public catalog 404 report did not invalidate the W1 widget lifecycle correction. W2 proved the proxy warning was a one-time `express-rate-limit` validation log caused by default Express trust settings, while the temporary 404s came from a stale Next development routing process. Document 91 records the new bounded one-hop proxy policy and clean-restart recovery.

The W2 browser pass reopened the W1 widget and successfully searched through ngrok without console, hydration, or proxy-validation errors. It also found a separate Typebot workspace limitation: selecting `Xem sản phẩm` advanced the conversation but did not navigate to the canonical product URL. No W1 widget source or Typebot flow was changed for that out-of-scope issue.
