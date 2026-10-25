# Role Permission Matrix

| Chức năng | Customer | Staff | Admin |
|---|---:|---:|---:|
| Xem catalog | ✓ | ✓ | ✓ |
| Quản lý hồ sơ cá nhân | ✓ | ✓ | ✓ |
| Mua hàng | ✓ | — | — |
| Xem đơn của chính mình | ✓ | — | — |
| Review đã mua | ✓ | — | — |
| Truy cập `/admin` | — | ✓ | ✓ |
| Xem dashboard cơ bản | — | ✓ | ✓ |
| Xem báo cáo đầy đủ | — | Giới hạn | ✓ |
| Xử lý đơn | — | ✓ | ✓ |
| Xác nhận thanh toán | — | ✓ | ✓ |
| Cập nhật tồn kho | — | ✓ | ✓ |
| CRUD sản phẩm | — | Chỉ xem | ✓ |
| Quản lý bài viết | — | ✓ | ✓ |
| Upload ảnh Article | — | ✓ | ✓ |
| Upload ảnh Product/Banner/QR/hệ thống | — | — | ✓ |
| Quản lý FAQ | — | Chỉ xem | ✓ |
| Xử lý liên hệ | — | ✓ | ✓ |
| Quản lý customer | — | — | ✓ |
| Quản lý staff | — | — | ✓ |
| Cấu hình hệ thống | — | — | ✓ |
| Xem audit log | — | — | ✓ |
| Quản lý banner | — | — | ✓ |
| Quản lý câu hỏi chatbot chưa giải đáp | — | — | ✓ |
| Quản lý chi phí vận hành | — | Chỉ xem tổng hợp nếu dashboard cho phép | ✓ |

Staff chỉ xem sản phẩm, biến thể, giá và tồn kho; chỉ được thay đổi kho thông qua inventory adjustment có lý do. Staff không được tạo/sửa/xóa sản phẩm, sửa giá hoặc quản lý thể loại, tác giả, nhà xuất bản.

Staff có permission `ARTICLE_MEDIA_UPLOAD`, chỉ được upload với `uploadPurpose=ARTICLE`. Admin được upload cho ARTICLE, PRODUCT, BANNER, QR và SYSTEM.

Backend phải kiểm tra quyền tại middleware và service. Ẩn menu frontend không thay thế authorization.
