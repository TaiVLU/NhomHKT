# Security Guidelines

## Customer account (M4)

- Profile chỉ cho phép cập nhật `fullName`, `phone`, `birthday`, `gender`; email, username, role, status và các trường xác thực là read-only. DTO được map tường minh, không spread Prisma User.
- Address routes bắt buộc Customer có `ADDRESS_SELF`; `userId` luôn lấy từ JWT. Mọi truy vấn một Address ràng buộc đồng thời `id`, `userId`, `deletedAt = null`; tài nguyên khác owner trả `404` để tránh dò ID.
- Đổi mật khẩu bắt buộc xác minh bcrypt với mật khẩu hiện tại, cấm mật khẩu mới trùng mật khẩu cũ, áp policy M2, thu hồi các refresh session cũ và cấp session mới. Không log password/hash/token.
- Audit `PROFILE_UPDATED`, `PASSWORD_CHANGED`, `ADDRESS_CREATED`, `ADDRESS_UPDATED`, `ADDRESS_DEFAULT_CHANGED`, `ADDRESS_DELETED`; metadata không chứa password/token hoặc toàn bộ phone/address.

- Hash password bằng bcrypt cost 12. Password 8–64 ký tự, tối đa 72 UTF-8 bytes, có ít nhất chữ và số; không log password.
- Refresh/reset token opaque tối thiểu 256 bit được SHA-256 trước khi lưu (`char(64)` hex). OTP dùng HMAC-SHA-256 với `OTP_PEPPER`; so sánh constant-time. Không log raw token hoặc token hash. Không dùng SHA-256 cho password.
- OTP 6 số/5 phút, tối đa 5 lần sai, cooldown 60 giây; reset token opaque 256-bit/10 phút. OTP/reset token chỉ lưu hash, single-use và update atomic.
- Access JWT HS256 TTL 15 phút; secret environment tối thiểu 32 random bytes; claims không chứa PII. Refresh opaque 256-bit TTL 7 ngày, raw token chỉ ở HttpOnly cookie và DB chỉ hash; rotation transaction + conditional update, reuse revoke family, tối đa 5 active family/User.
- Rate limit auth và form công khai.
- Validate request bằng Zod.
- Sanitize Markdown/HTML phía backend trước khi lưu hoặc render.
- Chống IDOR bằng ownership check.
- RBAC ở backend.
- CORS allowlist.
- Helmet.
- Không trả stack trace production.
- Ảnh dùng Cloudinary, chỉ JPEG/PNG/WebP tối đa 5 MB, kiểm MIME thực tế/size/extension, lưu URL + publicId và dọn asset cũ an toàn. API bắt buộc validate `uploadPurpose`: Staff với `ARTICLE_MEDIA_UPLOAD` chỉ dùng ARTICLE; Admin dùng ARTICLE/PRODUCT/BANNER/QR/SYSTEM.
- Không lưu secret trong repository.
- Audit thao tác quan trọng.
- Cookie `rosach_refresh_token`: HttpOnly, Secure production/false local, SameSite=Lax, Path `/api/v1/auth`, Max-Age 7 ngày. Refresh/logout kiểm tra Origin/Referer theo `WEB_ORIGIN` và header `X-RoSach-Client: web`; CORS credentials chỉ allowlist, không wildcard.
- Rate limits: register 5/15m/IP; customer login 10/15m/IP+identifier; admin login 5/15m/IP+identifier; forgot 3/15m/IP+email hash; verify OTP 5/10m/request; refresh 30/15m/IP+family.
- Nodemailer SMTP qua environment; automated test dùng fake mailer, không gửi email thật và không log OTP.
- Prisma/repository không thay thế authorization; raw SQL tồn kho phải parameterized và nằm trong transaction.
- Không tái sử dụng slug sau soft delete để tránh chiếm URL/SEO lịch sử.
- Refund của Staff chỉ đi qua ReturnRequest APPROVED đã nhận/kiểm tra; Admin refund ngoại lệ bắt buộc reason và audit log. Không cấp endpoint payment refund tùy ý cho Staff.
- Không chuyển BIGINT ID sang JavaScript number; serialize JSON thành string để tránh mất chính xác và tránh authorization/ownership lookup sai ID.
- SQL parameterized/ORM.

## Admin route access M7.5A

- `/admin/login` is the only anonymous-accessible Admin route.
- Anonymous and CUSTOMER requests to operational `/admin/*` routes must not render the Admin shell or protected content and are redirected to `/` by the web route boundary.
- CUSTOMER receives the safe message `Bạn không có quyền truy cập khu vực quản trị.`; ADMIN and STAFF visiting `/admin/login` go to `/admin/dashboard`.
- STAFF remains read-only where the permission registry grants `PRODUCT_READ` or other approved read permissions. Admin-only mutations remain guarded by `PRODUCT_MANAGE` and the API remains authoritative.
- Client navigation and direct URL loads use the same policy. The UI guard is not a substitute for API authorization.
- Log không chứa password, OTP, token hoặc thông tin nhạy cảm.
- QR và bank settings chỉ Admin được sửa.

## Admin reporting M7.4E

- Reporting routes require authenticated `ADMIN_ACCESS`; Admin and Staff may read, while Customer receives 403 and anonymous callers receive 401.
- Reporting is read-only and exposes no mutation route. Staff keeps the explicit read-only shell and receives no cost, margin or mutation control.
- Report DTOs exclude customer name, email, phone, address, account data, credentials, cookies and tokens. Recent-order records contain only the public-safe order number, status, monetary total and timestamp.
- Revenue is derived from immutable `Order.grandTotal` for `COMPLETED` orders. Product/category aggregation uses immutable OrderItem snapshots; current catalog records never overwrite history.
- Strict paired date parameters, a 366-day maximum range and bounded result lists limit abusive reporting queries. Error responses use the existing stable envelope without Prisma/SQL or stack-trace leakage.

## Catalog M3

- Chỉ Admin PRODUCT_MANAGE được xem/sửa costPrice và upload ảnh với `uploadPurpose=PRODUCT`; Staff PRODUCT_READ chỉ nhận DTO không nhạy cảm.
- Upload Product kiểm tra magic bytes/MIME thực, extension, giới hạn 5 MB và chỉ JPEG/PNG/WebP; backend kiểm soát Cloudinary namespace, không tin filename, URL hoặc publicId từ client.
- Cloudinary adapter hỗ trợ fake test. Attach thất bại thì xóa best-effort; cleanup thất bại ghi structured log/audit đã lọc và có manual cleanup command, không rollback DB mutation đã thành công.
- Markdown Product phải render qua renderer an toàn, chặn embedded HTML nguy hiểm, script, event handler và URL scheme nguy hiểm.
- Catalog query chỉ dùng filter/sort whitelist và parameterized SQL; constraint database là lớp bảo vệ cuối cho slug/SKU/ISBN/primary image.
