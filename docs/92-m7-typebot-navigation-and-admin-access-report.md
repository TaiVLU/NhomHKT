# M7.4C-W3 Typebot Navigation and Admin Access Report

Status: implementation and local certification complete; ready for Technical Lead review.

## Executive result

APPROVE. The published Typebot now opens the current product URL in a new tab in both the standalone Chrome flow and the embedded RoSach widget. Local Admin and Staff identities use valid, distinct email addresses and remain aligned with the existing authentication and RBAC contract.

## Typebot navigation root cause

The chatbot API already returned a correct absolute `product1Url`, and the workspace HTTP Request block mapped it to `product_1_url`. The product route independently returned HTTP 200. The blocking defect was in the workspace action:

- the Redirect URL field contained text that rendered like `{{product_1_url}}`, but it had not been re-established as a variable-picker token;
- selecting the variable without first clearing the field produced two adjacent tokens, proving the old content was not a trustworthy configured token;
- a current-tab redirect navigated correctly but destroyed the standalone conversation state, so returning to the bot could not continue with `Tìm lại`;
- the supported new-tab Redirect preserves the conversation and is the correct action for the HTTPS Typebot surface targeting a local HTTP product URL.

No backend URL generation or chatbot response contract changed.

## Action correction

In the existing Redirect block after `Xem sản phẩm`, the URL field was cleared and `product_1_url` was inserted through Typebot's variable picker. `Open in new tab` is enabled. The published flow continues to the existing `Tìm lại` branch after the redirect action. No JavaScript, parent-frame access, private API, or hardcoded product URL is used.

The Chrome runtime is authoritative for popup behavior. An in-app browser surface did not expose the new tab, while the user's normal Chrome session opened the correct target. This is a browser-surface popup-policy difference, not a malformed URL or backend failure.

## Manual standalone verification

Published bot: `ro-sach-typebot-capability-poc-5iwhpqi`.

1. Query `có sách nào dưới 200 ngàn không` returned `Lược Sử Những Phát Minh` at 197.000 ₫ and `Những Thành Phố Bên Sông` at 199.000 ₫.
2. `Xem sản phẩm` opened `http://localhost:3000/sach/luoc-su-nhung-phat-minh` in a new Chrome tab with the exact title and H1.
3. The standalone chat remained open. After `Tìm lại`, query `sách thiếu nhi` returned a new first product.
4. `Xem sản phẩm` then opened `http://localhost:3000/sach/chuyen-cua-nhung-vi-sao`, proving the current variable value replaced the prior result and no stale URL was used.

There was one navigation per click, no retained blank tab, and the chat branch remained usable.

## Manual embedded verification

The supported RoSach custom launcher opened the published Typebot inside the public category page. Query `sách kinh tế` returned `Khởi Nghiệp Từ Điều Nhỏ` at 189.000 ₫ and `Bản Đồ Tài Chính Cá Nhân` at 169.000 ₫. `Xem sản phẩm` opened `http://localhost:3000/sach/khoi-nghiep-tu-dieu-nho` in a new Chrome tab while the host page and chat state remained intact.

No cookie, token, customer, cart, order, account, or private data was sent to Typebot.

## Authentication contract

`loginSchema` accepts either `{ email, password }` or `{ username, password }`, normalizes the selected identifier, rejects unknown fields, and uses the same service lookup and password verification for customer and privileged login. `/api/v1/auth/admin/login` admits only `ADMIN` and `STAFF`; customer use is rejected without enumeration. The local `/admin/login` UI now uses the email form of this already-approved contract.

Roles and permissions remain unchanged:

- `ADMIN` has catalog mutation, order management, inventory adjustment, and diagnostics permissions;
- `STAFF` has approved read/update permissions but not `PRODUCT_MANAGE` or other Admin-only operations.

## Local Admin and Staff alignment

Required development/test variables:

```dotenv
M3_DEMO_ADMIN_USERNAME=rosach_admin
M3_DEMO_ADMIN_EMAIL=admin.rosach@gmail.com
M3_DEMO_ADMIN_PASSWORD=change-me-123
M3_DEMO_STAFF_USERNAME=rosach_staff
M3_DEMO_STAFF_EMAIL=staff.rosach@gmail.com
M3_DEMO_STAFF_PASSWORD=change-me-123
```

