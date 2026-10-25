# Milestone 2 — Authentication & RBAC Implementation Plan

## Mục tiêu và ranh giới

M2 triển khai register/login/admin login, JWT access token, refresh rotation, logout, đổi/quên/reset mật khẩu, RBAC tĩnh, initial Admin seed, Auth UI và test. M2 chỉ tạo `User`, `RefreshToken`, `PasswordResetOtp`, `AuditLog` và migration Auth/RBAC.

Không tạo Product, Cart, Order, Inventory, Payment, Dashboard, customer/staff management UI hoặc dynamic permission tables.

## Quyết định bảo mật đã chốt

- Password dùng bcrypt cost 12; 8–64 ký tự, tối đa 72 UTF-8 bytes, có ít nhất chữ và số. Cho phép ký tự đặc biệt và khoảng trắng bên trong; không log password.
- Access JWT HS256, secret environment tối thiểu 32 random bytes, TTL 15 phút; claims `sub,role,sid,jti,iss,aud,iat,exp`; `sub` là string, không chứa PII.
- Refresh token opaque tối thiểu 256 bit, TTL 7 ngày, cookie raw token nhưng DB chỉ hash. Rotation nằm trong DB transaction với conditional update; reuse revoke cả family. Tối đa 5 active family/User, vượt giới hạn revoke family cũ nhất.
- Cookie `rosach_refresh_token`: HttpOnly, Secure production/false local, SameSite=Lax, Path `/api/v1/auth`, Max-Age 7 ngày. Production giữ web/API cùng site.
- Refresh/logout kiểm tra Origin/Referer bằng `WEB_ORIGIN` và header `X-RoSach-Client: web`; Bearer routes không dùng cookie auth. CORS credentials không wildcard.
- OTP 6 số, TTL 5 phút, 5 lần sai, cooldown gửi lại 60 giây. Reset token opaque 256 bit, TTL 10 phút. Chỉ lưu hash, single-use, cập nhật atomic.
- SMTP qua Nodemailer/environment; automated test dùng fake mailer và không gửi email thật.
- Refresh/reset token hash bằng SHA-256 hex 64 ký tự; OTP hash bằng HMAC-SHA-256 với `OTP_PEPPER` và so sánh constant-time. Password vẫn chỉ dùng bcrypt.

## Database models và migration

### User

BIGINT IDENTITY; username lowercase unique, fullName, email lowercase unique, phone E.164 Việt Nam unique, passwordHash, role CUSTOMER/STAFF/ADMIN, status ACTIVE/LOCKED, timestamps và các field đã duyệt. Register không nhận role/status và luôn tạo CUSTOMER.

### RefreshToken

BIGINT IDENTITY; userId; tokenHash unique; familyId; expiresAt; revokedAt; revocationReason; replacedByTokenId; createdAt; lastUsedAt; createdIp; userAgent. Index cho user/session expiry và family. Rotation dùng conditional update để chỉ một request thắng.

### PasswordResetOtp

BIGINT IDENTITY; userId; otpHash; expiresAt; attemptCount; verifiedAt; resetTokenHash; resetTokenExpiresAt; consumedAt; createdAt. OTP mới invalidate OTP active cũ; verify/attempt/consume atomic.

### AuditLog

BIGINT IDENTITY; actorUserId nullable; action; entityType/entityId; requestId; IP; `metadataJson` nullable đã lọc; createdAt. Không tạo beforeJson/afterJson; không lưu secret. Retention tối thiểu 180 ngày; chưa làm cleanup job M2.

Migration M2 chỉ chứa bốn bảng trên, constraints/indexes và enum/check liên quan. Review SQL trước khi apply; không tạo schema nghiệp vụ ngoài Auth.

## API contract M2

| Method | Endpoint | Hành vi |
|---|---|---|
| POST | `/api/v1/auth/register` | Normalize, tạo CUSTOMER, đăng nhập ngay, trả safe user + access token, set refresh cookie |
| POST | `/api/v1/auth/login` | Customer-only; invalid identifier/password cùng một lỗi |
| POST | `/api/v1/auth/admin/login` | Staff/Admin-only |
| POST | `/api/v1/auth/refresh` | Origin/header/cookie checks, rotate atomic, trả access token + cookie mới |
| POST | `/api/v1/auth/logout` | Revoke current token nếu có, luôn clear cookie, idempotent |
| POST | `/api/v1/auth/forgot-password` | Neutral response, tạo/gửi OTP nếu hợp lệ |
| POST | `/api/v1/auth/verify-otp` | Verify atomic, phát opaque reset token một lần |
| POST | `/api/v1/auth/reset-password` | Consume reset token, đổi password, revoke all sessions, không auto-login |
| GET | `/api/v1/auth/session` | Bearer auth, safe current-user DTO |
| PATCH | `/api/v1/me/password` | Current password, revoke all old sessions, tạo family mới cho thiết bị hiện tại |

