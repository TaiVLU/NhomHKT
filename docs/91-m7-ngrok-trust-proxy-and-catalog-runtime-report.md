# M7.4C-W2 Ngrok Trust Proxy and Catalog Runtime Report

Status: proxy and catalog runtime correction complete; Typebot product-button navigation remains a separate manual-flow gap.

## Executive result

The ngrok warning and the temporary public-page 404s were independent symptoms. W3A later reproduced the dynamic-route symptom and added a response-envelope safeguard; document 93 supersedes any interpretation that stale process state is the only possible false-404 source.

- A proxied chatbot request made as the first request after API startup returned HTTP 200, but `express-rate-limit` logged `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` once because Express still used its default `trust proxy = false` setting.
- At the same time, the public catalog APIs returned HTTP 200 while the long-running Next development process routed `/san-pham`, `/danh-muc`, and a known `/sach/[slug]` URL to `/_not-found`. A clean restart of the Next development process restored all three routes to HTTP 200 without a catalog-page source change. A genuinely unknown product slug continued to return HTTP 404.

The repository now has an explicit bounded proxy-hop policy, focused regression tests for proxy/rate-limit and not-found behavior, and a small product-detail LCP correction.

## Reproduction evidence and causal chain

Topology observed through the ngrok inspector:

`external client -> ngrok HTTPS edge -> 127.0.0.1:4000 Express API`

Ngrok supplied `X-Forwarded-For`, `X-Forwarded-Host`, and `X-Forwarded-Proto: https`; Express saw exactly one reverse-proxy hop. The tunnel exposed only API port 4000. SQL Server, the web development port, Prisma Studio, filesystem, and terminal were not exposed.

Before correction:

- direct chatbot POST: HTTP 200;
- ngrok chatbot POST: HTTP 200;
- proxy-first API log: one `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` validation error;
- public products, categories, and known product-detail APIs: HTTP 200;
- stale Next process: `/` HTTP 200 while `/san-pham`, `/danh-muc`, and the known detail path rendered `/_not-found`;
- clean Next restart: public catalog routes HTTP 200 and unknown detail path HTTP 404.

The rate-limit validation was therefore logged once during validator initialization; it did not cause the proxied request to fail and did not cause the catalog 404s. The observed incident was stale development-server route state. W3A later confirmed a separate latent client-boundary risk: malformed HTTP 200 envelopes could yield `undefined` and reach `notFound()`. That path is now rejected into the error boundary; see document 93.

## Trust-proxy policy

`TRUST_PROXY_HOPS` is parsed as the bounded set `0 | 1`:

- default `0`: direct/unproxied topology; forwarded client headers are not trusted;
- explicit `1`: the verified local ngrok topology; the single trusted hop is used for client-IP derivation.

`createApp` applies the value before middleware registration with `app.set('trust proxy', environment.TRUST_PROXY_HOPS ?? 0)`. It never uses `true` and does not accept arbitrary IP lists, functions, names, or hop counts. The W2 runtime used only the process/session value `TRUST_PROXY_HOPS=1`; no real credential or local `.env` value was added to Git.

The local API remains bound to `127.0.0.1`, so an untrusted network client cannot bypass ngrok and reach the one-hop-configured listener directly. Automated tests additionally prove that the default zero-hop policy ignores rotating spoofed `X-Forwarded-For` values and still limits the direct caller.

Production must set this value only after separately confirming ingress topology and direct-origin reachability. If production has a different number of hops or permits direct access to the origin, `1` must not be copied mechanically; the ingress must sanitize forwarded headers and the policy must be reviewed again.

## Rate-limit verification

The dedicated limiter remains attached only to `POST /api/v1/chatbot/search`, with 30 requests per 60 seconds and the existing stable `CHATBOT_RATE_LIMITED` response. Public catalog routes remain outside this limiter.

Automated evidence covers:

- direct requests at zero hops;
- proxy requests with `X-Forwarded-For` at one hop;
- two independent forwarded clients receiving independent buckets;
- a rotating spoofed forwarded header not bypassing the zero-hop bucket;
- request 31 returning HTTP 429 and `CHATBOT_RATE_LIMITED`;
- public `/api/v1/products` remaining HTTP 200 after chatbot exhaustion;
- absence of `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` under the one-hop policy.

