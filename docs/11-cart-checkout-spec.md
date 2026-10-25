# Cart and Checkout Specification

## M6.2 Cart Non-Reservation policy

Cart remains non-reserving.

Cart add/update validates current catalog and inventory availability, but it does not change `Inventory.onHandQuantity`, does not change `Inventory.reservedQuantity`, and does not append `InventoryLedger`.

Inventory is consumed only during successful checkout. Checkout consumption must update `Inventory` and append `InventoryLedger` through the Inventory Movement boundary inside the same Prisma transaction that creates the order, creates snapshots, updates idempotency state, and clears the cart.

## Guest cart

- Lưu local storage.
- Có thể thêm sản phẩm khi chưa đăng nhập.
- Khi mở giỏ hoặc checkout, yêu cầu đăng nhập.
- Sau đăng nhập, gửi dữ liệu giỏ local lên backend để merge.
- Sau merge thành công mới xóa local cart.

## Database cart

- Một cart active cho mỗi customer.
- Item xác định bằng productVariantId.
- Giá hiển thị có thể snapshot tạm nhưng checkout phải lấy lại giá mới.

## Checkout

Một trang:
- địa chỉ;
- sản phẩm;
- phí ship;
- ghi chú;
- thanh toán;
- tổng tiền;
- xác nhận.

### Checkout mode

- `CART`: backend lấy item từ server cart của Customer; client không gửi item list làm nguồn chính. Chỉ sau khi Order được tạo thành công mới xóa/cập nhật các CartItem đã checkout.
- `BUY_NOW`: client gửi đúng một `productVariantId` và `quantity`; không phụ thuộc server cart.
- Cả hai mode đều yêu cầu `Idempotency-Key`; backend lấy lại giá, kiểm tra tồn, tính phí ship và tổng tiền. Không nhận giá hoặc tổng tiền từ frontend.

Địa chỉ dùng text cho tỉnh/thành, quận/huyện, phường/xã và địa chỉ chi tiết; không tích hợp API hành chính trong phiên bản đầu. Khi đặt hàng, backend snapshot toàn bộ địa chỉ để lịch sử đơn không đổi.

## Phí ship

- 30.000đ mặc định.
- Miễn phí từ 300.000đ.
- Lưu trong SiteSettings.

## Thành công

Hiển thị mã đơn, ngày, sản phẩm, tổng tiền, phương thức và hướng dẫn.

## M5D Phase 1.5 Checkout contract

`POST /api/v1/checkout` tạo đơn từ server cart của Customer đăng nhập. Request bắt buộc có header `Idempotency-Key` và body chỉ nhận:

```json
{
  "shippingAddressId": "123",
  "paymentMethod": "COD",
  "deliveryNote": "Giao trong giờ hành chính"
}
```

- Backend luôn resolve `shippingAddressId` theo `customerId` từ JWT; cross-owner hoặc address đã xóa trả lỗi, không tin dữ liệu ownership từ client.
- Khi tạo Order, backend snapshot immutable các trường giao hàng: recipient name, phone, line1, ward, district, province, postalCode và deliveryNote. Lịch sử Order không đổi khi Address gốc bị sửa/xóa sau đó.
- Phase này chỉ hỗ trợ `paymentMethod=COD`; Order dùng `paymentStatus=UNPAID` và `orderStatus=PENDING_CONFIRMATION`. Không có external payment gateway và COD không được đánh dấu paid.
- Backend tự tính `subtotal`, `shippingFee=0`, `discount=0`, `grandTotal=subtotal + shippingFee - discount`; client không được gửi giá, tồn kho, subtotal, discount, shippingFee hoặc grandTotal.
- Idempotency key được scope theo Customer và unique ở DB. Cùng customer + key + cùng request trả lại confirmation gốc, không tạo Order/OrderItem mới, không giảm tồn lần hai và không clear cart khác. Cùng customer + key nhưng request khác trả `CHECKOUT_IDEMPOTENCY_CONFLICT`. Validation/transaction failure rollback cả idempotency record nên client có thể sửa dữ liệu rồi retry cùng key.

## M5D Phase 2 Checkout frontend

- Route `/thanh-toan` là protected customer checkout UI. Unauthenticated users follow the established login redirect with `returnUrl=/thanh-toan`.
- UI flow: select owned shipping address, keep COD selected, enter optional delivery note up to 500 characters, review cart summary, then place order.
- Client idempotency key is generated per valid checkout attempt, reused for uncertain retry with the same payload, reset when material inputs change, and cleared after success.
- Route `/thanh-toan/thanh-cong` displays the returned confirmation from temporary session storage. If refreshed without confirmation data, it shows a safe fallback and links to catalog/cart because order lookup is not implemented yet.
- Current limitation: no embedded address creation form and no order detail link until the relevant backend/UI contracts exist.
