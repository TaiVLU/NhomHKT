# Milestone 3 — Product Catalog Implementation Plan

## Trạng thái

Kế hoạch tài liệu đã được duyệt theo M3-D01 đến M3-D16. Chưa được triển khai source code, Prisma schema, migration hoặc dependency cho đến khi chủ dự án duyệt lần cuối.

## Phạm vi

M3 gồm Category, Author, Publisher, Product, ProductVariant, ProductImage, ProductCategory, ProductAuthor, SlugReservation; public catalog; search/filter/sort/pagination; tối đa 5 product search suggestions; Admin catalog API/UI; Staff catalog read-only; Cloudinary Product image; validation, lifecycle và test.

M3 không gồm Cart, Wishlist, Inventory, Order, Payment, Review, RelatedProduct, HotKeyword, SearchHistory server-side, Dashboard, Analytics, CMS Article, Banner hoặc Promotion/Voucher.

## Mô hình và migration dự kiến

- PK/FK dùng BIGINT; ID qua JSON là string.
- Product có `deletedAt`; Author và Publisher bổ sung `isActive` và `deletedAt`; Category giữ lifecycle tương tự.
- ProductVariant có SKU immutable, ISBN nullable, pricing và `isActive`; không hard-delete variant.
- ProductCategory và ProductAuthor dùng composite key; relation IDs phải unique, tồn tại và chưa soft-delete; cập nhật relation trong transaction.
- ProductImage có phạm vi Product hoặc ProductVariant cùng Product. Mỗi Product có tối đa một primary image chung và mỗi variant tối đa một primary image riêng.
- SlugReservation giữ vĩnh viễn mọi slug đã dùng cho PRODUCT/CATEGORY/AUTHOR/PUBLISHER.
- Migration M3 phải tạo FK, check constraint, reverse indexes, filtered unique ISBN và filtered unique primary-image indexes. Constraint database là lớp bảo vệ cuối cho slug, SKU, ISBN và primary image.

Không tạo Inventory, HotKeyword hay bất kỳ bảng ngoài phạm vi. SQL Server-specific index/check chưa biểu đạt được bằng Prisma phải được thêm bằng migration SQL có kiểm thử.

## Visibility và lifecycle

Product chỉ public khi active, chưa soft-delete và có ít nhất một variant active. Deactivate variant cuối được phép, không đổi `Product.isActive`; Product tự ẩn/hiện lại theo public query.

Publisher nullable kể cả Product active. Publisher/Author/Category inactive hoặc deleted không xuất hiện trong public taxonomy/relation DTO nhưng không làm Product biến mất. Nếu có publisherId thì Publisher phải tồn tại và chưa soft-delete.

Product chỉ soft-delete, không hard-delete; không xóa variant, relation, slug reservation hay Cloudinary asset. Restore Product không thuộc M3. Author/Publisher/Category đã được Product tham chiếu không hard-delete.

## Giá, SKU và ISBN

- `costPrice >= 0`, `listPrice > 0`, `salePrice > 0`, `salePrice <= listPrice`; không giảm giá thì hai giá bán bằng nhau.
- Public và Staff không nhận `costPrice`; chỉ Admin có PRODUCT_MANAGE được xem/sửa costPrice.
- Tiền VND qua JSON là integer-valued number trong phạm vi JavaScript safe integer; tính toán backend không dùng floating point. ID BIGINT vẫn là string.
- Public min/max, search, filter và sort giá chỉ dùng variant active. Product khớp khoảng giá khi ít nhất một active variant có salePrice trong khoảng.
- SKU bắt buộc, trim, uppercase, chỉ `A-Z`, `0-9`, `-`, `_`, unique toàn hệ thống, immutable và không tái sử dụng. Sửa SKU bằng variant mới và deactivate variant cũ.
- ISBN hỗ trợ ISBN-10/ISBN-13, nullable, chỉ ở variant, canonical sau khi bỏ hyphen/whitespace; ISBN-10 cho phép X cuối; phải qua checksum; filtered unique khi khác NULL.

## Slug

Slug lowercase/canonical, được cấp trong transaction cùng SlugReservation. Đổi slug giữ reservation cũ; slug cũ trả 404 trong M3; không redirect table và không tái sử dụng sau soft-delete. Unique conflict phải map sang error ổn định, không chỉ dựa vào check-then-insert.

