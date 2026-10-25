# Database Dictionary — Implementation Draft

## Quy ước

- Primary key dùng `bigint identity`; foreign key dùng `bigint`. `orderCode` là mã hiển thị riêng, không dùng PK.
- Backend giữ kiểu `bigint` phù hợp; khi đi qua JSON, mọi ID được serialize thành string. Frontend/shared API types luôn dùng string và không parse ID thành JavaScript number.
- `money` = `decimal(19,0)`, VNĐ; `datetime` = UTC; chuỗi độ dài là đề xuất cho SQL Server.
- Mọi bảng mutable có `createdAt datetime2`, `updatedAt datetime2`; bảng soft-delete có `deletedAt datetime2 null`.
- `rowVersion rowversion` dùng cho `Inventory` và các aggregate có cập nhật cạnh tranh.
- Cột enum dùng `varchar` và chỉ nhận code được liệt kê. Password, OTP, token không lưu plaintext.

## Identity và customer

### User

`id bigint identity PK`; `username varchar(15) UQ` (trim/lowercase, immutable); `fullName nvarchar(120)`; `email varchar(254) UQ` (trim/lowercase); `phone varchar(20) UQ` (E.164 Việt Nam); `passwordHash varchar(255)` (bcrypt cost 12); `role varchar(20)` CUSTOMER/STAFF/ADMIN; `status varchar(20)` ACTIVE/LOCKED; `birthday date null`; `gender varchar(20) null`; `cancellationCount int default 0 check >=0`; `riskFlag bit default 0`; timestamps. Password input 8–64 ký tự, tối đa 72 UTF-8 bytes, có chữ và số. Không delete/anonymize ở phiên bản đầu.

### Address

`id bigint identity PK`; `userId bigint FK User ON DELETE NO ACTION`; `recipientName nvarchar(120)`; `phone varchar(20)`; `line1 nvarchar(255)`; `ward nvarchar(120)`; `district nvarchar(120)`; `province nvarchar(120)`; `postalCode varchar(20) null`; `isDefault bit default 0`; `createdAt datetime2`; `updatedAt datetime2`; `deletedAt datetime2 null`. Index `(userId, deletedAt, createdAt)` phục vụ danh sách active; filtered unique index `(userId) WHERE isDefault = 1 AND deletedAt IS NULL` bảo đảm tối đa một default active. M4 bản deadline không áp giới hạn 5 Address và không có restore/version. Address đầu tiên tự thành default; xóa default sẽ promote Address active cũ nhất còn lại trong transaction.

### RefreshToken

`id PK`; `userId FK`; `tokenHash char(64) UQ` (SHA-256 hex); `familyId varchar(64)`; `expiresAt datetime2`; `revokedAt datetime2 null`; `revocationReason nvarchar(255) null`; `replacedByTokenId FK self null`; `createdAt`; `lastUsedAt null`; `createdIp varchar(45) null`; `userAgent nvarchar(500) null`. Refresh opaque 256-bit, TTL 7 ngày; rotation atomic/conditional, reuse revoke family; tối đa 5 active family/User.

### PasswordResetOtp

`id PK`; `userId FK`; `otpHash char(64)` (HMAC-SHA-256 với `OTP_PEPPER`); `expiresAt`; `attemptCount int default 0`; `verifiedAt null`; `resetTokenHash char(64) null` (SHA-256 hex); `resetTokenExpiresAt null`; `consumedAt null`; `createdAt`. OTP 6 số/5 phút/5 lần sai/cooldown 60 giây; reset token opaque 256-bit/10 phút. Chỉ lưu hash, single-use và cập nhật atomic. Index `(userId, expiresAt)`.

### Cart / CartItem / WishlistItem

- `Cart`: `id PK`; `userId FK UQ`; timestamps.
- `CartItem`: `id PK`; `cartId FK`; `productVariantId FK`; `quantity int check >0`; `displayPriceSnapshot money null`; timestamps; UQ `(cartId, productVariantId)`.
- `WishlistItem`: `id PK`; `userId FK`; `productId FK`; `createdAt`; UQ `(userId, productId)`.

### Notification

