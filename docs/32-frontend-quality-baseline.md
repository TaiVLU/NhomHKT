# Frontend Quality Baseline

## Design concept đã chốt

RoSach giữ phong cách editorial tối giản: nền kem/trắng ấm, đỏ rượu làm điểm nhấn, card nhẹ, button bo tròn và khoảng trắng có chủ ý. Không thay palette hoặc layout lớn chỉ để xử lý lỗi cục bộ.

## Typography

- Heading/editorial: `Georgia, "Times New Roman", serif` qua token `--font-serif`.
- Body, menu, form, button: system sans-serif qua token `--font-sans` (`ui-sans-serif`, `system-ui`, `Segoe UI`, fallback `sans-serif`).
- Không import remote font chưa dùng. System fallback hiện có hỗ trợ tiếng Việt, tránh lỗi tải font, font swap và hydration/layout shift.
- Không đặt `font-family` inline. Component dùng token; Admin/Staff ưu tiên sans-serif cho mật độ thông tin, heading chỉ dùng serif vừa phải.

## Tokens và layout

Token chuẩn nằm ở `apps/web/app/globals.css`: background/surface/text/muted/border, primary/primary-hover, error/success, radius/shadow, container và spacing. Alias cũ (`--paper`, `--line`, `--primary-dark`) chỉ giữ để tương thích CSS hiện hành, không tạo palette mới.

- Container chính: tối đa 1200px; padding ngang tối thiểu 1rem.
- Breakpoint chính: 700px; grid chuyển về một cột, header có thể cuộn ngang thay vì tràn viewport.
- Dùng component hiện hữu: `SiteChrome`, `SiteHeader`, `SiteFooter`, `ProductCard`, `ProductImage`, `AccountShell` và form Account/Auth trước khi tạo component mới.

## Quy tắc sửa cộng dồn

1. Đọc component, token và CSS hiện có; tìm nguyên nhân trước khi sửa.
2. Tái sử dụng class/token/component nếu hợp lý; không tạo CSS/component trùng chức năng.
3. Không đổi concept, palette hay viết lại trang đang hoạt động chỉ để sửa lỗi nhỏ.
4. Không thêm inline `font-family`, không thêm remote font khi system/local fallback đã đáp ứng.
5. Mỗi thay đổi frontend phải smoke Header, Homepage, Catalog, Category, Promotion, Auth, Account và Admin/Staff ở desktop/mobile khi phạm vi liên quan.

## Checklist trước merge

- Không có tiếng Việt vỡ glyph hoặc font nhảy giữa route.
- Heading không lấn át nội dung; form/body dễ đọc.
- Không tràn ngang ở mobile; focus-visible còn hoạt động.
- Lint, type-check, web tests, build, format check và `git diff --check` đều pass.
- Không regression Header/Footer, catalog, đăng nhập/đăng ký, account, Admin Catalog và Staff read-only.
