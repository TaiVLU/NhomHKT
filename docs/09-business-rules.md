# Business Rules

## User

- Username 5–15 ký tự, không đổi sau đăng ký.
- Email và phone bắt buộc, duy nhất.
- Tối đa 5 địa chỉ.
- Customer không tự xóa tài khoản.
- Tài khoản khóa không được đăng nhập.

## Product

- Một sách có thể thuộc nhiều thể loại.
- Một sách có ít nhất một biến thể.
- SKU biến thể duy nhất.
- Tồn kho không âm.
- ISBN thuộc ProductVariant, nullable và duy nhất khi có giá trị; mỗi ấn bản có thể có ISBN riêng.
- `costPrice >= 0`, `listPrice > 0`, `salePrice > 0`, `salePrice <= listPrice`.
- Không giảm giá thì `salePrice = listPrice`; không cho giá bán bằng 0.
- Sản phẩm inactive không được thêm mới vào giỏ.

## Cart

- Số lượng phải nguyên dương.
- Không vượt tồn khả dụng.
- Khi merge giỏ, gộp theo variant và giới hạn theo tồn.

## Order

- Tổng tiền do backend tính.
- Customer chỉ xem đơn của mình.
- Mỗi thay đổi trạng thái phải hợp lệ.
- Đơn đã giao không quay về đóng gói.
- Đơn hủy không tiếp tục xử lý.
- Hủy phải có lý do.
- Không tự động khóa chỉ vì hủy nhiều lần; hệ thống gắn cờ để Admin xem xét.
- Khi có yêu cầu trả hàng, Order vẫn giữ `DELIVERED`; ReturnRequest có lifecycle riêng.
- Yêu cầu trả hàng trong 7 ngày từ `deliveredAt`, được trả một phần hoặc toàn bộ, tối đa một yêu cầu mỗi đơn và bắt buộc có lý do.
- Staff/Admin duyệt; chỉ hoàn kho sau khi nhận và kiểm tra hàng.
- Phí giao ban đầu không hoàn trừ lỗi thuộc RoSach; hoàn tiền thủ công.
- Return được partial hoặc full. Mỗi ReturnRequest tối đa một refund transaction; số tiền refund bằng tổng `refundAmount` của các ReturnItem được duyệt. Partial return không hoàn toàn bộ Order và một khoản hoàn không được chia thành nhiều giao dịch.

## Payment

- COD vào Chờ xác nhận.
- Bank/QR vào Chờ thanh toán.
- Bank/QR hết hạn sau 15 phút nếu chưa xác nhận.
- Xác nhận thanh toán phải lưu người thao tác và thời gian.
- Một Order có thể có nhiều payment attempt nhưng chỉ một Payment được `CONFIRMED` tại một thời điểm.
- Staff chỉ refund qua ReturnRequest đã APPROVED, đã nhận và kiểm tra hàng. Admin có thể xử lý ngoại lệ ngoài return flow nhưng bắt buộc reason và audit log.

## Account và nội dung hệ thống

- Customer không tự xóa; Admin chỉ khóa/mở khóa, không hard delete hoặc anonymize trong phiên bản đầu; dữ liệu đơn hàng được giữ.
- Slug đã dùng không được tái sử dụng sau soft delete.
- Guest và Customer lưu search history bằng localStorage; phiên bản đầu không lưu lịch sử tìm kiếm trong database.
- Banner, FAQ, HotKeyword và UnansweredChatQuery chỉ Admin quản lý; Staff chỉ xem FAQ.

## Review

- Chỉ review sản phẩm thuộc order item đã giao.
- Mỗi order item tối đa một review.
- Nội dung vi phạm bị từ chối.
