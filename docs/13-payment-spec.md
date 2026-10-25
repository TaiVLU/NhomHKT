# Payment Specification

## COD

- Không cần xác nhận tiền trước.
- Đơn vào Chờ xác nhận.
- Khi giao thành công mới ghi nhận thực thu.

## Chuyển khoản

Hiển thị:
- ngân hàng;
- số tài khoản;
- chủ tài khoản;
- số tiền;
- nội dung chuyển khoản.

## QR

- Admin tải ảnh QR.
- QR là ảnh tĩnh.
- Hiển thị cùng số tiền và nội dung.

## Xác nhận

- Staff/Admin xác nhận thủ công.
- Không yêu cầu khách upload biên lai.
- Ghi payment transaction và audit log.
- Một Order có thể có nhiều payment attempt nhưng chỉ một Payment `CONFIRMED` tại một thời điểm.
- Phiên bản đầu hoàn tiền thủ công, chưa tích hợp cổng hoàn tiền tự động.
- Return có thể partial/full nhưng mỗi ReturnRequest tối đa một refund transaction. Refund amount bằng tổng `refundAmount` của ReturnItem được duyệt; partial return không hoàn toàn bộ Order và không chia một khoản hoàn thành nhiều giao dịch.
- Staff chỉ refund ReturnRequest đã APPROVED, đã nhận và kiểm tra. Admin xử lý ngoại lệ ngoài return flow khi có `reason` và audit log.

## Hết hạn

- 15 phút.
- Job định kỳ tìm đơn quá hạn.
- Hủy idempotent.
- Giải phóng reservation.
- Không dùng `setTimeout` trong memory làm cơ chế chính.

## Ghi nhận

- Bank/QR được coi là tiền đã thu khi Staff/Admin xác nhận, nhưng doanh thu bán hàng chỉ ghi nhận khi Order `DELIVERED`.
- COD ghi nhận thực thu khi `DELIVERED`.
- Return hoàn tất làm giảm doanh thu theo ngày hoàn tiền hoặc ngày hoàn tất return được lưu trong giao dịch.