Manual ngrok exhaustion used header-only invalid POSTs so it did not query catalog data. With one request already charged in the active window, the next sequence returned 29 HTTP 400 validation responses followed by two HTTP 429 responses. The 429 response retained the stable public error body and rate-limit headers.

## Public-page semantics

No page loader was changed because source inspection and regression tests confirm the required distinction already exists:

- `getProduct` and `getCategory` return `null` only for an actual upstream HTTP 404;
- other non-success statuses and network failures throw;
- detail pages call `notFound()` only for `null`;
- product-list and category-list failures throw into the existing Next error boundary rather than rendering a false 404.

Tests now lock the real-missing and upstream-failure paths. Runtime recovery required a clean Next development restart only; there was no justification for disguising process state with application logic.

## LCP correction

The product-detail main gallery image now uses the current Next Image API with `loading="eager"` and `fetchPriority="high"`. `ProductImage` accepts the bounded fetch-priority prop and resets it to `auto` if the source falls back. Gallery thumbnails retain the default `loading="lazy"` and `fetchPriority="auto"`; catalog cards were not promoted. This gives only the above-the-fold main image high priority while preserving gallery behavior.

## Runtime verification

After restarting the API with process-only `TRUST_PROXY_HOPS=1`:

- direct chatbot POST: HTTP 200, three public results;
- ngrok chatbot POST: HTTP 200, three public results;
- patched API stderr: empty; no proxy validation error;
- direct products/categories/known product API: HTTP 200;
- web `/`, `/san-pham`, `/danh-muc`, and `/sach/luoc-su-nhung-phat-minh`: valid content;
- `/sach/khong-ton-tai-w2`: genuine not-found content and HTTP 404 by direct HTTP check;
- Typebot widget: opened, accepted `Tìm sách lịch sử`, and rendered two valid public results through ngrok;
- browser console: no runtime or hydration error. The recorded LCP warning referred to a homepage catalog card from the earlier pre-correction navigation, not the corrected product-detail main image.

The Typebot `Xem sản phẩm` button advanced the flow but did not navigate the browser to the returned product URL. The returned canonical URL itself was independently opened and rendered HTTP 200. Because W2 forbids changing the Typebot workspace/flow, this remains a manual Typebot flow correction and blocks final chatbot certification, but it does not reopen the proxy or public catalog fixes.

## Scope verification

- package installed or package file changed: NO;
- schema or migration changed: NO;
- Commerce Core changed: NO;
- chatbot API contract changed: NO;
- Typebot workspace/flow changed: NO;
- global CORS weakened: NO;
- deployment: NO;
- commit: NO;
- push: NO.

## Quality gates

Final gates were run sequentially on the W2 state:

- `npm run format:check`: PASS;
- `npm run lint`: PASS for API, web, and shared workspaces;
- `npm run type-check`: PASS for API, web, and shared workspaces;
- focused API proxy/environment/health/chatbot tests: PASS, 3 files / 18 tests;
- focused web image/not-found/catalog-client tests: PASS, 3 files / 12 tests;
- `npm run test`: PASS, API 24 files / 173 tests, web 44 files / 220 tests, shared 1 file / 1 test (394 tests total);
- SEO regression: PASS, 9 files / 48 tests;
- `npm run build`: PASS, including Prisma Client generation, API/shared TypeScript builds, and Next 16.2.10 Turbopack production build;
- `git diff --check`: PASS; only the repository's known Windows LF-to-CRLF warnings were printed.

Before the root build, the RoSach web listener PID 8752 and API listener PID 1936 plus the API's owned watcher ancestors were stopped. Ports 3000 and 4000 were confirmed closed. Ngrok and unrelated processes were not stopped. No watcher was restarted after the build.

## Deployment follow-up

Before any public deployment, document the actual ingress chain, prevent direct public access to the Express origin, verify forwarded-header sanitization, and set `TRUST_PROXY_HOPS` to the reviewed bounded value. Run the same independent-client and spoof-resistance tests against the deployed topology. Typebot product-button navigation must be corrected and manually recertified in the workspace before M7.4 chatbot certification can close.

## W3 closure note

The final navigation prerequisite above is closed by document 92. The workspace now uses a variable-picker `product_1_url` token in the existing supported Redirect block with new-tab navigation. Published Chrome standalone and embedded checks open current canonical local product routes, including a changed result after `Tìm lại`. W2 proxy and catalog conclusions remain unchanged.
