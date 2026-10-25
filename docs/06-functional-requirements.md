# Functional Requirements

## Auth

- Đăng ký bằng username, họ tên, email, điện thoại, mật khẩu.
- Đăng nhập Customer bằng username.
- Staff/Admin đăng nhập tại `/admin/login`.
- Quên mật khẩu bằng OTP email.
- Refresh token và logout.
- Khóa/mở khóa tài khoản.
- Customer không được tự xóa tài khoản.

## Catalog

- Nhiều thể loại cho một sách.
- Nhiều tác giả nếu cần.
- Nhiều biến thể.
- Tìm kiếm, autocomplete, từ khóa hot, lịch sử tìm kiếm.
- Filter và sort.
- Sản phẩm liên quan.

## Commerce

- Wishlist.
- Giỏ local và đồng bộ sau đăng nhập.
- Checkout một trang.
- Checkout hỗ trợ `CART` từ server cart và `BUY_NOW` cho đúng một biến thể/số lượng.
- Phí ship cố định 30.000đ, miễn phí từ 300.000đ.
- COD, chuyển khoản, QR.
- Đơn chuyển khoản hết hạn sau 15 phút.
- Theo dõi đơn.
- Hủy và trả hàng.

## Content

- Review Ro Sách.
- Ro-mance.
- Banner.
- FAQ chatbot.
- Không có bình luận bài viết.

## Admin

- Dashboard.
- CRUD nghiệp vụ.
- Kho.
- Đơn.
- Thanh toán.
- Liên hệ.
- Báo cáo.
- Audit log.
- Upload ảnh theo purpose: Staff chỉ ảnh Article; Admin ảnh Article/Product/Banner/QR/hệ thống.
