# Product and Catalog Specification

## Mô hình

`Product` mô tả đầu sách. `ProductVariant` mô tả phiên bản bán được.

Ví dụ:
- Bản thường
- Bìa mềm
- Bìa cứng
- Phiên bản đặc biệt

## Product

- name, slug
- mô tả ngắn/dài
- ngày phát hành
- số trang, ngôn ngữ, kích thước, trọng lượng
- publisher
- authors
- categories
- isNew, isFeatured, isActive
- SEO title/description

## Variant

- SKU
- ISBN nullable, duy nhất khi có giá trị
- variantName
- coverType
- costPrice
- listPrice
- salePrice
- Tồn kho thuộc milestone Inventory sau, không phải field ProductVariant trong M3.
- ảnh tùy chọn
- isActive

Ràng buộc giá: `costPrice >= 0`, `listPrice > 0`, `salePrice > 0`, `salePrice <= listPrice`; không giảm giá thì `salePrice = listPrice`.

## Search

Tìm theo:
- tên;
- tác giả;
- ISBN;
- thể loại;
- nhà xuất bản.

## Gợi ý

Trong M3, autocomplete trả tối đa 5 sản phẩm và không trả HotKeyword. HotKeyword được chuyển sang milestone Admin/Marketing/Analytics sau.
Lịch sử tìm kiếm localStorage cho cả guest và Customer trong phiên bản đầu. Không tạo bảng SearchHistory. Thiết kế HotKeyword lưu database và chỉ Admin quản lý được giữ cho milestone Admin/Marketing/Analytics sau, không triển khai trong M3.

## Quyết định triển khai M3

- Author và Publisher có `isActive` và `deletedAt`; public chỉ trả resource active, chưa soft-delete.
- Product chỉ public khi active, chưa soft-delete và có ít nhất một variant active. Deactivate variant cuối không tự đổi Product.isActive.
- Publisher nullable; taxonomy inactive không làm Product biến mất nhưng không xuất hiện trong public DTO.
- Public/Staff không thấy costPrice; chỉ Admin PRODUCT_MANAGE được xem/sửa.
- SKU uppercase, immutable, unique và không tái sử dụng; ISBN-10/13 nullable được normalize/checksum và unique khi có giá trị.
- Search dùng SQL Server case/accent-insensitive, parameterized, có stable Product ID tie-breaker.
- Product description dùng Markdown an toàn; short/SEO description là plain text.
- Public catalog M3 không trả bất kỳ dữ liệu tồn kho nào.