Tracked values are placeholders only. Real passwords stay in ignored `apps/api/.env` and are never printed or documented.

`catalog:seed-demo-users` validates development/test mode, username syntax, valid distinct emails, distinct usernames, password length/UTF-8 limit, and the current letter-plus-digit password rule. It finds an existing identity by username or email and updates that row in place, retaining the user ID and references. If username and email resolve to different rows, it fails closed instead of deleting, recreating, or merging accounts.

## Seed and login verification

- privileged seed run 1: PASS;
- privileged seed run 2: PASS;
- final matching account count: 2, exactly one `ADMIN` and one `STAFF`, both `ACTIVE`;
- Admin email login: HTTP 200 with role `ADMIN`;
- Staff email login: HTTP 200 with role `STAFF`;
- Admin catalog and order reads: HTTP 200;
- Staff catalog read: HTTP 200;
- Staff Admin-only catalog deletion attempt: HTTP 403;
- wrong password: HTTP 401 with the stable public auth error;
- locked privileged account: rejected by service with `AUTH_ACCOUNT_LOCKED` and no credential leakage.

Final browser verification used two isolated Chrome sessions against the local runtime. Admin email login reached `http://localhost:3000/admin/catalog` in `Chế độ quản trị`, exposed the approved product-creation controls, and displayed cost price. Staff email login reached the same route in `Chế độ nhân viên - chỉ đọc`; product-creation controls and cost price were absent. No password was printed, captured in documentation, or stored by the browser automation.

Repeated seeding produces no duplicate privileged identity. Passwords are freshly bcrypt-hashed on an authorized local seed run; plaintext values are not persisted by application code or written into tracked snapshots.

## Automated tests

Focused coverage includes email and username login parsing, invalid email, Admin/Staff email validation, distinct identity rules, password policy, role/status writes, in-place update behavior, split-identity refusal, no plaintext password in Prisma arguments, locked account rejection, wrong-password rejection, RBAC invariants, and Web privileged login form payload.

Live Typebot Cloud is intentionally not part of the root automated suite. The two-search standalone and embedded browser evidence above is recorded separately.

## Quality gates

The W3 gates were executed sequentially on the final state:

- `npm run format:check`: PASS;
- `npm run lint`: PASS for API, web, and shared;
- `npm run type-check`: PASS for API, web, and shared;
- focused auth/seed tests: PASS, 4 API files / 23 tests and 1 web file / 4 tests;
- `npm run test`: PASS, 406 tests total (178 API, 227 web, 1 shared);
- SEO regression: PASS, 9 files / 48 tests;
- `npm run seed:validate -w @rosach/api`: PASS with `blocking=false` and every blocker count at zero;
- `npm run build`: PASS, including Prisma Client generation, API/shared TypeScript, and Next 16.2.10 Turbopack production build;
- `git diff --check`: PASS.

Before the root build, only the RoSach web/API watcher trees were stopped and ports 3000/4000 were confirmed closed. SQL Server, ngrok, Codex, and unrelated processes were not stopped. The API/web watchers were restarted only for the final isolated Admin/Staff browser verification, then stopped again before closure.

## Scope verification

- dashboard or dashboard UI: not started;
- Commerce Core or order calculations: unchanged;
- Prisma schema or migration: unchanged;
- package or package lock: unchanged;
- global CORS: unchanged;
- chatbot API contract: unchanged;
- LLM/AI key: none;
- deployment, commit, push: none.

## Known limitations

The certified product targets use `http://localhost:3000`; they are valid only while the local RoSach web runtime is available to the browser. Typebot's official Redirect documentation notes that some Safari/iOS clients may show or block new-tab redirects; deployment certification must repeat the navigation matrix on the final HTTPS site origin.

## Admin dashboard readiness

The authentication, active privileged fixtures, and existing RBAC boundaries are ready for a separately approved dashboard milestone. This pass does not authorize or implement dashboard data, UI, reporting queries, or permissions.