`id PK`; `userId FK`; `type varchar(20)` ORDER/PAYMENT/INVENTORY/CONTACT/RETURN/SYSTEM/CHATBOT; `title nvarchar(160)`; `message nvarchar(1000)`; `link nvarchar(500) null`; `readAt null`; `createdAt`.

## Catalog

### Product

`id PK`; `name nvarchar(255)`; `slug varchar(255) UQ`; `shortDescription nvarchar(1000) null`; `description nvarchar(max) null`; `releaseDate date null`; `pageCount int null check >0`; `language nvarchar(80) null`; `dimensions nvarchar(100) null`; `weightGrams int null check >0`; `publisherId FK null`; `isNew bit`; `isFeatured bit`; `isActive bit`; `seoTitle nvarchar(70) null`; `seoDescription nvarchar(170) null`; timestamps; `deletedAt null`.

### ProductVariant

`id PK`; `productId FK`; `sku varchar(64) UQ`; `isbn varchar(20) null`; `name nvarchar(120)`; `coverType varchar(30) null`; `costPrice money check >=0`; `listPrice money check >0`; `salePrice money check >0 and salePrice <= listPrice`; `isActive bit`; timestamps. Filtered unique index `isbn IS NOT NULL`; không giảm giá thì `salePrice = listPrice`.

### Category / Author / Publisher

- `Category`: `id PK`; `name nvarchar(120)`; `slug varchar(160) UQ`; `description nvarchar(1000) null`; `isActive bit`; `sortOrder int`; timestamps; `deletedAt null`.
- `Author`: `id PK`; `name nvarchar(160)`; `slug varchar(200) UQ`; `bio nvarchar(max) null`; `isActive bit`; timestamps; `deletedAt null`.
- `Publisher`: `id PK`; `name nvarchar(160)`; `slug varchar(200) UQ`; `description nvarchar(1000) null`; `isActive bit`; timestamps; `deletedAt null`.
- `ProductCategory`: `productId FK`; `categoryId FK`; composite PK.
- `ProductAuthor`: `productId FK`; `authorId FK`; `sortOrder int default 0`; composite PK.

### Media và liên quan

- `ProductImage`: `id PK`; `productId FK`; `productVariantId FK null`; `url nvarchar(1000)`; `publicId nvarchar(255)`; `mimeType varchar(30)` JPEG/PNG/WEBP; `sizeBytes int check >0 and <=5242880`; `altText nvarchar(255)`; `sortOrder int`; `isPrimary bit`; timestamps. Cloudinary asset cũ phải được dọn khi thay/xóa.
- `RelatedProduct`: `productId FK`; `relatedProductId FK`; `sortOrder int`; composite PK; check khác nhau.
- `HotKeyword`: thuộc milestone Admin/Marketing/Analytics sau, không tạo trong M3.
- Không có bảng SearchHistory trong phiên bản đầu; guest và Customer lưu localStorage. `HotKeyword` là thiết kế cho milestone sau và không được tạo trong M3.
- `SlugReservation`: `id PK`; `resourceType varchar(40)`; `slug varchar(255)`; `resourceId bigint`; `createdAt`; UQ `(resourceType, slug)`. Không xóa bản ghi.

### Ràng buộc M3 bổ sung

- `ProductVariant.sku` trim/uppercase, chỉ `A-Z0-9-_`, immutable, unique và không tái sử dụng; variant không hard-delete.
- ISBN hỗ trợ ISBN-10/13, canonical và checksum hợp lệ; filtered unique khi khác NULL.
- Filtered unique index bảo đảm tối đa một Product primary image và một primary image cho mỗi ProductVariant.
- Product/Category/Author/Publisher chỉ soft-delete; slug reservation không xóa. Relation request không được gắn resource đã soft-delete.
- Tiền JSON là integer-valued number trong safe integer range; BIGINT ID JSON vẫn là string.

## Inventory

### Inventory

`productVariantId PK/FK`; `onHandQuantity int check >=0`; `reservedQuantity int check >=0 and <= onHandQuantity`; `lowStockThreshold int check >=0`; `rowVersion`; timestamps. `availableQuantity` được tính `onHandQuantity - reservedQuantity`, không nhận từ client.

### InventoryTransaction

