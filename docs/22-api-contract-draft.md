# API Contract Draft — v1

Base path: `/api/v1`. JSON UTF-8, timestamps ISO-8601 UTC, tiền là integer-valued JSON number theo VNĐ. Client không gửi/không được tin cậy role, giá, tổng tiền, phí ship, tồn kho hoặc ownership.

Database/backend dùng BIGINT/`bigint`, nhưng **mọi ID trong JSON request/response là decimal string**. Frontend/shared types dùng `string`; không chuyển ID sang JavaScript number. `orderCode` vẫn là chuỗi nghiệp vụ riêng.

## Quy ước chung

Success:

```json
{"success":true,"data":{},"meta":{"page":1,"pageSize":20,"total":0},"requestId":"..."}
```

Error:

```json
{"success":false,"error":{"code":"ORDER_INSUFFICIENT_STOCK","message":"Sản phẩm không còn đủ số lượng.","fields":{}},"requestId":"..."}
```

- List dùng `page` (>=1), `pageSize` (mặc định 20, tối đa 100), `sort`; filter được whitelist.
- Validation lỗi: `400`; chưa đăng nhập `401`; thiếu quyền `403`; không tìm thấy hoặc ownership không hợp lệ `404`; conflict/state/version `409`; rate limit `429`.
- Mutation tạo resource trả `201`; delete thành công `204`; request idempotent quan trọng nhận `Idempotency-Key` (tạo order, xác nhận payment, transition, expiry/refund).
- Access JWT HS256 TTL 15 phút, secret environment tối thiểu 32 random bytes; claims `sub,role,sid,jti,iss,aud,iat,exp`, `sub` là string và không có PII. Refresh opaque 256-bit TTL 7 ngày chỉ ở cookie `rosach_refresh_token`; DB chỉ lưu hash, rotate atomic, reuse revoke family, tối đa 5 active family/User.
- Refresh cookie: HttpOnly, Secure production/false local, SameSite=Lax, Path `/api/v1/auth`, Max-Age 7 ngày. Refresh/logout kiểm tra Origin/Referer theo `WEB_ORIGIN` và `X-RoSach-Client: web`; CORS credentials không wildcard.

## Permission codes

- Customer self-service: `PROFILE_SELF`, `ADDRESS_SELF`, `CART_SELF`, `ORDER_SELF`, `REVIEW_SELF`.
- Staff: `DASHBOARD_BASIC_READ`, `PRODUCT_READ`, `INVENTORY_READ/UPDATE`, `ORDER_READ/UPDATE`, `PAYMENT_READ/CONFIRM`, `ARTICLE_MANAGE`, `ARTICLE_MEDIA_UPLOAD`, `CONTACT_MANAGE`, `FAQ_READ`.
- Admin có toàn bộ và thêm `PRODUCT_MANAGE`, `USER_MANAGE`, `STAFF_MANAGE`, `FAQ_MANAGE`, `BANNER_MANAGE`, `CHAT_QUERY_MANAGE`, `OPERATING_COST_MANAGE`, `REPORT_FULL_READ`, `SETTING_MANAGE`, `AUDIT_READ`.
- Mỗi route `/admin` kiểm tra permission ở middleware và service; Staff không mặc nhiên nhận quyền Admin.

## Auth và profile

