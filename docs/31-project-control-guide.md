# RoSach Project Control Guide

## Chạy local

1. Cài dependency tại root: `npm ci`.
2. Copy `apps/api/.env.example` thành `apps/api/.env`, điền cấu hình local thật nhưng không commit file này.
3. Generate Prisma và áp migration: `npm run prisma:generate`, sau đó chạy `npx prisma migrate deploy` trong `apps/api`.
4. Chạy cả Web và API: `npm run dev`. Có thể chạy riêng bằng `npm run dev:web` và `npm run dev:api`.

- Web: `http://127.0.0.1:3000`
- API health: `http://localhost:4000/api/v1/health`
- API docs: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- API diagnostics: `http://localhost:4000/api/v1/diagnostics` (Bearer Admin có `API_DIAGNOSTICS`)
- Public catalog: `http://127.0.0.1:3000/san-pham`

Health chỉ đạt `200` khi environment hợp lệ và SQL Server kết nối được.

`/docs` là trang tài liệu đọc-only; không tự gọi mutation. OpenAPI mô tả BIGINT ID là JSON string. `/api/v1/diagnostics` là Admin-only, chỉ trả component status, module registration, version, timestamp và uptime; không bao giờ trả connection string, secret, token, session, stack trace hay filesystem path.

## Route theo role

| Role | Route chính |
|---|---|
| Guest | `/`, `/san-pham`, `/san-pham/:slug`, `/khuyen-mai`, `/dang-nhap`, `/dang-ky` |
| Customer | Các route public và `/tai-khoan`, `/tai-khoan/ho-so`, `/tai-khoan/dia-chi`, `/tai-khoan/doi-mat-khau` |
| Staff | `/admin/login`, `/admin/catalog`, `/admin/catalog/:id` ở chế độ chỉ đọc |
| Admin | `/admin/login`, `/admin/catalog`, `/admin/catalog/:id` với quyền quản lý Catalog |

Customer đăng ký tại `/dang-ky`. Admin/Staff đăng nhập tại `/admin/login`; Customer không dùng endpoint quản trị.

## Tạo Admin và Staff local

- Initial Admin: cấu hình đủ năm biến `INITIAL_ADMIN_*` trong `apps/api/.env`, rồi chạy `npm run auth:seed -w @rosach/api`. Seed idempotent và không tự chạy khi production startup.
- Demo Admin/Staff cho development/test: đặt đủ `M3_DEMO_ADMIN_USERNAME`, `M3_DEMO_ADMIN_EMAIL`, `M3_DEMO_ADMIN_PASSWORD`, `M3_DEMO_STAFF_USERNAME`, `M3_DEMO_STAFF_EMAIL`, `M3_DEMO_STAFF_PASSWORD`, rồi chạy `npm run catalog:seed-demo-users -w @rosach/api`. Email phải hợp lệ và khác nhau; mật khẩu phải theo password policy hiện hành. Form `/admin/login` dùng email, còn API contract vẫn chấp nhận email hoặc username. Không dùng demo credential trong production.
- Giá trị email local đã duyệt: `admin.rosach@gmail.com` và `staff.rosach@gmail.com`. Mật khẩu chỉ đặt trong `apps/api/.env` không được Git theo dõi; không ghi mật khẩu thật vào tài liệu.

## Environment local

API cần tối thiểu `NODE_ENV`, `API_HOST`, `API_PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `OTP_PEPPER`, `MAIL_MODE`, `SMTP_FROM`. Local production-like dùng `WEB_ORIGIN=http://127.0.0.1:3000`; Web dùng full base `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/api/v1`. Không trộn `localhost` và `127.0.0.1` trong một session vì refresh cookie `SameSite=Lax` phụ thuộc same-site host.

`PRODUCT_IMAGE_ADAPTER=fake` dùng adapter ảnh in-memory cho automated/local smoke, không cần Cloudinary credential và không upload ảnh thật. Dùng `cloudinary` chỉ khi đã cấu hình đầy đủ `CLOUDINARY_*`; không commit credential.

## Manual checklist M2–M4.3

1. Health trả HTTP 200, `api/environment/database` đều up/valid.
2. Homepage có header, hero, sách nổi bật, sách mới, danh mục và footer.
3. Guest thấy Đăng nhập/Đăng ký, không thấy khu vực Admin/Staff.
4. Catalog list/search/sort/pagination hoạt động.
5. Product detail hoạt động; ảnh null/rỗng/fake/lỗi dùng placeholder.
6. Register kiểm tra password policy và confirm password.
7. Register hiển thị conflict username/email/phone và rate limit đúng.
8. Customer login sai báo lỗi rõ; login đúng về `/tai-khoan` hoặc returnUrl.
9. Header Customer hiển thị Tài khoản và Đăng xuất.
10. Refresh trang vẫn bootstrap session bằng refresh cookie.
11. Xem/cập nhật profile; email read-only.
12. Tạo Address đầu tiên và kiểm tra auto-default.
13. Tạo Address thứ hai, đổi default, sửa và soft-delete.
14. Cross-owner Address trả 404.
15. Đổi mật khẩu; mật khẩu cũ thất bại, mật khẩu mới thành công.
16. Logout xóa phiên frontend và refresh session hiện tại.
17. Forgot/OTP/reset password hoạt động với mail adapter phù hợp.
18. Admin login về `/admin/dashboard`, thấy Operations Center; Catalog vẫn có mutation controls và cost price.
19. Staff login về `/admin/dashboard`, thấy nhãn chỉ đọc; Catalog/Inventory/Orders/Reporting không có Admin-only mutation hoặc cost/margin data.
20. Customer truy cập Admin API/UI bị chặn.
21. Admin Catalog CRUD và Product image fake-adapter smoke không regression.
22. Chạy `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`, `npm run format:check`.
23. Mở `/docs`, kiểm tra OpenAPI JSON có Health/Auth/Account/Address/Catalog/Admin/Staff/Upload và Bearer security scheme; không có secret hay token mẫu.
24. Gọi health public; gọi diagnostics không token phải 401, Staff phải 403 và Admin phải nhận status an toàn không lộ cấu hình.
25. Kiểm tra typography system trên Homepage, Catalog, Promotion, Auth, Account, Admin và Staff; smoke desktop/mobile theo `docs/32-frontend-quality-baseline.md`.

## Trạng thái tính năng

Đã có: scaffold/health, Auth & RBAC, password reset, public và Admin/Staff Catalog, Product images, Customer Profile/Password/Address, website shell, Order/Inventory operations và M7.4E Admin Operations and Revenue Center.

Chưa có: Wishlist, Cart, Checkout, Order, Payment, Inventory commerce flow, Promotion nghiệp vụ, Dashboard/reporting, Review/CMS. Route `/khuyen-mai` hiện chỉ là thông báo, không có Promotion schema hay logic.
