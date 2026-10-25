# Inventory Specification

## Số lượng

- `onHandQuantity`: tồn vật lý.
- `reservedQuantity`: đã giữ cho đơn chưa hoàn tất.
- `availableQuantity = onHandQuantity - reservedQuantity`.

## Đặt hàng an toàn

Trong một transaction:

1. Đọc hoặc khóa inventory row.
2. Kiểm tra available >= requested.
3. Atomic update reserved.
4. Tạo order và order items.
5. Tạo stock reservation.
6. Commit.

Nếu hai người mua cuốn cuối cùng, chỉ một transaction thành công.

## Giải phóng

Khi hủy/hết hạn:
- giảm reserved;
- đóng reservation;
- ghi inventory transaction.

## Hoàn tất

Khi Order chuyển sang `SHIPPING`, trong cùng transaction:
- giảm onHand;
- giảm reserved;
- chuyển StockReservation sang `CONSUMED`;
- ghi SOLD.

Khi hủy trước `SHIPPING`, giảm reserved và chuyển reservation sang `RELEASED`.

Khi ReturnRequest đã được duyệt, hàng thực tế được nhận và kiểm tra đạt điều kiện nhập lại:
- tăng onHand;
- ghi InventoryTransaction `RETURNED`;
- không hoàn kho ngay lúc Customer tạo yêu cầu.

Phiên bản đầu không có Supplier/InventoryReceipt. Nhập kho dùng inventory adjustment với loại/lý do `RECEIPT`.

## Cảnh báo

available < 5 hoặc ngưỡng trong settings.
