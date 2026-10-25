# Order State Machine

## Trạng thái

| Code | Tiếng Việt |
|---|---|
| PENDING_PAYMENT | Chờ thanh toán |
| PENDING_CONFIRMATION | Chờ xác nhận |
| CONFIRMED | Đã xác nhận |
| PACKING | Đang đóng gói |
| SHIPPING | Đang giao |
| DELIVERED | Đã giao |
| CANCELLED | Đã hủy |

## Chuyển trạng thái chính

```text
PENDING_PAYMENT -> PENDING_CONFIRMATION
PENDING_CONFIRMATION -> CONFIRMED
CONFIRMED -> PACKING
PACKING -> SHIPPING
SHIPPING -> DELIVERED
```

Hủy được từ:
- PENDING_PAYMENT
- PENDING_CONFIRMATION

## Return lifecycle độc lập

Order vẫn giữ `DELIVERED` khi phát sinh yêu cầu trả hàng. ReturnRequest có state machine riêng:

```text
REQUESTED -> APPROVED -> COMPLETED
REQUESTED -> REJECTED
```

- Mỗi Order tối đa một ReturnRequest, có nhiều ReturnItem và cho phép trả một phần/toàn bộ.
- Request phải được tạo trong 7 ngày từ `deliveredAt` và bắt buộc có lý do.
- Staff/Admin approve hoặc reject. `COMPLETED` chỉ sau khi nhận, kiểm tra hàng và hoàn tiền thủ công theo policy.

## Lịch sử

Mỗi transition lưu:
- orderId;
- fromStatus;
- toStatus;
- actor;
- note;
- timestamp.