| Method | Path | Auth | Contract chính |
|---|---|---|---|
| POST | `/auth/register` | Public | `{username,fullName,email,phone,password}` → safe user + access token + refresh cookie; luôn CUSTOMER |
| POST | `/auth/login` | Public | `{username,password}`; chỉ Customer |
| POST | `/auth/admin/login` | Public | `{email,password}` hoặc `{username,password}`; chỉ Staff/Admin. UI local dùng email |
| POST | `/auth/refresh` | Refresh cookie + CSRF checks | rotate transaction/conditional update; access token + cookie mới |
| POST | `/auth/logout` | Refresh cookie + CSRF checks | revoke current token nếu có, luôn clear cookie; idempotent |
| POST | `/auth/forgot-password` | Public | `{email}`; luôn trả thông điệp trung tính |
| POST | `/auth/verify-otp` | Public | `{email,otp}` → opaque reset token 10 phút |
| POST | `/auth/reset-password` | Reset token | `{newPassword}`; revoke all sessions, không auto-login |
| GET | `/auth/session` | Bearer | safe current-user DTO |
| GET/PATCH | `/me/profile` | `PROFILE_SELF` | patch strict whitelist `fullName,phone,birthday,gender`; email/username/role/status read-only; phone conflict `409` |
| PATCH | `/me/password` | `PROFILE_SELF` | `{currentPassword,newPassword}`; mật khẩu hiện tại sai `PROFILE_CURRENT_PASSWORD_INVALID`, mật khẩu mới trùng `PROFILE_PASSWORD_UNCHANGED`; revoke all old sessions và tạo session family mới |
| GET/POST | `/me/addresses` | Customer + `ADDRESS_SELF` | list/create; `userId` lấy từ JWT và bị reject nếu có trong body; Address đầu tiên tự thành default |
| GET/PATCH/DELETE | `/me/addresses/:id` | Customer + `ADDRESS_SELF`, owner | query đồng thời `id,userId,deletedAt=null`; cross-owner trả `404`; DELETE soft-delete và promote default khi cần |
| PUT | `/me/addresses/:id/default` | Customer + `ADDRESS_SELF`, owner | đổi default trong transaction; tối đa một default active |

M4 bản deadline không áp giới hạn 5 Address. Mọi Address ID trong JSON là string. Address DTO chỉ chứa trường giao hàng an toàn; không trả User/auth fields. Không có restore Address trong M4.
| GET | `/me/notifications` | Auth/self | filter `read` |
| PATCH | `/me/notifications/:id/read` | Auth/owner | set readAt |
| POST | `/me/notifications/read-all` | Auth/self | idempotent |
| GET | `/me/contacts` | Customer/self | các contact đã gửi và phản hồi lưu trong DB |
| GET | `/me/contacts/:id` | Customer/owner | chi tiết và replies; không lộ internal notes |

## Catalog và content public

| Method | Path | Query/body |
|---|---|---|
| GET | `/products` | `q,category,author,publisher,isNew,isFeatured,minPrice,maxPrice,sort,page,pageSize` |
| GET | `/products/:slug` | product, variants active, prices, images, active relations; không có inventory availability |
| GET | `/products/search-suggestions` | `q`; tối đa 5 products, không HotKeyword trong M3 |
| GET | `/categories`, `/authors`, `/publishers` | active lists, pagination khi cần |
| GET | `/products/:productId/reviews` | published reviews only |
| GET | `/articles` | `category,status=published,tag,page,pageSize` |
| GET | `/articles/:slug` | published article |
| GET | `/faqs` | `category,q` active only |
| POST | `/chatbot/query` | `{query}`; order lookup chỉ khi auth và owner |
| POST | `/contacts` | Public/Auth; `{fullName,email,phone?,subject,message}` |
| GET | `/site/public-settings` | chỉ allowlist setting công khai |

## Cart và wishlist

| Method | Path | Contract |
|---|---|---|
| GET | `/cart` | Customer; giá/tồn được refresh từ backend |
| POST | `/cart/merge` | Customer; `{items:[{productVariantId,quantity}]}` → cart + adjustments; client chỉ xóa local sau success |
| POST | `/cart/items` | Customer; `{productVariantId,quantity}` |
| PATCH | `/cart/items/:id` | Owner; `{quantity}` |
| DELETE | `/cart/items/:id` | Owner |
| GET | `/wishlist` | Customer |
| POST | `/wishlist/:productId` | Customer; idempotent |
| DELETE | `/wishlist/:productId` | Customer; idempotent |

Inactive variant/product không được add/merge; quantity luôn được cap/reject theo available với adjustment rõ trong response.

## Checkout, order, payment và review

### Tạo đơn

M5D Phase 1.5 implemented endpoint:

`POST /checkout` — Customer, `Idempotency-Key` bắt buộc.

```json
{
  "shippingAddressId": "123",
  "paymentMethod": "COD",
  "deliveryNote": "Giao trong giờ hành chính"
}
```

