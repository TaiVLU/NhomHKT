# Open Questions and Decisions

## Decision log — đã duyệt

Ngày duyệt: theo phê duyệt Milestone 0 của chủ dự án. Các quyết định D-01 đến D-22 dưới đây là nguồn chuẩn cho thiết kế trước Milestone 1.

| ID | Trạng thái | Quyết định đã duyệt | Tài liệu ảnh hưởng chính |
|---|---|---|---|
| D-01 | Đã duyệt | PK dùng BIGINT IDENTITY; `orderCode` là mã hiển thị riêng. | ERD, dictionary, API |
| D-02 | Đã duyệt | Prisma ORM + repository: Controller → Service → Repository → Prisma → SQL Server; cho phép raw SQL parameterized cho transaction tồn kho khi cần. | Architecture, inventory, security |
| D-03 | Đã duyệt | Tạo đơn chỉ tăng reserved. Sang SHIPPING giảm onHand/reserved và consume reservation. Hủy trước SHIPPING release. Hàng trả chỉ tăng onHand sau nhận/kiểm tra. | Business rules, state machine, inventory, ERD/API |
| D-04 | Đã duyệt | Return trong 7 ngày từ deliveredAt; partial/full; một request/order; bắt buộc lý do; Staff/Admin duyệt; hoàn kho sau kiểm tra; phí ship chỉ hoàn khi lỗi RoSach; refund thủ công. | Return, payment, reporting, API |
| D-05 | Đã duyệt | Staff chỉ xem product/variant/price/inventory và inventory adjustment; không quản lý catalog/price. | Role matrix, API |
| D-06 | Đã duyệt | Staff chỉ xem FAQ; Admin quản lý, soft-delete, activate và keywords. | Role matrix, API |
| D-07 | Đã duyệt | Article lưu Markdown hoặc sanitized HTML; v1 ưu tiên Markdown/textarea; backend sanitize. | CMS, dictionary, security |
| D-08 | Đã duyệt, bổ sung bởi M0-F03 | Cloudinary; JPEG/PNG/WebP tối đa 5 MB; lưu URL + publicId; upload theo permission/purpose; dọn ảnh cũ. | CMS, dictionary, API, security |
| D-09 | Đã duyệt | Dự kiến = CONFIRMED; tiền đã thu Bank/QR khi xác nhận; doanh thu thực thu = DELIVERED; COD tại DELIVERED; return trừ theo ngày refund/completion; dashboard dùng thực thu. | Reporting, payment |
| D-10 | Đã duyệt | Giữ OperatingCost, nhập từng khoản/ngày; Admin quản lý; Staff chỉ xem tổng hợp nếu dashboard cho phép. | Reporting, dictionary, API |
| D-11 | Đã duyệt | Contact reply chỉ lưu DB ở v1; Customer đăng nhập xem qua notification/account; không email reply. OTP vẫn gửi email thật. | Contact, notification, API |
| D-12 | Đã duyệt | Không Supplier/InventoryReceipt ở v1; nhập kho bằng adjustment lý do RECEIPT. | ERD, inventory, API |
| D-13 | Đã duyệt | Access token ngắn hạn; refresh token HttpOnly Secure cookie, hash DB, rotation/revoke; không localStorage; SameSite/CSRF phù hợp. | Auth, API, security |
| D-14 | Đã duyệt | ISBN chuyển sang ProductVariant, nullable, filtered unique khi khác null. | Catalog, ERD, dictionary, API |
| D-15 | Đã duyệt | costPrice >=0; listPrice/salePrice >0; salePrice <= listPrice; không giảm thì bằng nhau. | Business rules, dictionary |
| D-16 | Đã duyệt | Search history localStorage cho guest/customer; không bảng SearchHistory v1; HotKeyword DB, Admin quản lý. | Catalog, ERD, API |
| D-17 | Đã duyệt | Customer không tự xóa; Admin lock/unlock; không hard delete/anonymize v1; giữ dữ liệu order. | User, dictionary, API |
| D-18 | Đã duyệt | Order giữ DELIVERED; ReturnRequest riêng: REQUESTED → APPROVED → COMPLETED hoặc REQUESTED → REJECTED; một request/order, nhiều items. | State machine, ERD, API |
| D-19 | Đã duyệt, làm rõ bởi M0-F02/F04 | Nhiều payment attempt/order; chỉ một CONFIRMED tại một thời điểm; refund thủ công theo contract return/exception. | Payment, dictionary, API |
| D-20 | Đã duyệt | Banner/FAQ/UnansweredChatQuery do Admin quản lý; Staff chỉ xem FAQ, không xử lý unanswered query. | Permission, API |
| D-21 | Đã duyệt | Address dùng text tỉnh/quận/phường/chi tiết; không API hành chính v1; Order snapshot toàn bộ text. | Checkout, dictionary |
| D-22 | Đã duyệt | Slug đã dùng không được tái sử dụng sau soft delete. | Catalog, CMS, dictionary, security |

