# Use Cases

## UC-01 Đăng ký

Customer nhập đầy đủ thông tin. Hệ thống validate, kiểm tra duy nhất, hash mật khẩu và tạo tài khoản.

## UC-02 Quên mật khẩu

Customer nhập email, nhận OTP, xác minh và đặt mật khẩu mới.

## UC-03 Tìm và mua sách

Tìm kiếm → xem chi tiết → chọn biến thể → thêm giỏ → đăng nhập → đồng bộ giỏ → checkout.

## UC-04 Đặt COD

Backend tính giá và tồn kho → giữ hàng → tạo đơn Chờ xác nhận → Staff xác nhận.

## UC-05 Đặt chuyển khoản

Giữ hàng → tạo đơn Chờ thanh toán → hiển thị ngân hàng/QR → Staff xác nhận trong 15 phút hoặc hệ thống hủy.

## UC-06 Xử lý đơn

Staff chuyển trạng thái theo state machine. Mỗi thay đổi có lịch sử.

## UC-07 Hủy đơn

Customer chọn lý do khi đơn còn Chờ thanh toán hoặc Chờ xác nhận. Kho được giải phóng.

## UC-08 Review

Customer chỉ review order item đã giao. Backend kiểm duyệt nội dung.

## UC-09 Quản lý nội dung

Staff/Admin tạo bài viết, liên kết sản phẩm và xuất bản.

## UC-10 RoBot

Người dùng chọn câu hỏi hoặc nhập tự nhiên. Hệ thống dò FAQ, tìm sản phẩm hoặc tra đơn của tài khoản hiện tại.
