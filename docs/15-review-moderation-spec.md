# Review and Moderation

## Điều kiện

- Đăng nhập.
- Order item thuộc customer.
- Order đã Delivered.
- Chưa review order item đó.

## Dữ liệu

- rating 1–5.
- content.
- status.
- timestamps.

Không có ảnh.

## Kiểm duyệt

- từ ngữ xúc phạm;
- link quảng cáo;
- spam lặp;
- số điện thoại/email quảng cáo nếu không phù hợp;
- backend validate lại.

Khi vi phạm:
- không lưu review công khai;
- trả thông báo lịch sự;
- không lặp lại từ xúc phạm trong UI.

Admin có thể ẩn review và ghi lý do.

Customer không được xóa tài khoản/review provenance để làm mất liên kết lịch sử OrderItem; Admin chỉ moderation nội dung review.