## Documentation patch cuối — đã duyệt

| ID | Trạng thái | Quyết định đã duyệt | Tài liệu ảnh hưởng chính |
|---|---|---|---|
| M0-F01 | Đã duyệt | DB/backend dùng BIGINT/`bigint`; mọi ID qua JSON là string; frontend/shared types dùng string, không chuyển sang JS number; `orderCode` là chuỗi riêng. | API, architecture, dictionary, ERD, security |
| M0-F02 | Đã duyệt | Return partial/full; tối đa một refund transaction/ReturnRequest; amount bằng tổng refundAmount của ReturnItem được duyệt; partial không hoàn toàn Order; không chia một refund thành nhiều giao dịch. | Business rules, payment, reporting, ERD, dictionary, API |
| M0-F03 | Đã duyệt | Staff có `ARTICLE_MEDIA_UPLOAD` chỉ ARTICLE; Admin upload ARTICLE/PRODUCT/BANNER/QR/SYSTEM; API validate `uploadPurpose`. | Permission, CMS, API, security |
| M0-F04 | Đã duyệt | Staff refund chỉ qua ReturnRequest APPROVED đã nhận/kiểm tra; Admin refund ngoại lệ bắt buộc reason + audit; endpoint chính `/admin/return-requests/:id/refund`. | Payment, API, security |
| M0-F05 | Đã duyệt | Tạo Order có `CART` lấy server cart hoặc `BUY_NOW` nhận một variant/quantity; backend lấy lại giá/tồn, tự tính tổng, idempotency bắt buộc. | Cart/checkout, API |

## Các quyết định nền đã chốt trước đó

- Chỉ bán sách giấy; 3 role Customer/Staff/Admin; Staff/Admin dùng `/admin/login`.
- Một Product có nhiều category/author/variant; checkout một trang; không voucher v1.
- COD, bank transfer, QR tĩnh; không upload biên lai; Bank/QR hết hạn 15 phút.
- Tối đa 5 địa chỉ; review sau DELIVERED, một review/order item; không bình luận Article.
- Phí ship 30.000đ, miễn từ 300.000đ và lưu trong settings.
- Timestamp UTC, tiền VNĐ decimal, UI tiếng Việt, code/enum tiếng Anh.
- Backend tự tính giá/tổng/tồn và thực thi ownership/RBAC.

## Milestone 2 implementation decisions — đã duyệt

| ID | Trạng thái | Quyết định đã duyệt |
|---|---|---|
| M2-D01 | Đã duyệt | bcrypt cost 12; password 8–64 ký tự, <=72 UTF-8 bytes, có chữ+số; không log password. |
| M2-D02 | Đã duyệt | JWT HS256, secret env >=32 random bytes, TTL 15 phút; claims `sub,role,sid,jti,iss,aud,iat,exp`, không PII. |
| M2-D03 | Đã duyệt | Refresh opaque >=256 bit, TTL 7 ngày, DB hash; atomic conditional rotation, reuse revoke family; tối đa 5 active family/User. |
| M2-D04 | Đã duyệt | Cookie `rosach_refresh_token`, HttpOnly, Secure production, SameSite=Lax, Path `/api/v1/auth`, Max-Age 7 ngày; production same-site. |
| M2-D05 | Đã duyệt | Bearer routes không cookie auth; refresh/logout kiểm tra Origin/Referer + `X-RoSach-Client: web`; CORS credentials không wildcard. |
| M2-D06 | Đã duyệt | OTP 6 số/5 phút/5 lần sai/cooldown 60s; reset opaque 256 bit/10 phút; hash, single-use, atomic. |
| M2-D07 | Đã duyệt | Rate limits theo endpoint/IP/identifier-family như kế hoạch M2; response không enumeration. |
| M2-D08 | Đã duyệt | Nodemailer SMTP env; dev/test fake mailer; automated test không email thật; forgot response trung tính; không log OTP. |
| M2-D09 | Đã duyệt | Static type-safe permission registry; User role CUSTOMER/STAFF/ADMIN; middleware + service authorization; không permission tables M2. |
| M2-D10 | Đã duyệt | Username trim/lowercase immutable; email trim/lowercase; phone E.164 Việt Nam; register không role/status; Zod reject unknown. |
| M2-D11 | Đã duyệt | Register auto-login; change password revoke all rồi tạo current family mới; reset password revoke all và không auto-login. |
| M2-D12 | Đã duyệt | Logout current token, idempotent, luôn clear cookie; chưa logout-all; change/reset vẫn revoke all. |
| M2-D13 | Đã duyệt | Initial Admin seed dùng năm env đã chỉ định, explicit/idempotent, conflict-safe, không log secret, không auto-run production. |
| M2-D14 | Đã duyệt | Audit các security event bắt buộc; không secret; retention tối thiểu 180 ngày, chưa cleanup job M2. |
| M2-D15 | Đã duyệt | Generic login/forgot errors chống enumeration; duplicate register được conflict cụ thể; production không stack trace. |
| M2-D16 | Đã duyệt | M2 chỉ User/RefreshToken/PasswordResetOtp/AuditLog + Auth/RBAC API/UI/tests; không business schema/UI ngoài phạm vi. |
| M2-I01 | Đã duyệt | Password bcrypt; refresh/reset token SHA-256 hex; OTP HMAC-SHA-256 với env pepper; constant-time; không log raw/hash. |
| M2-I02 | Đã duyệt | AuditLog M2 chỉ dùng filtered `metadataJson`; không đồng thời beforeJson/afterJson; không chứa secret. |