`id PK`; `productVariantId FK`; `type varchar(30)` RECEIPT/ADJUSTMENT/RESERVED/RELEASED/SOLD/RETURNED; `onHandDelta int`; `reservedDelta int`; `onHandAfter int`; `reservedAfter int`; `orderId FK null`; `orderItemId FK null`; `actorUserId FK null`; `reason nvarchar(500) null`; `idempotencyKey varchar(100) null UQ`; `createdAt`. Ledger không update/delete.

### StockReservation

`id PK`; `orderId FK`; `orderItemId FK UQ`; `productVariantId FK`; `quantity int check >0`; `status varchar(20)` ACTIVE/RELEASED/CONSUMED; `reservedAt`; `releasedAt null`; `consumedAt null`; `releaseReason nvarchar(300) null`; `rowVersion`.

Không triển khai `Supplier`, `InventoryReceipt`, `InventoryReceiptItem` trong phiên bản đầu. Nhập kho dùng adjustment `RECEIPT`.

## Order, payment và return

### Order

`id PK`; `orderCode varchar(32) UQ`; `userId FK`; `status varchar(30)` theo state machine; `paymentMethod varchar(20)` COD/BANK_TRANSFER/STATIC_QR; `subtotal money`; `shippingFee money`; `discountAmount money default 0`; `totalAmount money`; `note nvarchar(1000) null`; `expiresAt null`; `confirmedAt null`; `deliveredAt null`; `cancelledAt null`; `cancellationReason nvarchar(500) null`; `rowVersion`; timestamps. Check tiền không âm và công thức tổng.

### OrderItem

`id PK`; `orderId FK`; `productId FK`; `productVariantId FK`; `productName nvarchar(255)`; `variantName nvarchar(120)`; `sku varchar(64)`; `unitPrice money`; `costPrice money`; `quantity int check >0`; `lineTotal money`; timestamps. Snapshot không đổi sau đặt hàng.

### OrderAddressSnapshot

`id PK`; `orderId FK UQ`; `recipientName`; `phone`; `line1`; `ward`; `district`; `province`; `postalCode null`; `createdAt`. Không FK Address.

### OrderStatusHistory

`id PK`; `orderId FK`; `fromStatus varchar(30) null`; `toStatus varchar(30)`; `actorUserId FK null`; `actorType varchar(20)` USER/STAFF/ADMIN/SYSTEM; `note nvarchar(500) null`; `createdAt`.

### Payment / PaymentTransaction

- `Payment`: `id PK`; `orderId FK`; `method varchar(20)`; `status varchar(20)` PENDING/CONFIRMED/FAILED/EXPIRED/REFUNDED; `amount money`; `bankReference nvarchar(120) null`; `expiresAt null`; `confirmedAt null`; `confirmedByUserId FK null`; timestamps; `rowVersion`. Cho phép nhiều attempt/order; filtered unique constraint bảo đảm tối đa một Payment CONFIRMED/order.
- `PaymentTransaction`: `id PK`; `paymentId FK`; `returnRequestId FK null`; `type varchar(20)` CONFIRM/REFUND/ADJUSTMENT; `amount money check >0`; `actorUserId FK null`; `reference nvarchar(120) null`; `reason nvarchar(500) null`; `isExceptional bit default 0`; `idempotencyKey varchar(100) UQ`; `occurredAt`; `createdAt`. Filtered unique index trên `returnRequestId IS NOT NULL` bảo đảm tối đa một refund transaction/ReturnRequest.

### ReturnRequest / ReturnItem

- `ReturnRequest`: `id PK`; `orderId FK UQ`; `userId FK`; `status varchar(20)` REQUESTED/APPROVED/REJECTED/COMPLETED; `reason nvarchar(1000)`; `requestedAt`; `reviewedAt null`; `reviewedByUserId FK null`; `reviewNote nvarchar(1000) null`; `receivedAt null`; `inspectedAt null`; `completedAt null`; `refundCompletedAt null`; `refundShippingFee bit default 0`; timestamps. Order giữ DELIVERED; deadline là `deliveredAt + 7 ngày`.
- `ReturnItem`: `id PK`; `returnRequestId FK`; `orderItemId FK`; `quantity int check >0`; `approvedQuantity int check >=0 and <= quantity`; `conditionNote nvarchar(500) null`; `refundAmount money default 0 check >=0`; UQ `(returnRequestId, orderItemId)`.