Mọi ID JSON là string. Error dùng response envelope chuẩn; production không stack trace.

## Backend structure

```text
src/modules/auth/
  auth.routes.ts
  auth.controller.ts
  auth.service.ts
  auth.repository.ts
  auth.schema.ts
  auth.mapper.ts
  password.service.ts
  token.service.ts
  otp.service.ts
  mailer.ts
src/modules/rbac/
  permissions.ts
  rbac.service.ts
src/middlewares/
  authenticate.ts
  authorize.ts
  auth-csrf.ts
  rate-limit.ts
  validate.ts
```

Luồng giữ `Route -> Middleware -> Controller -> Service -> Repository -> Prisma`. Permission registry static/type-safe; middleware kiểm tra role/permission, service kiểm tra lại ownership/authorization.

## Normalization và validation

- Username trim/lowercase, 5–15 ký tự, case-insensitive và không đổi.
- Email trim/lowercase.
- Phone `0xxxxxxxxx` normalize sang E.164 Việt Nam `+84xxxxxxxxx` và validate chặt.
- Zod strict reject unknown fields; register không nhận role/status.
- Duplicate register có conflict cụ thể; login dùng `AUTH_INVALID_CREDENTIALS`; forgot-password luôn neutral.

## Rate limit

- Register: 5/15 phút/IP.
- Customer login: 10/15 phút/IP + identifier.
- Admin login: 5/15 phút/IP + identifier.
- Forgot password: 3/15 phút/IP + email hash.
- Verify OTP: 5/10 phút/reset request.
- Refresh: 30/15 phút/IP + token family.
- Keys dùng normalized/hash, không log PII hoặc làm lộ account existence.

## Initial Admin seed

Seed tường minh dùng `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_FULL_NAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PHONE`, `INITIAL_ADMIN_PASSWORD`. Không log/hard-code secret. Idempotent chỉ khi cả ba identifier cùng trỏ một Admin; nếu split identity hoặc role khác thì fail conflict. Không tự chạy khi production startup.

## Audit bắt buộc

Ghi initial Admin seed, password changed/reset, family revoked do reuse, LOCKED login/refresh và Admin security action trong M2. Không ghi raw token/password/OTP/cookie.

## Frontend

Tạo `/dang-ky`, `/dang-nhap`, `/quen-mat-khau`, reset-password flow, `/admin/login`, `/admin/403`. Access token giữ memory; refresh qua credentialed cookie; không lưu token trong localStorage. Frontend guard chỉ hỗ trợ UX, backend là authorization boundary.

## Test plan

- Unit: normalization, strict schemas, bcrypt byte limit/hash, JWT claims/TTL, opaque-token hashing, OTP/reset atomic rules, permission registry, BIGINT-to-string mapping.
- Integration: register immediate login, endpoint separation Customer/Staff/Admin, duplicate conflicts, locked account, atomic refresh race, rotation/reuse/family/session cap, logout idempotency, password change/reset revocation, OTP expiry/attempt/cooldown/single-use, CSRF Origin/header, rate limits và safe errors.
- Seed: first create, idempotent rerun, split-identity/role conflict, no secret logs.
- Web/E2E: register/login/refresh/logout/reset, admin login và Customer nhận 403.
- Automated tests dùng fake mailer; không gửi email thật.

## Trình tự triển khai

1. Cập nhật environment schema/example và dependency đã duyệt.
2. Thêm bốn Prisma models, generate/review migration SQL.
3. Implement crypto/token/OTP/mailer abstractions.
4. Implement repository và transaction rotation/reset.
5. Implement services, validation, controllers/routes.
6. Implement authenticate/authorize/CSRF/rate-limit/error handling.
7. Implement seed và audit writes.
8. Implement Auth pages/session client.
9. Chạy unit/integration/E2E/security-negative tests.
10. Chạy Prisma validation/migration, lint, type-check, test, build và dừng trước M3.

## Acceptance criteria

- Bốn bảng Auth được migration đúng phạm vi; seed an toàn/idempotent.
- Register/login/admin login, refresh/logout, change/forgot/reset password đúng contract.
- JWT/cookie TTL, flags và claims đúng; refresh rotation race-safe và reuse revoke family.
- Tối đa 5 family active; locked account bị từ chối và audit.
- OTP/reset single-use, atomic, không enumeration; rate limits đúng.
- RBAC backend trả đúng 401/403; Customer không truy cập admin.
- Không secret/PII nhạy cảm trong token/log; mọi API ID là string.
- Lint, strict type-check, tests, build, Prisma validation và SQL Server integration đều pass.

## Chi tiết triển khai còn cần duyệt

Không còn quyết định nghiệp vụ/bảo mật chặn M2. Khi triển khai cần chọn tên package cụ thể tương thích stack cho bcrypt, JWT, rate limit và SMTP nhưng không được thay đổi các hành vi M2-D01..D16.
