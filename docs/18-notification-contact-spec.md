# Notification and Contact

## Notification

Loại:
- ORDER
- PAYMENT
- INVENTORY
- CONTACT
- RETURN
- SYSTEM
- CHATBOT

Có:
- title;
- message;
- target user;
- link;
- readAt;
- createdAt.

## Contact

Customer/guest gửi:
- họ tên;
- email;
- phone;
- subject;
- message.

Trạng thái:
- NEW
- PROCESSING
- CONTACTED
- COMPLETED

Staff/Admin:
- xem;
- ghi chú nội bộ;
- phản hồi;
- lưu lịch sử phản hồi.

Phiên bản đầu chỉ lưu phản hồi trong database, không gửi email. Customer đăng nhập xem phản hồi qua notification hoặc khu vực tài khoản. Email thật vẫn được dùng riêng cho OTP quên mật khẩu.
