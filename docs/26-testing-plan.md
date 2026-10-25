# Testing Plan

## Unit

- validation auth;
- bcrypt policy/cost và giới hạn 72 UTF-8 bytes;
- JWT HS256 claims/TTL và refresh token family rotation;
- normalization username/email/phone E.164;
- shipping fee;
- order transition;
- report formulas;
- BIGINT ID serialization thành JSON string;
- refund amount từ approved ReturnItem;
- FAQ matching;
- review moderation.
- catalog slug/SKU/ISBN normalization, checksum, immutability và conflict mapping;
- catalog price invariants, active-variant min/max và Public/Staff/Admin DTO separation;
- Product Markdown safety và Product image validation.
- M4 profile/address schema, birthday tương lai, safe profile DTO, password policy và Address mapper.

## Integration

- register/login/refresh;
- concurrent refresh chỉ một request thắng, reuse revoke family, giới hạn 5 session family;
- OTP expiry;
- OTP attempts/cooldown/single-use và reset-token consume atomic;
- Origin/Referer + custom-header CSRF checks và auth rate limits;
- initial Admin seed idempotency/conflict;
- cart merge;
- create order;
- stock reservation;
- payment expiry;
- cancellation;
- checkout CART và BUY_NOW với idempotency;
- partial/full return chỉ một refund transaction;
- uploadPurpose permission cho Staff/Admin;
- review verified purchase;
- admin permission.
- catalog CRUD/lifecycle/relation transaction và public visibility;
- search tiếng Việt có dấu/không dấu, filter/sort/pagination stable;
- concurrent slug/SKU/ISBN/primary-image conflicts trên SQL Server;
- Product uploadPurpose, magic bytes, namespace, cross-product image scope và Cloudinary cleanup failure;
- Staff catalog read-only, không costPrice/mutation/Product upload; Admin catalog manage.
- M4 GET/PATCH profile, phone conflict, Address CRUD/soft-delete/default promotion, password cũ/mới, auth/permission/ownership và hai request set-default đồng thời trên SQL Server.

## Web M4

- Profile render/submit với email read-only; Address create/edit/delete/set-default; đổi mật khẩu success/error; account route chặn người chưa đăng nhập.
- Manual smoke chạy API/Web/SQL Server thật và kiểm tra không regression public catalog, Admin catalog, Staff read-only của M3.

## E2E

1. Đăng ký và đăng nhập.
2. Tìm sản phẩm.
3. Thêm biến thể vào giỏ.
4. Checkout COD.
5. Staff xử lý đơn.
6. Customer theo dõi.
7. Review sau giao.
8. Customer vào `/admin` nhận 403.
9. Hai khách tranh sản phẩm cuối cùng.

## Checklist mỗi milestone

- lint
- type-check
- unit test
- integration test liên quan
- production build
- responsive check
- accessibility cơ bản
