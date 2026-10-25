# Analytics and Reporting

## Chỉ số

- Doanh thu dự kiến: đơn đã xác nhận.
- Tiền đã thu: Bank/QR đã được Staff/Admin xác nhận.
- Doanh thu thực thu: đơn `DELIVERED`; COD ghi nhận tại `DELIVERED`, Bank/QR dù xác nhận trước cũng chỉ ghi nhận doanh thu bán hàng tại `DELIVERED`.
- Giá vốn hàng bán.
- Chi phí vận hành đơn giản.
- Lợi nhuận.
- Đơn theo trạng thái.
- Top sách.
- Top thể loại.
- Phương thức thanh toán.
- Khách hàng mới.
- Tồn kho thấp.

## Bộ lọc

- Hôm nay
- Tuần này
- Tháng này
- Năm nay
- Khoảng ngày

## Công thức

```text
netRevenue = productRevenue + shippingRevenue - refundAmount - discountAmount
profit = netRevenue - costOfGoodsSold - operatingCost
```

Cần ghi rõ thời điểm ghi nhận và cách xử lý đơn hoàn.

Dashboard chính dùng doanh thu thực thu. Return hoàn tất trừ đúng số tiền refund bằng tổng `refundAmount` của ReturnItem được duyệt, theo ngày hoàn tiền hoặc ngày hoàn tất return. Partial return không đảo toàn bộ doanh thu Order. Phí giao ban đầu không hoàn trừ khi lỗi thuộc RoSach.

`OperatingCost` được nhập từng khoản theo ngày, gồm đóng gói, marketing, hỗ trợ vận chuyển và chi phí khác. Chỉ Admin quản lý; Staff chỉ xem số tổng hợp nếu dashboard cho phép.

## Xuất

- CSV bắt buộc.
- XLSX nếu thư viện và thời gian cho phép.

## M7.4E executable reporting policy

The current executable Order lifecycle uses `COMPLETED` where the original design used `DELIVERED`. Until the lifecycle is migrated explicitly, M7.4E recognizes revenue only for `COMPLETED` and excludes `PENDING_CONFIRMATION`, `CONFIRMED`, `PACKING`, `SHIPPING`, and `CANCELLED`.

Reporting uses immutable `Order.grandTotal`, which already snapshots `subtotal + shippingFee - discount`. Product/category ranking uses `OrderItem.quantity`, `lineTotal`, title/slug/category snapshots. Current catalog prices are never used for historical reporting. Timestamps are stored in UTC and grouped with inclusive `Asia/Ho_Chi_Minh` day boundaries. The current schema has no Return/Refund models, so refund adjustment is explicitly unsupported rather than estimated.