## Mâu thuẫn đã xử lý trong lượt duyệt này

- Đã sửa `CODEX_START_HERE.md` từ file open questions số 24 sang số 30.
- Đã bỏ ISBN khỏi Product và chuyển sang ProductVariant.
- Đã xóa RETURN_REQUESTED/RETURNED/RETURN_REJECTED khỏi Order state machine; Order giữ DELIVERED.
- Đã chốt nghĩa `costPrice`, `listPrice`, `salePrice` và invariant giá.
- Đã chốt quyền tối thiểu của Staff với Product/FAQ và quyền Admin với Banner/chat query/cost.
- Đã loại Supplier, InventoryReceipt và SearchHistory DB khỏi phạm vi v1.

## Mâu thuẫn hoặc chi tiết còn cần duyệt

Không còn mâu thuẫn chặn thiết kế M0 trong 22 mục đã duyệt. Các chi tiết implementation sau đây có thể chốt trong kế hoạch M1/M2 nhưng không được tự biến thành business rule:

1. Tiêu chí xác định “lỗi thuộc RoSach” để hoàn shipping fee và checklist kiểm tra hàng trả.
2. Article slug cũ sẽ trả 404 hay redirect khi resource đổi slug; Product slug cũ đã chốt trả 404 trong M3-D10.
3. Chính sách retention/dọn Cloudinary ngoài Product assets; Product asset failure flow đã chốt trong M3-D11.

## Nguyên tắc cập nhật log

Mọi quyết định mới phải ghi ID, ngày/người duyệt, lựa chọn, lý do và tài liệu chịu ảnh hưởng. Không bắt đầu migration của một milestone trước khi kế hoạch và các quyết định của milestone đó được duyệt lần cuối.

## Milestone 3 implementation decisions — Đã duyệt

Ngày duyệt: theo review kế hoạch Milestone 3 của chủ dự án.

