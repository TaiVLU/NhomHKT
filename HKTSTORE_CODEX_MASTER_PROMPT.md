# MASTER PROMPT CHO CODEX — DỰ ÁN THƯƠNG MẠI ĐIỆN TỬ HKTSTORE

## 0. Vai trò của Codex

Bạn là kỹ sư phần mềm full-stack senior, kiến trúc sư hệ thống và người hướng dẫn đồ án. Hãy cùng tôi xây dựng một website thương mại điện tử bán sách tên **HKTStore**.

Không được xây toàn bộ dự án một cách vội vàng trong một lần. Trước mỗi giai đoạn:

1. Đọc toàn bộ tài liệu yêu cầu.
2. Kiểm tra mã nguồn hiện tại.
3. Lập kế hoạch ngắn cho giai đoạn.
4. Chỉ sửa đúng phạm vi của giai đoạn.
5. Chạy lint, type-check, test và build.
6. Báo cáo file đã tạo/sửa, lệnh đã chạy, kết quả và việc còn lại.
7. Không tự ý đổi stack công nghệ hoặc nghiệp vụ đã chốt.
8. Không hard-code dữ liệu nghiệp vụ nếu dữ liệu đó phải lấy từ API hoặc SQL Server.
9. Không tin dữ liệu giá, tồn kho, quyền hạn hoặc tổng tiền do frontend gửi lên.
10. Ưu tiên code rõ ràng, dễ trình bày trong đồ án hơn là kiến trúc quá phức tạp.

Nếu có điểm chưa rõ, hãy ghi rõ giả định trước khi code. Chỉ hỏi lại khi quyết định đó ảnh hưởng lớn đến database hoặc luồng nghiệp vụ.

---

# 1. Tổng quan dự án

## 1.1. Tên và định vị thương hiệu

- Tên website: **HKTStore** (hoặc **HKT Store**)
- Định vị: Thế giới Manga & Sách kỹ năng sống, tư duy thực chiến.
- Slogan chính: **HKT Store — Thế giới Manga & Kho tàng kỹ năng thực chiến.**
- Slogan chiến dịch: **Nâng tầm tri thức, bứt phá tương lai cùng HKT Store!**
- Thông điệp cảm xúc: **Đọc trọn đam mê, tích lũy kỹ năng mỗi ngày.**
- Phong cách: Hiện đại, thanh lịch, nền nhẹ nhàng, bố cục thoáng đãng và trải nghiệm mua sắm nhanh gọn.
- Tham khảo:
  - Fahasa: menu danh mục, tìm kiếm, tài khoản, giỏ hàng.
  - Nhà Xinh: bố cục thoáng, hình ảnh lớn, khoảng trắng và cảm giác cao cấp.

## 1.2. Phạm vi đồ án

Đây là đồ án môn Chuyên đề Thương mại điện tử, quy mô vừa phải nhưng phải hoàn chỉnh:

- Chỉ bán sách giấy và truyện tranh trong phiên bản đầu.
- Khoảng 6 thể loại.
- Mỗi thể loại khoảng 3–4 cuốn.
- Tổng khoảng 18–24 sản phẩm.
- Có đủ khu vực khách hàng, quản trị viên và nhân viên.
- Có dữ liệu thật lưu trong SQL Server.
- Có deploy public.
- Có responsive desktop, tablet và mobile.
- Có SEO cơ bản đến khá.
- Có chatbot FAQ theo kịch bản, không sử dụng API AI trả phí.

## 1.3. Sáu thể loại ban đầu

1. Manga - Comic (Shonen, Isekai, Trinh thám...)
2. Phát triển kỹ năng sống
3. Tư duy phản biện & Quản trị thời gian
4. Công nghệ thông tin & Lập trình
5. Kinh tế & Khởi nghiệp
6. Ngoại ngữ

Một cuốn sách có thể thuộc nhiều thể loại.

---

# 2. Công nghệ bắt buộc

## 2.1. Frontend

- Next.js bản ổn định
- App Router
- TypeScript strict
- Tailwind CSS
- React Hook Form
- Zod
- Zustand cho trạng thái client cần thiết
- TanStack Query cho server state nếu phù hợp
- Axios hoặc fetch wrapper thống nhất
- Lucide React cho icon
- Toast notification
- Recharts hoặc thư viện biểu đồ tương đương cho admin
- Không dùng `any` tùy tiện
- Không đặt secret ở frontend

## 2.2. Backend

- Node.js
- Express.js
- TypeScript strict
- REST API
- SQL Server
- Prisma ORM
- Zod cho validation
- JWT access token và refresh token
- bcrypt hoặc Argon2 để hash mật khẩu
- Nodemailer/SMTP hoặc dịch vụ email phù hợp cho OTP quên mật khẩu
- Helmet
- CORS theo allowlist
- Rate limiting
- Logger
- Swagger/OpenAPI
- Multer chỉ khi cần nhận file; ảnh sản phẩm nên lưu ở Cloudinary hoặc thư mục public phù hợp, database chỉ lưu URL

## 2.3. Repository

Dùng một monorepo để quản lý tập trung:

```text
hktstore/
├── apps/
│   ├── web/               # Next.js App Router
│   └── api/               # Express TypeScript API
├── packages/
│   ├── shared/            # Type/schema dùng chung
│   └── config/
├── database/
│   ├── scripts/
│   └── seed/
├── docs/
├── .env.example
├── README.md
└── package.json