## API

Public:

- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/products/search-suggestions?q=...` — tối đa 5 Product, không HotKeyword.
- `GET /api/v1/categories`
- `GET /api/v1/authors`
- `GET /api/v1/publishers`

Listing hỗ trợ q, category, author, publisher, isNew, isFeatured, minPrice, maxPrice, sort, page và pageSize. Search theo Product, Author, Category, Publisher và normalized ISBN; dùng SQL Server case-insensitive/accent-insensitive collation, parameterized query, whitelist sort và tie-breaker Product ID.

Admin/Staff:

- Staff/Admin có PRODUCT_READ cho GET catalog.
- Chỉ Admin có PRODUCT_MANAGE cho create/update/activate/deactivate/soft-delete, variant, relation và image mutation.
- Staff DTO không có costPrice; Staff không upload Product image.
- `POST /api/v1/admin/uploads/images` bắt buộc `uploadPurpose=PRODUCT` và Admin.

Public DTO không có costPrice hoặc inventory availability. API không trả availableQuantity, stock status, inStock, reserved quantity hay thông báo tồn kho trong M3.

## Backend structure

Module catalog tách route/controller/schema/service/repository/mapper cho Product, Variant, Category, Author, Publisher, Image, Slug và Search. Controller xử lý HTTP; Zod strict parse/normalize; service giữ business rule/permission/transaction; repository cô lập Prisma/SQL; mapper tách Public/Staff/Admin DTO và serialize BIGINT ID.

Cloudinary nằm sau adapter hỗ trợ fake test. Backend kiểm soát Product namespace; không nhận URL/publicId tùy ý. File phải qua magic bytes/MIME thực, extension và giới hạn 5 MB; chỉ JPEG/PNG/WebP.

## Cloudinary lifecycle

Upload thành công nhưng attach DB thất bại thì xóa asset best-effort; thất bại cleanup phải structured log/audit không chứa secret. DB mutation thành công nhưng Cloudinary delete thất bại không rollback DB; ghi publicId đã lọc + requestId và hỗ trợ manual cleanup command. Không scheduler, upload-temp table hoặc cleanup job định kỳ trong M3. Deactivate không xóa asset.

## Markdown

Product `description` lưu Markdown source; `shortDescription` và SEO description là plain text. Web dùng safe Markdown renderer, vô hiệu hóa/sanitize embedded HTML, script, event handler và URL scheme nguy hiểm. M3 chỉ cần textarea/Markdown editor cơ bản.

## Test bắt buộc

- Unit: pricing, SKU, ISBN checksum, slug, search normalization, DTO separation, BIGINT serialization và image validation.
- Integration: CRUD/lifecycle/relation transaction, public visibility, search tiếng Việt có/không dấu, active-variant price, upload adapter failure và permission.
- Concurrency: slug/SKU/ISBN/primary-image conflict dựa trên SQL Server constraints.
- Permission/security: Customer bị chặn admin; Staff read-only, không costPrice và không Product upload; Admin mutate; reject unknown fields, injection/raw sort, forged MIME/publicId và cross-product variant image.
- Web: public listing/detail/search/filter/sort/pagination, Admin CRUD, Staff read-only, Markdown an toàn, image fallback và không hiển thị tồn kho giả.
- Mỗi verification chạy Prisma generate, lint, type-check, test và build.

## Trình tự triển khai sau phê duyệt

1. Prisma models và migration SQL Server catalog.
2. Shared schemas/DTO/error mapping.
3. Taxonomy, slug reservation và Product aggregate repositories/services.
4. Variant pricing/SKU/ISBN.
5. Admin/Staff API và RBAC.
6. Public API và search.
7. Cloudinary adapter, image lifecycle và manual cleanup command.
8. Public web và Admin/Staff catalog UI.
9. Unit/integration/concurrency/security/web tests.
10. Full verification và cập nhật tài liệu bàn giao.

## Acceptance criteria

M3 chỉ hoàn thành khi SQL Server constraints và migration được kiểm thử; public visibility/DTO đúng; Admin CRUD và Staff read-only đúng quyền; search/filter/sort/pagination ổn định; slug/SKU/ISBN không tái sử dụng hoặc xung đột; image lifecycle an toàn; không có Inventory/HotKeyword/feature ngoài phạm vi; và toàn bộ generate/lint/type-check/test/build pass.