- Endpoint hiện tại chỉ hỗ trợ checkout từ server cart. Không nhận `customerId`, `cartId`, item list, price, subtotal, shippingFee, discount, grandTotal, inventory, order status hoặc payment status từ frontend.
- Backend lấy địa chỉ theo owner từ JWT, snapshot immutable vào Order: recipient name, phone, line1, ward, district, province, postalCode, deliveryNote.
- `paymentMethod=COD` được hỗ trợ đầy đủ; `paymentStatus=UNPAID`; `orderStatus=PENDING_CONFIRMATION`.
- Totals snapshot: `subtotal` từ OrderItems, `shippingFee=0`, `discount=0`, `grandTotal=subtotal + shippingFee - discount`. `OrderItem.unitPrice` là giá checkout đã xác nhận.
- `Idempotency-Key` unique theo Customer. Cùng key/cùng request trả lại confirmation gốc; cùng key/request khác trả `CHECKOUT_IDEMPOTENCY_CONFLICT`; validation failure rollback record nên có thể retry sau khi sửa lỗi.

`POST /orders` — Customer, `Idempotency-Key` bắt buộc.

```json
{
  "checkoutMode":"CART",
  "addressId":"123",
  "paymentMethod":"COD",
  "note":""
}
```

Với `checkoutMode=BUY_NOW`:

```json
{
  "checkoutMode":"BUY_NOW",
  "addressId":"123",
  "productVariantId":"456",
  "quantity":1,
  "paymentMethod":"COD",
  "note":""
}
```

- `CART`: backend lấy item từ server cart; request không gửi item list làm nguồn chính. Chỉ xóa/cập nhật CartItem sau khi transaction tạo Order thành công.
- `BUY_NOW`: nhận đúng một `productVariantId` string và `quantity`, không phụ thuộc server cart.
- Cả hai mode: backend lấy địa chỉ owner, giá hiện tại, cost, shipping settings và inventory; tự tính tổng và tạo snapshot + reservation trong transaction. Không nhận `subtotal`, `shippingFee`, `totalAmount` hoặc giá từ client.
- Response gồm `id` dạng string, `orderCode`, `status`, amounts, `paymentInstructions?`, `expiresAt?`.

| Method | Path | Rule |
|---|---|---|
| GET | `/orders` | Customer, chỉ đơn của mình; filter status/date |
| GET | `/orders/:orderCode` | Customer owner; gồm timeline, items, payment summary |
| POST | `/orders/:orderCode/cancel` | Owner; `{reason}`; chỉ pending-payment/pending-confirmation, idempotent |
| POST | `/orders/:orderCode/return-request` | Owner; Order vẫn DELIVERED; trong 7 ngày; `{reason,items:[{orderItemId,quantity}]}`; một request/order, partial/full |
| GET | `/orders/:orderCode/return-request` | Owner |
| POST | `/order-items/:id/review` | Owner; `{rating,content}`; order delivered, một review/item |
| PATCH | `/reviews/:id` | Owner; `{rating,content}`; moderation chạy lại |

## Admin/Staff

### Dashboard và reports

- `GET /admin/dashboard` — basic dashboard cho Staff/Admin; metric theo định nghĩa report.
- `GET /admin/reports/summary|orders|products|categories|payments|inventory` — Staff bị giới hạn field/range; Admin đầy đủ.
- `GET /admin/reports/:type/export?format=csv` — CSV bắt buộc; quyền tương ứng.

### Catalog

- `GET /admin/products`, `GET /admin/products/:id` — Staff/Admin.
- `POST/PATCH/DELETE /admin/products[/:id]` — Admin `PRODUCT_MANAGE`; delete là soft delete.
- CRUD tương tự cho `/admin/categories`, `/admin/authors`, `/admin/publishers`; Admin manage, Staff read.
- Variant và image là nested resources: `/admin/products/:id/variants`, `/admin/products/:id/images`.

### Inventory

