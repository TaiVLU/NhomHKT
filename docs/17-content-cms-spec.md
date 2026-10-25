# Content CMS

## Article

- title;
- slug;
- coverImage;
- excerpt;
- content;
- author user;
- article category;
- tags;
- related products;
- status Draft/Published/Hidden;
- publishedAt;
- SEO metadata;
- soft delete.

Nội dung lưu sanitized HTML hoặc Markdown. Phiên bản đầu ưu tiên Markdown editor/textarea đơn giản; backend bắt buộc sanitize trước khi lưu hoặc render. Slug không được tái sử dụng sau soft delete.

## Chuyên mục

- Review Ro Sách
- Ro-mance
- Tin tức nếu mở rộng

## Quyền

Staff và Admin:
- tạo;
- sửa;
- xuất bản;
- ẩn;
- xóa mềm.

Không có bình luận bài viết.

Ảnh deploy qua Cloudinary, chấp nhận JPEG/PNG/WebP tối đa 5 MB, lưu cả URL và `publicId`; phải dọn asset cũ khi thay/xóa. Upload API bắt buộc `uploadPurpose`:

- Staff có `ARTICLE_MEDIA_UPLOAD`, chỉ upload ảnh Article.
- Admin upload ảnh Article, Product, Banner, QR và ảnh hệ thống.
- Staff không được upload ảnh Product, Banner, QR hoặc hệ thống.