| ID | Trạng thái | Quyết định đã duyệt |
|---|---|---|
| M3-D01 | Đã duyệt | Author/Publisher có isActive + deletedAt; public chỉ active/non-deleted; Admin filter lifecycle; không hard-delete khi được tham chiếu; giữ slug reservation. |
| M3-D02 | Đã duyệt | Cho deactivate variant active cuối; không đổi Product.isActive; public Product bắt buộc có active variant và tự xuất hiện lại khi hợp lệ. |
| M3-D03 | Đã duyệt | publisherId nullable cả Product active; nếu có phải tồn tại/non-deleted; Publisher inactive bị loại DTO nhưng không ẩn Product. |
| M3-D04 | Đã duyệt | Chỉ Admin PRODUCT_MANAGE xem/sửa costPrice; Staff/Public không nhận; middleware và service cùng kiểm tra. |
| M3-D05 | Đã duyệt | SKU bắt buộc, uppercase, immutable, unique, không tái sử dụng; variant không hard-delete; sửa SKU bằng variant mới. |
| M3-D06 | Đã duyệt | ISBN-10/13 nullable ở variant, normalize canonical, validate checksum và filtered unique. |
| M3-D07 | Đã duyệt | Search chỉ SQL Server + Prisma/parameterized SQL; tìm Product/Author/Category/Publisher/ISBN; whitelist và Product ID tie-breaker. |
| M3-D08 | Đã duyệt | HotKeyword không thuộc M3; suggestions tối đa 5 Product; không table/Admin CRUD; SearchHistory chỉ localStorage. |
| M3-D09 | Đã duyệt | M3 không Inventory; public DTO không có quantity/stock/inStock/reserved hoặc thông báo tồn kho. |
| M3-D10 | Đã duyệt | Slug cũ giữ reservation, không tái sử dụng và trả 404; không redirect table M3. |
| M3-D11 | Đã duyệt | Cloudinary adapter cô lập/fake-test; cleanup best-effort + log/audit + manual command; không scheduler/temp table mặc định. |
| M3-D12 | Đã duyệt | Tối đa một Product primary và một primary/variant; fallback variant → Product → UI placeholder; filtered unique indexes. |
| M3-D13 | Đã duyệt | Tiền JSON là integer-valued number trong safe range; DB decimal(19,0), không floating-point; BIGINT ID vẫn string. |
| M3-D14 | Đã duyệt | SQL Server case/accent-insensitive Vietnamese search, normalized whitespace, escaped wildcard, parameterized query và integration tests. |
| M3-D15 | Đã duyệt | Admin Catalog API/UI thuộc M3; Staff read-only; phạm vi mới ưu tiên hơn roadmap cũ. |
| M3-D16 | Đã duyệt | Product description lưu Markdown; short/SEO plain text; safe renderer; không rich-text editor phức tạp. |

Sau các quyết định trên không còn quyết định implementation M3 nào đang mở. Chưa được bắt đầu source code, Prisma schema, migration, dependency hoặc Cloudinary trước phê duyệt triển khai M3 lần cuối.

## Milestone 4 deadline decisions — Đã duyệt

| ID | Trạng thái | Quyết định đã duyệt |
|---|---|---|
| M4-D01 | Đã duyệt | M4 chỉ gồm Customer Profile, Change Password, Address Book, Customer Account UI, tests và manual smoke; không gồm Wishlist, Cart, Admin Customer UI, Avatar hoặc M5. |
| M4-D02 | Đã duyệt | Profile cập nhật strict whitelist `fullName,phone,birthday,gender`; email/username/role/status read-only; DTO map tường minh và BIGINT ID là string. |
| M4-D03 | Đã duyệt | Address soft-delete, không restore/version; M4 deadline không giới hạn 5 Address; Address đầu tiên tự default và xóa default promote Address active cũ nhất. |
| M4-D04 | Đã duyệt | SQL Server filtered unique index bảo đảm tối đa một Address active default/User; thay default và promote thực hiện trong transaction. |
| M4-D05 | Đã duyệt | Customer `ADDRESS_SELF`; owner lấy từ JWT; query Address gồm `id,userId,deletedAt=null`; cross-owner trả `404`; Staff/Admin không dùng Customer address routes. |
| M4-D06 | Đã duyệt | Change password áp policy M2, xác minh current password, cấm trùng password cũ, revoke session cũ và cấp session mới; không thêm rate limit/concurrency flow mới. |

Không còn quyết định implementation M4 nào đang mở trong phạm vi deadline đã duyệt.

## M7.0 AI & UX planning risks - can Technical Lead review

| ID | Trang thai | Rui ro / cau hoi | Khuyen nghi |
|---|---|---|---|
| M7-Q01 | Can duyet | Neu tich hop AI provider, khoa API va policy khong duoc nam o frontend. | Chi dung backend proxy sau khi Technical Lead phe duyet M7.3; M7.1/M7.2 nen uu tien UI, FAQ tinh va product search read-only. |
| M7-Q02 | Can duyet | Chatbot co the bi hieu nham la AI Agent neu co quyen thao tac gio hang, don hang hoac kho. | Chot ngon ngu san pham la AI Receptionist; cam mutation va workflow automation. |
| M7-Q03 | Can duyet | Floating widget co the che CTA tren mobile, dac biet cart/checkout. | Bat buoc kiem tra 390x844, 430x932, 768x1024 va dieu chinh vi tri theo route neu can. |
| M7-Q04 | Can duyet | AI tra loi chinh sach hoac gioi thieu sach co the tao thong tin khong co trong du lieu. | Dung knowledge base duoc duyet; cau tra loi ve sach phai dua tren public catalog data va link canonical. |
| M7-Q05 | Can duyet | Chatbot co the lam tang bundle size va anh huong Core Web Vitals. | Lazy-load chat window va khong them AI SDK/frontend dependency khi chua co do luong. |
