# RoSach

RoSach là monorepo thương mại điện tử bán sách giấy, triển khai theo từng milestone trong `docs/29-development-roadmap.md`.

> **RoSach — Sách chuẩn, gu chất.**

## Trạng thái

Milestone 2 bổ sung Authentication & RBAC trên nền tảng M1:

- Next.js web;
- Express TypeScript API;
- SQL Server qua Prisma;
- shared API types;
- strict TypeScript, ESLint, Prettier và Vitest;
- environment validation;
- `GET /api/v1/health` kiểm tra API, environment và database;
- Customer register/login, Staff/Admin login, refresh rotation, logout và password reset;
- static RBAC middleware và initial Admin seed.

## Yêu cầu

- Node.js >= 20.9;
- npm >= 10;
- SQL Server cho database health check.

## Cài đặt

```bash
npm install
```

Sao chép `apps/api/.env.example` thành `apps/api/.env` hoặc tạo `.env` tại root khi chạy từ root, rồi thay placeholder bằng credential SQL Server thật. Không commit `.env`.

```dotenv
NODE_ENV=development
API_HOST=127.0.0.1
API_PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL="sqlserver://localhost:1433;database=rosach;user=YOUR_USER;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
```

Web public environment có mẫu tại `apps/web/.env.example`.

## Chạy development

```bash
npm run dev
```

Hoặc chạy riêng:

```bash
npm run dev:web
npm run dev:api
```

- Web: `http://localhost:3000`
- API health: `http://127.0.0.1:4000/api/v1/health`

Health trả `200/ok` khi SQL Server truy vấn được và `503/degraded` khi database không kết nối được. API không báo database khỏe giả tạo.

## Kiểm tra chất lượng

```bash
npm run lint
npm run type-check
npm run test
npm run build
npm run format:check
```

Các lệnh Prisma cơ bản:

```bash
npm run prisma:generate
```

Prisma hiện có đúng bốn model M2: User, RefreshToken, PasswordResetOtp và AuditLog. Chưa có schema commerce.

## Authentication environment

Ngoài `DATABASE_URL`, API yêu cầu `JWT_SECRET` và `OTP_PEPPER` tối thiểu 32 random bytes. SMTP có thể dùng `MAIL_MODE=fake` ở development; production dùng SMTP credentials trong `.env`. Xem `apps/api/.env.example`; không commit `.env`.

Initial Admin chỉ được tạo bằng lệnh tường minh sau khi cấu hình năm biến `INITIAL_ADMIN_*`:

```bash
npm run auth:seed -w @rosach/api
```

## Cấu trúc

```text
apps/
  web/                 Next.js App Router
  api/
    prisma/            Bốn Auth models và migration M2
    src/
      config/          environment validation
      database/        Prisma client
      middlewares/     cross-cutting middleware
      modules/health/  health route/service
      jobs/             background jobs placeholder
      shared/           API-local shared code placeholder
packages/
  config/              cấu hình workspace dùng chung
  shared/              JSON-safe shared API types
docs/                   nguồn yêu cầu và thiết kế đã duyệt
```

Luồng backend chuẩn: `Route → Middleware → Controller → Service → Repository → Prisma → SQL Server`. Health là module hạ tầng tối thiểu nên route gọi service trực tiếp; business module sau này phải tuân thủ đầy đủ các lớp đã duyệt.

## Quy ước ID

Database/backend dùng BIGINT/`bigint`; mọi ID qua JSON và shared/frontend types là string. Không chuyển ID sang JavaScript number. `orderCode` là mã nghiệp vụ riêng.
# Product image cleanup

`npm run catalog:cleanup-assets -w @rosach/api` chạy dry-run trong namespace Product. Chỉ thêm `-- --apply` sau khi đã review danh sách và cấu hình Cloudinary environment an toàn. Command không in credential.