- `GET /admin/inventory`, `GET /admin/inventory/:variantId/history` — Staff/Admin.
- `POST /admin/inventory/:variantId/adjustments` — Staff/Admin; `{onHandDelta,reason,expectedVersion}`; không cho set available trực tiếp.
- Không có Supplier/receipt endpoints ở phiên bản đầu. Nhập kho qua adjustment với lý do `RECEIPT`.

### Order và payment

- `GET /admin/orders`, `GET /admin/orders/:orderCode` — Staff/Admin.
- `POST /admin/orders/:orderCode/transitions` — `{toStatus,note,expectedVersion}`; state machine + permission.
- `GET /admin/payments` — Staff/Admin.
- `POST /admin/payments/:id/confirm` — Staff/Admin, idempotency; `{reference?,note?,expectedVersion}`.
- `POST /admin/return-requests/:id/approve|reject` — Staff/Admin; REQUESTED sang APPROVED/REJECTED.
- `POST /admin/return-requests/:id/receive` — Staff/Admin ghi nhận đã nhận và kiểm tra; item đạt điều kiện mới được hoàn kho.
- `POST /admin/return-requests/:id/refund` — Staff/Admin, `Idempotency-Key`; ReturnRequest phải APPROVED, đã nhận/kiểm tra. Backend refund đúng tổng `refundAmount` của ReturnItem được duyệt, tối đa một transaction/request; partial return không hoàn toàn bộ Order.
- `POST /admin/return-requests/:id/complete` — Staff/Admin; chỉ sau refund/hoàn kho cần thiết; Order vẫn DELIVERED.
- `POST /admin/payments/:id/exceptional-refund` — Admin-only; trường hợp ngoài return flow, bắt buộc `{reason,amount}` và audit log. Không mở payment refund tùy ý cho Staff.

### Users, content, support và system

- `/admin/customers`: GET list/detail; PATCH status/risk chỉ Admin.
- `/admin/staff`: Admin CRUD/lock; không cho tự hạ quyền người quản trị cuối cùng (nếu rule này được áp dụng).
- `/admin/articles`, `/admin/article-categories`, `/admin/tags`: Staff/Admin manage.
- `/admin/faqs`, `/admin/faq-categories`: Admin manage/soft-delete/activate/keywords; Staff chỉ read.
- `/admin/contacts`: Staff/Admin list/detail; PATCH status; POST replies/internal-notes. Reply chỉ lưu DB, không gửi email ở v1.
- `/admin/banners`: Admin manage (Staff chưa có quyền trong matrix).
- `/admin/settings`: Admin only; public/private setting allowlist, bank/QR protected.
- `/admin/audit-logs`: Admin read-only; filter actor/action/entity/date.
- `/admin/unanswered-chat-queries`: Admin-only ở v1.
- `/admin/operating-costs`: Admin CRUD từng khoản theo ngày; Staff không truy cập CRUD.
- `POST /admin/uploads/images`: multipart JPEG/PNG/WebP tối đa 5 MB, bắt buộc `uploadPurpose=ARTICLE|PRODUCT|BANNER|QR|SYSTEM` → `{url,publicId}`. Staff cần `ARTICLE_MEDIA_UPLOAD` và chỉ dùng ARTICLE; Admin dùng mọi purpose. Backend không suy quyền từ tên file/path; thay/xóa resource phải dọn asset cũ.
- HotKeyword không thuộc M3 và chưa có Admin API trong milestone này. Search history không có API server-side ở v1.

### Catalog M3 — DTO và lifecycle

- Product public khi active, chưa soft-delete và có ít nhất một variant active. Public taxonomy chỉ chứa resource active, chưa deleted.
- Public/Staff DTO không có `costPrice`; chỉ Admin có `PRODUCT_MANAGE` được xem/sửa trường này.
- Public DTO không có availableQuantity, stock status, inStock hoặc reserved quantity.
- Staff có `PRODUCT_READ` chỉ GET; chỉ Admin `PRODUCT_MANAGE` được mutate catalog và upload `uploadPurpose=PRODUCT`.
- Search/filter giá chỉ dùng active variants; search dùng whitelist, query parameterized và stable Product ID tie-breaker.

### Catalog error codes