Return cho phép partial/full, một request/order. Chỉ tăng onHand sau khi nhận và kiểm tra. Refund thủ công bằng tổng refundAmount của ReturnItem được duyệt, tối đa một transaction/ReturnRequest; partial return không hoàn toàn bộ Order và không chia refund. Phí ship chỉ hoàn khi lỗi thuộc RoSach.

### Review

`id PK`; `userId FK`; `orderItemId FK UQ`; `productId FK`; `rating tinyint check 1..5`; `content nvarchar(2000)`; `status varchar(20)` PUBLISHED/HIDDEN/REJECTED; `moderationReason nvarchar(500) null`; `moderatedByUserId FK null`; `moderatedAt null`; timestamps.

## Content, support và system

- `ArticleCategory`: `id PK`; `name`; `slug UQ`; `isActive`; timestamps.
- `Article`: `id PK`; `categoryId FK`; `authorUserId FK`; `title`; `slug UQ`; `coverImageUrl`; `coverImagePublicId`; `excerpt`; `content nvarchar(max)`; `contentFormat varchar(20)` MARKDOWN/SANITIZED_HTML; `status` DRAFT/PUBLISHED/HIDDEN; `publishedAt null`; SEO fields; timestamps; `deletedAt null`.
- `Tag`: `id PK`; `name`; `slug UQ`; timestamps. `ArticleTag(articleId, tagId)` composite PK. `ArticleProduct(articleId, productId, sortOrder)` composite PK.
- `FaqCategory`: `id PK`; `name`; `slug UQ`; `sortOrder`; `isActive`; timestamps. `FaqItem`: `id PK`; `categoryId FK`; `question`; `answer`; `keywords nvarchar(1000)`; `sortOrder`; `isActive`; timestamps.
- `Banner`: `id PK`; `title`; `imageUrl`; `imagePublicId`; `targetUrl null`; `altText`; `position`; `sortOrder`; `startsAt null`; `endsAt null`; `isActive`; timestamps.
- `Contact`: `id PK`; `userId FK null`; `fullName`; `email`; `phone null`; `subject`; `message`; `status` NEW/PROCESSING/CONTACTED/COMPLETED; timestamps. `ContactReply`: `id PK`; `contactId FK`; `actorUserId FK`; `message`; `createdAt`; chỉ lưu database, không email ở v1. `ContactInternalNote`: tương tự nhưng chỉ nội bộ.
- `UnansweredChatQuery`: `id PK`; `userId FK null`; `query`; `normalizedQuery`; `createdAt`; `resolvedAt null`; `resolvedByUserId FK null`.
- `SiteSetting`: `key varchar(120) PK`; `value nvarchar(max)`; `valueType varchar(20)`; `isPublic bit`; `updatedByUserId FK`; `updatedAt`. Chứa shipping fee/threshold và cấu hình bank/QR; QR image lưu URL + publicId trong setting cấu trúc; chỉ Admin sửa.
- `OperatingCost`: `id PK`; `type varchar(30)` PACKAGING/MARKETING/SHIPPING_SUPPORT/OTHER; `name`; `amount money`; `costDate date`; `note null`; `createdByUserId FK`; timestamps. Chỉ Admin CRUD; Staff chỉ xem tổng hợp nếu dashboard cho phép.
- `AuditLog`: `id PK`; `actorUserId FK null`; `action varchar(100)`; `entityType varchar(80)`; `entityId varchar(100) null`; `metadataJson nvarchar(max) null` (đã lọc); `requestId varchar(100) null`; `ip varchar(45) null`; `createdAt`. Không tạo `beforeJson`/`afterJson` trong M2. Metadata không chứa password, OTP, access/refresh/reset token, cookie hoặc secret; retention tối thiểu 180 ngày, cleanup job ngoài M2.

## Chính sách delete

- Không cascade delete Order, OrderItem, Payment, inventory ledger, audit và review provenance.
- Product/Category/Article dùng inactive/soft delete; slug reservation và FK lịch sử được giữ. User chỉ lock/unlock, không delete.
- Join và cart item có thể cascade khi parent kỹ thuật bị xóa, nhưng thao tác nghiệp vụ vẫn qua service và audit khi cần.
