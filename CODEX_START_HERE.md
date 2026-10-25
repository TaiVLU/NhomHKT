# Chỉ dẫn đầu tiên dành cho Codex

Hãy đọc toàn bộ thư mục `docs/` theo thứ tự trong `docs/00-document-map.md`.

## Nhiệm vụ hiện tại

Chỉ thực hiện **Milestone 0 — Phân tích và thiết kế**:

1. Kiểm tra tính nhất quán giữa yêu cầu, sitemap, role matrix, business rules, ERD và API.
2. Ghi các mâu thuẫn hoặc giả định vào `docs/30-open-questions-and-decisions.md`.
3. Hoàn thiện ERD ở mức triển khai.
4. Hoàn thiện database dictionary.
5. Hoàn thiện API contract draft.
6. Đề xuất cấu trúc monorepo.
7. Không scaffold ứng dụng và không tạo migration trước khi được duyệt.

## Nguyên tắc bắt buộc

- Không viết toàn bộ dự án trong một lần.
- Không bỏ qua backend authorization.
- Không tin giá, tổng tiền, tồn kho hoặc role từ frontend.
- Không dùng `any` tùy tiện.
- Không hard-code dữ liệu có thể cấu hình.
- Không tắt ESLint/TypeScript để che lỗi.
- Không tuyên bố hoàn thành khi chưa chạy kiểm tra.

## Mẫu báo cáo

```text
## Đã hoàn thành
- ...

## File đã tạo/sửa
- ...

## Kiểm tra tính nhất quán
- ...

## Giả định và quyết định cần duyệt
- ...

## Việc tiếp theo
- ...
```

Sau khi hoàn thành Milestone 0, hãy dừng lại để tôi duyệt.