- `CATALOG_PRODUCT_NOT_FOUND`, `CATALOG_CATEGORY_NOT_FOUND`, `CATALOG_AUTHOR_NOT_FOUND`, `CATALOG_PUBLISHER_NOT_FOUND`, `CATALOG_VARIANT_NOT_FOUND`.
- `CATALOG_SLUG_CONFLICT`, `CATALOG_SKU_CONFLICT`, `CATALOG_ISBN_CONFLICT`.
- `CATALOG_INVALID_ISBN`, `CATALOG_INVALID_PRICE`, `CATALOG_RELATION_INVALID`.
- `CATALOG_IMAGE_INVALID`, `CATALOG_IMAGE_SCOPE_INVALID`.

## Error codes nghiệp vụ tối thiểu

`AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `AUTH_OTP_INVALID`, `AUTH_OTP_EXPIRED`, `FORBIDDEN_PERMISSION`, `RESOURCE_NOT_FOUND`, `ADDRESS_LIMIT_REACHED`, `CART_ITEM_INACTIVE`, `CART_QUANTITY_EXCEEDS_AVAILABLE`, `ORDER_INSUFFICIENT_STOCK`, `ORDER_INVALID_TRANSITION`, `ORDER_CANNOT_CANCEL`, `ORDER_PAYMENT_EXPIRED`, `PAYMENT_ALREADY_CONFIRMED`, `CONCURRENCY_CONFLICT`, `REVIEW_NOT_ELIGIBLE`, `REVIEW_ALREADY_EXISTS`, `RETURN_POLICY_NOT_CONFIGURED`.

## Ràng buộc đã chốt ảnh hưởng contract

- ID là BIGINT trong DB/backend nhưng string qua JSON và shared/frontend types; không chuyển sang JavaScript number. `orderCode` là mã công khai riêng. Prisma repository là data access chính, raw SQL parameterized được phép cho transaction tồn kho.
- Transition sang `SHIPPING` consume reservation và giảm onHand/reserved; hủy trước đó release.
- Return lifecycle độc lập; hoàn kho sau nhận/kiểm tra. Dashboard dùng doanh thu Order DELIVERED và trừ return theo ngày refund/completion.

### M7.4E Admin reporting

- `GET /admin/dashboard/overview`, `/revenue`, `/product-statistics`: authenticated Admin/Staff read-only endpoints.
- Optional paired `from`/`to` use strict `YYYY-MM-DD`, inclusive Vietnam calendar days, maximum 366 days, with deterministic equal-duration comparison.
- Current executable recognized status is `COMPLETED`; all other current statuses are excluded. Revenue uses `Order.grandTotal`; product/category analytics use immutable OrderItem snapshots.
- Aggregate responses expose no customer PII and no mutation route exists.
- ISBN là field nullable của ProductVariant và unique khi có giá trị; slug không được tái sử dụng sau soft delete.
## M5E Phase 4 Inventory Adjustment Contract

- `GET /admin/inventory/variants/:variantId` requires `PRODUCT_READ`; returns current `onHandQuantity`, `reservedQuantity`, calculated `availableQuantity`, and newest immutable ledger entries.
- `POST /admin/inventory/adjustments` requires `PRODUCT_MANAGE`; command body is `{variantId,type,quantity,reason,expectedOnHandQuantity?}`.
- Adjustment `type` is one of `RECEIVE_STOCK`, `MANUAL_INCREASE`, `MANUAL_DECREASE`, `CORRECTION`.
- Quantity must be a positive integer. Reason is required, trimmed, and max 500 chars.
- The API never accepts direct stock overwrite or `availableQuantity` edits. It updates `Inventory.onHandQuantity` and appends `InventoryLedger` in one transaction.
- `expectedOnHandQuantity` is the admin-screen optimistic concurrency guard. A stale value returns `INVENTORY_ADJUSTMENT_CONFLICT`.
- Adjustment rejects negative stock and stock below `reservedQuantity`. `reservedQuantity` is read-only in this module; checkout/order workflows remain the source of reserved/consumed stock semantics.
- No Supplier/receipt document module exists yet. Receiving stock is represented as `RECEIVE_STOCK` with an auditable reason.
