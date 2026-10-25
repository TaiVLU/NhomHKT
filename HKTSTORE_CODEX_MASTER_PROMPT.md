# MASTER PROMPT CHO CODEX — DỰ ÁN THƯƠNG MẠI ĐIỆN TỬ ROSACH

## 0. Vai trò của Codex

Bạn là kỹ sư phần mềm full-stack senior, kiến trúc sư hệ thống và người hướng dẫn đồ án. Hãy cùng tôi xây dựng một website thương mại điện tử bán sách tên **RoSach**.

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

- Tên website: **RoSach**
- Ý nghĩa: cách viết Gen Z của “Rổ Sách”.
- Slogan chính: **RoSach — Sách chuẩn, gu chất.**
- Slogan chiến dịch: **Yêu hay không yêu, đọc RoSach là rõ!**
- Thông điệp cảm xúc: **Rõ từng trang sách, sáng mọi góc tâm hồn.**
- Phong cách: hiện đại, tinh tế, nền nhẹ nhàng nhưng nội dung và cách đặt tên có chất Gen Z.
- Không sao chép nguyên giao diện Fahasa hoặc Nhà Xinh. Chỉ tham khảo:
  - Fahasa: menu danh mục, tìm kiếm, tài khoản, giỏ hàng.
  - Nhà Xinh: bố cục thoáng, hình ảnh lớn, khoảng trắng và cảm giác cao cấp.

## 1.2. Phạm vi đồ án

Đây là đồ án cuối kỳ môn Chuyên đề Thương mại điện tử, quy mô vừa phải nhưng phải hoàn chỉnh:

- Chỉ bán sách giấy trong phiên bản đầu.
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

1. Văn học
2. Kinh tế
3. Tâm lý – Kỹ năng sống
4. Công nghệ thông tin
5. Thiếu nhi
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
- Prisma ORM nếu phiên bản hiện tại hỗ trợ SQL Server đầy đủ cho schema cần thiết; nếu gặp giới hạn thực tế, dùng `mssql` với query parameterized và repository layer
- Zod cho validation
- JWT access token và refresh token
- bcrypt hoặc Argon2 để hash mật khẩu
- Nodemailer/SMTP hoặc dịch vụ email phù hợp cho OTP quên mật khẩu
- Helmet
- CORS theo allowlist
- Rate limiting
- Logger
- Swagger/OpenAPI
- Multer chỉ khi cần nhận file; ảnh sản phẩm nên lưu ở dịch vụ ảnh hoặc thư mục public phù hợp với môi trường triển khai, database chỉ lưu URL

## 2.3. Repository

Dùng một monorepo để dễ nộp bài:

```text
rosach/
├── apps/
│   ├── web/              # Next.js
│   └── api/              # Express TypeScript
├── packages/
│   ├── shared/           # type/schema dùng chung nếu cần
│   └── config/
├── database/
│   ├── scripts/
│   └── seed/
├── docs/
├── .env.example
├── README.md
└── package.json
```

Có thể dùng npm workspaces hoặc pnpm workspaces. Chọn một cách đơn giản và ghi rõ trong README.

---

# 3. Nguyên tắc nghiệp vụ quan trọng

1. Frontend không phải lớp bảo mật.
2. Backend luôn xác thực lại:
   - quyền truy cập;
   - giá hiện tại;
   - khuyến mãi;
   - tồn kho;
   - số lượng;
   - tổng tiền;
   - trạng thái đơn;
   - quyền sở hữu đơn hàng.
3. Không nhận `totalAmount`, `salePrice` hoặc quyền role từ frontend rồi lưu trực tiếp.
4. Tạo đơn và giữ hàng phải nằm trong database transaction.
5. Phải xử lý trường hợp chỉ còn 1 sản phẩm nhưng hai khách đặt cùng lúc.
6. Dùng optimistic concurrency, atomic update hoặc transaction có mức cô lập phù hợp để không bán vượt kho.
7. Các thao tác quan trọng phải có audit log.
8. Xóa dữ liệu nghiệp vụ quan trọng bằng soft delete nếu phù hợp.
9. Mật khẩu không bao giờ được lưu hoặc hiển thị ở dạng gốc.
10. Customer chỉ xem được dữ liệu của chính mình.

---

# 4. Vai trò và phân quyền

Có đúng ba role:

```text
CUSTOMER
STAFF
ADMIN
```

## 4.1. Customer

- Đăng ký, đăng nhập, đăng xuất.
- Quên mật khẩu bằng OTP email.
- Xem và sửa hồ sơ cơ bản.
- Không được đổi username.
- Không được tự xóa tài khoản; phải liên hệ admin.
- Quản lý tối đa 5 địa chỉ.
- Xem sản phẩm, tìm kiếm, lọc, yêu thích.
- Thêm giỏ hàng.
- Checkout khi đã đăng nhập.
- Theo dõi đơn hàng của chính mình.
- Hủy đơn ở trạng thái cho phép và phải chọn lý do.
- Gửi yêu cầu trả hàng.
- Đánh giá sản phẩm đã mua và đã giao thành công.
- Xem thông báo tài khoản.
- Gửi form liên hệ.
- Sử dụng RoBot.

## 4.2. Staff

Dùng chung khu vực `/admin` nhưng bị giới hạn quyền:

- Xem dashboard nghiệp vụ cơ bản.
- Xem doanh thu và đơn hàng theo phạm vi được cho phép.
- Xem sản phẩm.
- Cập nhật tồn kho.
- Xem lịch sử nhập/xuất kho.
- Xử lý đơn hàng.
- Chuyển trạng thái đơn theo state machine.
- Xác nhận thanh toán thủ công.
- Xử lý yêu cầu liên hệ và phản hồi.
- Tạo, sửa, xóa mềm bài viết Review Ro Sách và Ro-mance.
- Không được quản lý role.
- Không được tạo admin.
- Không được thay đổi cấu hình bảo mật hệ thống.
- Không được xóa audit log.
- Không được sửa trực tiếp doanh thu hoặc tổng tiền đơn hàng.

## 4.3. Admin

Admin có toàn bộ quyền nghiệp vụ hợp lệ:

- Dashboard đầy đủ.
- Quản lý customer và staff.
- Tạo, khóa, mở khóa và đặt lại mật khẩu staff.
- Quản lý role trong giới hạn hệ thống.
- Quản lý sản phẩm, biến thể, thể loại, tác giả, nhà xuất bản, nhà cung cấp/nhà phát hành nếu có.
- Quản lý kho và lịch sử kho.
- Quản lý đơn hàng và thanh toán.
- Quản lý nội dung, banner, bài viết.
- Quản lý FAQ chatbot.
- Quản lý liên hệ.
- Quản lý thông báo.
- Quản lý cấu hình website.
- Xem và xuất báo cáo.
- Xem audit log.

Admin vẫn không được:

- xem mật khẩu gốc;
- đặt tồn kho âm;
- xóa lịch sử thanh toán hoặc audit log một cách tùy tiện;
- sửa sai lệch dữ liệu tài chính đã khóa sổ.

---

# 5. Authentication và authorization

## 5.1. Đăng ký

Các trường:

- username
- fullName
- email
- phone
- password
- confirmPassword
- acceptTerms

Validation:

- Username: 5–15 ký tự.
- Chỉ gồm chữ, số và dấu gạch dưới.
- Không có khoảng trắng.
- Username duy nhất.
- Mật khẩu: 6–20 ký tự, có ít nhất một chữ và một số.
- Email hợp lệ và duy nhất.
- Số điện thoại hợp lệ và duy nhất.
- Họ tên 2–100 ký tự.
- Xác nhận mật khẩu phải trùng.
- Phải đồng ý điều khoản.
- Trim input phù hợp.
- Email lưu dạng lowercase.
- Không cần xác minh email khi đăng ký ở phiên bản đầu.

## 5.2. Đăng nhập

- Customer đăng nhập bằng username tại `/dang-nhap`.
- Staff/Admin đăng nhập tại `/admin/login`.
- Staff và Admin dùng chung form, sau đó phân quyền bằng role.
- Có rate limit.
- Thông báo lỗi không tiết lộ quá chi tiết tài khoản nào tồn tại.
- Access token ngắn hạn.
- Refresh token có rotation hoặc cơ chế thu hồi.
- Ưu tiên lưu refresh token an toàn bằng HttpOnly cookie nếu kiến trúc triển khai cho phép.

## 5.3. Quên mật khẩu bằng OTP email

Luồng:

1. Người dùng nhập email đã đăng ký.
2. Backend tạo OTP 6 chữ số.
3. Chỉ lưu hash OTP trong database.
4. OTP hết hạn sau khoảng 5–10 phút.
5. Giới hạn số lần gửi lại và số lần nhập sai.
6. Sau khi xác minh OTP, cấp reset token ngắn hạn.
7. Người dùng nhập mật khẩu mới.
8. Thu hồi các refresh token cũ.
9. Ghi audit log.

Đây là chức năng có độ khó trung bình, hoàn toàn phù hợp đồ án nếu làm từng bước. Phải hỗ trợ cấu hình SMTP qua `.env`, có chế độ development ghi OTP ra log khi chưa cấu hình email thật, nhưng production không được log OTP.

## 5.4. Route guard

- `/admin/**` chỉ dành cho STAFF hoặc ADMIN.
- Customer truy cập `/admin` phải thấy trang 403 theo phong cách RoSach:
  - “403 — Không phận sự miễn vào”
  - giải thích khu vực chỉ dành cho nhân viên và quản trị viên;
  - nút quay lại trang chủ.
- Chưa đăng nhập vào `/admin` thì chuyển `/admin/login`.
- Backend vẫn phải trả 401/403 đúng nghĩa, không chỉ guard ở Next.js.

---

# 6. Sơ đồ trang khách hàng

## 6.1. Header

- Logo RoSach
- Trang chủ
- Sản phẩm mới
- Sản phẩm với mega menu/dropdown thể loại
- Góc RoSach
  - Review Ro Sách
  - Ro-mance
- Giới thiệu RoSach
- Liên hệ
- Thanh tìm kiếm
- Icon yêu thích
- Icon giỏ hàng có badge tổng số lượng
- Icon tài khoản
- Icon thông báo khi đã đăng nhập

Trạng thái icon tài khoản:

Chưa đăng nhập:

- Đăng nhập
- Đăng ký

Đã đăng nhập:

- Hồ sơ cá nhân
- Sổ địa chỉ
- Đơn hàng của tôi
- Theo dõi đơn hàng
- Sản phẩm yêu thích
- Đổi mật khẩu
- Đăng xuất

## 6.2. Trang chủ `/`

Các section:

1. Hero banner
2. Danh mục nổi bật
3. “Sách mới lên rổ”
4. “Sách đang được săn”
5. “RoSach đề cử”
6. Banner Ro-mance với slogan chiến dịch
7. Review Ro Sách mới nhất
8. Lý do chọn RoSach
9. Đăng ký nhận tin
10. Footer đầy đủ
11. Widget hỗ trợ nổi

Admin có thể quản lý banner và các mục nổi bật.

## 6.3. Trang sản phẩm `/san-pham`

- Breadcrumb
- Bộ lọc
- Sắp xếp
- Grid sản phẩm
- Phân trang
- Responsive
- Query params phải phản ánh filter để có thể chia sẻ URL

Bộ lọc:

- thể loại;
- khoảng giá;
- tác giả;
- nhà xuất bản;
- còn hàng;
- sách mới;
- đang giảm giá;
- đánh giá.

Sắp xếp:

- mới nhất;
- bán chạy;
- giá tăng;
- giá giảm;
- đánh giá cao.

## 6.4. Trang sản phẩm mới `/san-pham-moi`

Sản phẩm mới được xác định bằng:

- ngày phát hành trong năm hiện tại; hoặc
- admin bật `isNew`.

## 6.5. Trang thể loại

Ví dụ:

```text
/the-loai/van-hoc
/the-loai/cong-nghe-thong-tin
```

Một sản phẩm có thể thuộc nhiều thể loại.

## 6.6. Trang chi tiết sách `/sach/[slug]`

- Breadcrumb
- Album ảnh
- Tên sách
- Tác giả
- Nhà xuất bản
- Giá
- Giá gốc
- Nhãn giảm giá
- Đánh giá
- Tồn kho
- Chọn biến thể nếu sách có:
  - bản thường;
  - bìa mềm;
  - bìa cứng;
  - phiên bản đặc biệt.
- Chọn số lượng
- Thêm vào giỏ
- Mua ngay
- Yêu thích
- Mô tả ngắn
- Mô tả đầy đủ
- Thông tin kỹ thuật
- Đánh giá người mua
- Bộ lọc đánh giá
- Sách liên quan
- Sách cùng tác giả
- Sản phẩm marketing liên kết do admin chọn

Mỗi biến thể có SKU, giá, tồn kho và có thể có ảnh riêng.

## 6.7. Tìm kiếm

Tìm theo:

- tên sách;
- tác giả;
- ISBN;
- thể loại;
- nhà xuất bản.

Autocomplete:

- hiển thị gợi ý sản phẩm;
- gợi ý từ khóa hot;
- lịch sử tìm kiếm gần đây;
- cho phép xóa lịch sử;
- lịch sử của khách chưa đăng nhập lưu local storage;
- lịch sử của khách đã đăng nhập có thể lưu database hoặc đồng bộ hợp lý.

Trang kết quả:
`/tim-kiem?q=...`

## 6.8. Wishlist

- Customer đã đăng nhập có danh sách yêu thích trong database.
- Người chưa đăng nhập bấm yêu thích thì yêu cầu đăng nhập.
- Có trang `/tai-khoan/yeu-thich`.

## 6.9. Giỏ hàng

Yêu cầu đã chốt:

- Khi chưa đăng nhập, người dùng vẫn có thể thêm sản phẩm vào giỏ tạm trong trình duyệt.
- Khi mở giỏ hàng hoặc checkout mà chưa đăng nhập, hiển thị yêu cầu đăng nhập/đăng ký.
- Sau khi đăng nhập, đồng bộ giỏ tạm vào giỏ database.
- Khi đồng bộ phải gộp số lượng nhưng không vượt tồn kho.
- Badge giỏ hàng hiển thị tổng số cuốn.

Trang `/gio-hang`:

- ảnh;
- tên;
- biến thể;
- đơn giá;
- số lượng;
- thành tiền;
- xóa;
- tạm tính;
- phí vận chuyển;
- tổng cộng.

Chưa làm voucher ở phiên bản đầu.

Phí vận chuyển:

- mặc định 30.000 VNĐ;
- miễn phí từ 300.000 VNĐ;
- cấu hình qua database/site settings, không hard-code khắp codebase.

## 6.10. Checkout `/thanh-toan`

Một trang duy nhất:

- Chọn hoặc thêm địa chỉ nhận hàng
- Danh sách sản phẩm
- Phí vận chuyển
- Ghi chú đơn hàng
- Phương thức thanh toán
- Tổng tiền
- Xác nhận đặt hàng

Bắt buộc đăng nhập.

Khi thành công, hiển thị:

- mã đơn;
- ngày mua;
- danh sách sản phẩm;
- tổng tiền;
- phương thức thanh toán;
- hướng dẫn tiếp theo;
- nút xem đơn hàng.

## 6.11. Liên hệ `/lien-he`

Trường:

- họ tên;
- email;
- số điện thoại;
- tiêu đề;
- nội dung.

Validation và rate limit.
Lưu database.
Admin và staff xem, ghi chú nội bộ và phản hồi.
Trạng thái:

- Mới
- Đang xử lý
- Đã liên hệ
- Hoàn tất

## 6.12. Giới thiệu `/gioi-thieu`

- Câu chuyện thương hiệu RoSach/Rổ Sách
- Slogan
- Giá trị
- Cam kết
- Phong cách “sách chuẩn, gu chất”

## 6.13. Góc RoSach

### Review Ro Sách

- Danh sách bài review
- Chi tiết bài viết
- Liên kết sản phẩm đang review
- Không có bình luận

### Ro-mance

Kết hợp:

- bài viết;
- bộ sưu tập sách lãng mạn;
- banner chiến dịch.

Staff và Admin có quyền tạo, sửa, xóa mềm bài viết.

## 6.14. Hồ sơ khách hàng `/tai-khoan`

Sidebar:

- Hồ sơ cá nhân
- Sổ địa chỉ
- Đơn hàng
- Theo dõi đơn
- Yêu thích
- Đổi mật khẩu
- Thông báo
- Đăng xuất

Hồ sơ:

- username chỉ đọc;
- fullName;
- email;
- phone;
- birthday;
- gender;
- không có avatar.

Tối đa 5 địa chỉ.

## 6.15. Đơn hàng khách hàng

Các tab tiếng Việt:

- Tất cả
- Chờ thanh toán
- Chờ xác nhận
- Đã xác nhận
- Đang đóng gói
- Đang giao
- Đã giao
- Đã hủy
- Yêu cầu trả hàng
- Đã trả hàng

Chỉ được xem đơn của chính mình.

Theo dõi tiến trình dạng timeline.

## 6.16. Thông báo khách hàng

Thông báo trong website:

- đặt hàng thành công;
- thanh toán được xác nhận;
- đơn được xác nhận;
- đang đóng gói;
- đang giao;
- đã giao;
- hủy đơn;
- kết quả yêu cầu trả hàng.

---

# 7. Widget hỗ trợ và RoBot

Chỉ có một widget nổi để giao diện gọn:

- RoBot
- Tra cứu đơn hàng
- Liên hệ
- Về đầu trang

## 7.1. RoBot

Chatbot FAQ miễn phí theo kịch bản:

- Nút gợi ý nhanh
- Ô nhập câu hỏi tự nhiên
- Dò từ khóa
- Phân nhóm FAQ:
  - Sản phẩm
  - Đơn hàng
  - Thanh toán
  - Vận chuyển
  - Đổi trả
  - Tài khoản
  - Liên hệ

Có thể gọi API để:

- tìm sách;
- gợi ý sách theo thể loại;
- xem đơn gần nhất của customer đang đăng nhập;
- xem trạng thái một đơn thuộc customer đó.

Chỉ lưu câu hỏi chatbot không trả lời được để admin bổ sung FAQ.
Không lưu dữ liệu nhạy cảm trong chat.
Khi không trả lời được:

- đưa link liên hệ;
- cho mở form liên hệ trong widget;
- hiển thị thông tin hỗ trợ.

Admin quản lý FAQ:

- câu hỏi mẫu;
- từ khóa;
- câu trả lời;
- nhóm;
- độ ưu tiên;
- trạng thái;
- ngày cập nhật.

---

# 8. Sản phẩm và catalog

## 8.1. Thực thể cần quản lý

- Product/Book
- ProductVariant
- ProductImage
- Category
- Author
- Publisher
- Supplier hoặc Distributor nếu cần quản lý nguồn nhập
- RelatedProduct
- Inventory
- InventoryTransaction

Hướng dẫn lựa chọn:

- Tác giả và nhà xuất bản chắc chắn phải tách bảng.
- Nhà cung cấp nên có nếu cần tính nhập kho và chi phí.
- Nhà phát hành có thể là trường tùy chọn hoặc tách bảng nếu dữ liệu seed có sử dụng.

## 8.2. Dữ liệu sách

- id
- name
- slug
- ISBN
- SKU/variant SKU
- shortDescription
- description
- publicationDate
- publicationYear
- pageCount
- language
- dimensions
- weight
- coverType/variant
- costPrice
- originalPrice
- salePrice
- isNew
- isFeatured
- isActive
- averageRating
- soldCount
- timestamps
- soft delete

## 8.3. Giá ban đầu

Để dữ liệu demo dễ tính:

- Có thể seed các sách với cùng giá nhập cơ bản.
- Giá bán có thể đồng nhất hoặc chia vài mức đơn giản.
- Tuy nhiên schema và logic phải hỗ trợ mỗi sản phẩm/biến thể có giá khác nhau về sau.

---

# 9. Review sản phẩm và kiểm duyệt

Chỉ customer đã mua đúng sản phẩm và đơn đã `DELIVERED` mới được review.

Review gồm:

- số sao;
- nội dung;
- không có ảnh trong phiên bản đầu.

Mỗi order item chỉ được review một lần, có thể sửa theo quy tắc.

Kiểm duyệt nội dung:

- danh sách từ khóa spam, xúc phạm, quảng cáo;
- trim và chuẩn hóa;
- phát hiện lặp ký tự/link quảng cáo cơ bản;
- nếu vi phạm, không cho submit và hiển thị thông báo lịch sự;
- không tự động hiển thị nguyên từ ngữ xúc phạm trong thông báo;
- backend phải kiểm tra lại;
- admin có thể ẩn review nếu cần.

Trang sản phẩm có bộ lọc:

- tất cả;
- 5 sao;
- 4 sao;
- 3 sao;
- 2 sao;
- 1 sao;
- mới nhất.

---

# 10. Thanh toán

Ba phương thức:

## 10.1. COD

- Thanh toán khi nhận hàng.
- Đơn đi vào “Chờ xác nhận”.
- Staff/Admin xử lý.

## 10.2. Chuyển khoản ngân hàng

Khi chọn:

- hiển thị tên ngân hàng;
- số tài khoản;
- chủ tài khoản;
- số tiền;
- nội dung chuyển khoản;
- hướng dẫn.
- Không cần upload biên lai.
- Staff/Admin xác nhận thủ công.

## 10.3. QR chuyển khoản

- Dùng ảnh QR do chủ dự án tải lên.
- Hiển thị cùng số tiền và nội dung chuyển khoản.
- Không cần upload biên lai.
- Staff/Admin xác nhận thủ công.

## 10.4. Hết hạn thanh toán

- Chuyển khoản/QR phải thanh toán trong 15 phút.
- Sau 15 phút chưa được xác nhận:
  - tự hủy đơn;
  - giải phóng hàng giữ;
  - ghi lịch sử trạng thái;
  - tạo thông báo.
- Cần background job hoặc cơ chế cron định kỳ.
- Thiết kế sao cho chạy được trong môi trường deploy.
- Không dựa vào timer trong memory của một process duy nhất.

---

# 11. Đơn hàng và tồn kho

## 11.1. Trạng thái nội bộ

Dùng enum tiếng Anh trong code/database để ổn định, nhưng UI hiển thị hoàn toàn bằng tiếng Việt:

```text
PENDING_PAYMENT       = Chờ thanh toán
PENDING_CONFIRMATION  = Chờ xác nhận
CONFIRMED             = Đã xác nhận
PACKING               = Đang đóng gói
SHIPPING              = Đang giao
DELIVERED             = Đã giao
CANCELLED             = Đã hủy
RETURN_REQUESTED      = Yêu cầu trả hàng
RETURNED              = Đã trả hàng
RETURN_REJECTED       = Từ chối trả hàng
```

## 11.2. State machine

Chỉ cho chuyển trạng thái hợp lệ.

Ví dụ:

- Chờ thanh toán → Chờ xác nhận sau khi xác nhận tiền.
- Chờ xác nhận → Đã xác nhận.
- Đã xác nhận → Đang đóng gói.
- Đang đóng gói → Đang giao.
- Đang giao → Đã giao.
- Không cho Đã giao quay về Chờ xác nhận.
- Mọi chuyển trạng thái phải lưu lịch sử và người thao tác.

## 11.3. Hủy đơn

Customer được tự hủy khi:

- Chờ thanh toán;
- Chờ xác nhận.

Phải chọn lý do, ví dụ:

- Đặt nhầm sản phẩm
- Muốn thay đổi địa chỉ
- Muốn thay đổi phương thức thanh toán
- Không còn nhu cầu
- Tìm được giá phù hợp hơn
- Lý do khác

Theo dõi hành vi hủy:

- lưu số lần hủy;
- nếu hủy nhiều lần trong một khoảng thời gian, hiển thị cảnh báo;
- không tự động khóa chỉ bằng một điều kiện đơn giản;
- admin xem lịch sử và quyết định khóa;
- hệ thống có thể đánh cờ tài khoản rủi ro.

## 11.4. Giữ hàng

Dùng:

- onHandQuantity
- reservedQuantity
- availableQuantity = onHand - reserved

Khi đặt:

- transaction kiểm tra available;
- tăng reserved;
- tạo order.

Khi thanh toán hết hạn/hủy:

- giảm reserved.

Khi đơn hoàn tất hoặc theo thời điểm nghiệp vụ đã chọn:

- giảm onHand;
- giảm reserved;
- tăng sold.

Phải tránh race condition bằng atomic update/transaction.

## 11.5. Lịch sử kho

Ghi:

- loại giao dịch;
- số lượng trước/sau;
- số lượng thay đổi;
- product variant;
- order liên quan;
- người thao tác;
- lý do;
- thời gian.

Loại:

- nhập kho;
- giữ hàng;
- giải phóng giữ hàng;
- bán hàng;
- hoàn hàng;
- điều chỉnh;
- hư hỏng.

Cảnh báo khi available dưới 5 cuốn, nhưng ngưỡng có thể cấu hình.

---

# 12. Doanh thu, chi phí và lợi nhuận

Yêu cầu người dùng ban đầu nói “đơn được staff/admin xác nhận là tính doanh thu”. Để báo cáo đúng thương mại điện tử, hãy tách rõ:

1. **Doanh thu dự kiến/đã xác nhận:** đơn đã được xác nhận.
2. **Doanh thu thực thu/ghi nhận:** đơn đã giao thành công, hoặc thanh toán đã hoàn tất theo quy tắc.
3. **Đơn đang xử lý:** không cộng vào doanh thu thực thu.
4. **Đơn hủy/hoàn:** phải loại khỏi doanh thu và tính khoản hoàn.

Dashboard mặc định nên dùng doanh thu thực thu để tránh báo cáo sai, đồng thời có thể hiển thị doanh thu dự kiến riêng.

Tính:

- grossRevenue;
- discounts (hiện tại có thể bằng 0 vì chưa có voucher);
- shippingRevenue;
- refundAmount;
- netRevenue;
- costOfGoodsSold;
- operatingCost đơn giản nếu có;
- profit.

Công thức rõ ràng và có tài liệu.

Bộ lọc:

- hôm nay;
- tuần này;
- tháng này;
- năm nay;
- khoảng ngày tùy chọn.

Biểu đồ:

- doanh thu theo thời gian;
- đơn theo trạng thái;
- top sách bán chạy;
- phương thức thanh toán.

Xuất:

- CSV;
- Excel nếu triển khai thuận lợi.

---

# 13. Admin site

## 13.1. Route

```text
/admin/login
/admin/dashboard
/admin/products
/admin/categories
/admin/authors
/admin/publishers
/admin/inventory
/admin/orders
/admin/payments
/admin/customers
/admin/staff
/admin/contacts
/admin/articles
/admin/faqs
/admin/banners
/admin/reports
/admin/settings
/admin/audit-logs
```

## 13.2. Dashboard

Cards:

- doanh thu thực thu;
- doanh thu dự kiến;
- lợi nhuận;
- chi phí;
- đơn mới;
- chờ thanh toán;
- chờ xác nhận;
- đang giao;
- đã giao;
- đã hủy;
- sản phẩm sắp hết;
- khách hàng mới.

Có nút:

- Hôm nay
- Tuần này
- Tháng này
- Năm nay
- Tùy chọn ngày

## 13.3. Quản lý sản phẩm

- CRUD sách
- CRUD biến thể
- nhiều thể loại
- tác giả
- nhà xuất bản
- ảnh
- giá nhập/giá bán
- tồn kho
- nhãn mới/nổi bật
- sản phẩm liên quan
- SEO fields
- preview
- soft delete
- pagination/filter/search

## 13.4. Quản lý đơn

- bảng dữ liệu;
- filter trạng thái/ngày/phương thức;
- chi tiết;
- timeline;
- chuyển trạng thái hợp lệ;
- xác nhận thanh toán;
- ghi chú nội bộ;
- lịch sử người thao tác.

## 13.5. Liên hệ

Admin và staff:

- xem;
- phân trạng thái;
- ghi chú;
- phản hồi;
- lưu nội dung phản hồi và thời gian.

## 13.6. Nội dung

Staff và Admin có thể:

- tạo;
- sửa;
- xuất bản;
- ẩn;
- xóa mềm.

Bài viết có:

- title;
- slug;
- cover;
- excerpt;
- content;
- author;
- category;
- tags;
- related product;
- draft/published;
- publishedAt;
- SEO title;
- SEO description.

## 13.7. Banner và cấu hình

Admin quản lý:

- hero banner;
- slogan;
- link CTA;
- thứ tự;
- thời gian hiển thị;
- trạng thái;
- QR image;
- bank information;
- shipping fee;
- free shipping threshold;
- low-stock threshold;
- contact info;
- social links.

---

# 14. Notification

## 14.1. Admin/Staff

Icon chuông:

- đơn mới;
- thanh toán chờ xác nhận;
- liên hệ mới;
- sản phẩm sắp hết;
- yêu cầu trả hàng;
- câu hỏi chatbot chưa trả lời.

## 14.2. Customer

- cập nhật đơn;
- thanh toán;
- trả hàng;
- phản hồi hỗ trợ.

Cần:

- read/unread;
- mark all read;
- phân trang;
- liên kết tới tài nguyên liên quan.

---

# 15. Database — yêu cầu trước khi triển khai

Trước khi viết migration, Codex phải:

1. Tạo sơ đồ thực thể và quan hệ.
2. Liệt kê bảng, khóa, unique constraint và index.
3. Giải thích quan hệ many-to-many.
4. Kiểm tra các luồng:
   - đăng ký/đăng nhập;
   - OTP;
   - giỏ tạm đồng bộ;
   - nhiều biến thể;
   - đặt hàng cạnh tranh;
   - thanh toán hết hạn;
   - lịch sử trạng thái;
   - review verified purchase;
   - báo cáo tài chính.
5. Chỉ sau khi tôi duyệt mới tạo schema/migration.

Các bảng dự kiến:

```text
Users
Roles hoặc role enum
RefreshTokens
PasswordResetOtps
Addresses
UserRiskFlags

Products
ProductVariants
ProductImages
Categories
ProductCategories
Authors
ProductAuthors
Publishers
Suppliers
RelatedProducts

Inventories
InventoryTransactions
StockReservations

Carts
CartItems
Wishlists
SearchHistories
HotKeywords

Orders
OrderItems
OrderAddresses
OrderStatusHistories
OrderCancellationReasons
ReturnRequests

Payments
PaymentTransactions
BankSettings

Reviews
ReviewModerationTerms

Notifications

Contacts
ContactReplies
ContactInternalNotes

Articles
ArticleCategories
Tags
ArticleTags
ArticleProducts

FaqCategories
FaqItems
UnansweredChatQueries

Banners
SiteSettings
AuditLogs
```

Không nhất thiết tạo tất cả thành bảng riêng nếu enum/JSON hợp lý hơn, nhưng phải giải thích lựa chọn.

Index quan trọng:

- username;
- normalized email;
- phone;
- slug;
- ISBN;
- SKU;
- orderCode;
- createdAt;
- order status;
- payment status;
- publication date;
- full-text/search strategy nếu áp dụng.

---

# 16. SEO

Next.js phải có:

- metadata động;
- title template;
- meta description;
- canonical;
- Open Graph;
- Twitter cards nếu phù hợp;
- sitemap;
- robots.txt;
- breadcrumb;
- semantic HTML;
- JSON-LD:
  - Organization
  - WebSite
  - SearchAction
  - Product
  - Offer
  - AggregateRating
  - BreadcrumbList
  - Article
- URL tiếng Việt không dấu, thân thiện;
- ảnh có alt;
- tối ưu loading;
- server rendering/static generation phù hợp;
- trang không nên index:
  - giỏ hàng;
  - checkout;
  - tài khoản;
  - admin;
  - kết quả nội bộ nhạy cảm.

---

# 17. UI/UX

## 17.1. Màu sắc

Codex được quyền chọn palette cuối, ưu tiên:

- đỏ rượu/đỏ gạch làm accent;
- nền kem giấy;
- đen than;
- vàng nhẹ cho rating/badge.

Không dùng quá nhiều màu đỏ.
Bảo đảm contrast và accessibility.

## 17.2. Responsive

- Desktop
- Tablet
- Mobile

Mobile:

- menu drawer;
- search dễ dùng;
- widget không che CTA;
- bảng admin có chế độ responsive hoặc horizontal scroll hợp lý.

## 17.3. Admin UI

Dùng phong cách quản trị trung tính nhưng giữ accent RoSach:

- sidebar;
- topbar;
- breadcrumb;
- card;
- data table;
- filter;
- modal/drawer;
- empty/loading/error states.

## 17.4. Trạng thái UI bắt buộc

- loading skeleton;
- empty state;
- error state;
- success toast;
- confirmation dialog;
- disabled state;
- form validation inline;
- 404;
- 401;
- 403;
- 500.

---

# 18. API và bảo mật

- RESTful routes nhất quán.
- Response envelope nhất quán.
- Error codes nhất quán.
- Pagination chuẩn.
- Zod validate request.
- Parameterized query/ORM.
- Helmet.
- CORS allowlist.
- Rate limit:
  - login;
  - register;
  - forgot password;
  - OTP verify;
  - contact;
  - review;
  - chatbot.
- Sanitize rich text bài viết.
- Kiểm tra MIME/type/size upload.
- Không lộ stack trace production.
- Secrets trong environment variables.
- Audit:
  - login admin/staff;
  - thay role;
  - khóa tài khoản;
  - sửa tồn kho;
  - sửa giá;
  - chuyển trạng thái đơn;
  - xác nhận thanh toán;
  - sửa cấu hình.
- CSRF strategy nếu dùng cookie authentication.
- Không cho mass assignment.
- Không cho IDOR.

---

# 19. Seed data

Tạo seed có ý nghĩa:

- 1 Admin
- 1 Staff
- 2–3 Customer
- 6 thể loại
- 18–24 sách
- một số sách nhiều thể loại
- một số sách có biến thể bìa mềm/bìa cứng
- tác giả và nhà xuất bản
- tồn kho
- bài Review Ro Sách
- bài Ro-mance
- FAQ
- banner
- đơn hàng ở nhiều trạng thái
- thông báo
- liên hệ
- dữ liệu báo cáo

Không commit mật khẩu thật. README ghi tài khoản demo an toàn.

---

# 20. Testing

Tối thiểu:

## Backend

- auth validation;
- authorization;
- OTP expiry;
- product filter;
- cart merge;
- price recalculation;
- insufficient stock;
- concurrent ordering;
- order state transitions;
- payment expiration;
- verified purchase review;
- report calculation.

## Frontend

- form validation;
- route guard;
- cart badge;
- product filters;
- checkout;
- permission-based admin menu.

## E2E ưu tiên

1. Customer đăng ký → đăng nhập.
2. Tìm sách → thêm giỏ.
3. Checkout COD.
4. Staff xác nhận và chuyển trạng thái.
5. Customer theo dõi đơn.
6. Customer review sau khi giao.
7. Customer cố vào `/admin` nhận 403.
8. Hai request mua sản phẩm còn 1 cuốn, chỉ một request thành công.

---

# 21. Deploy

Người dùng đã mua domain nhưng chưa từng deploy.

Hãy thiết kế dự án để có thể triển khai theo hướng dễ học:

- Frontend Next.js: Vercel.
- Backend Express: Render, Railway hoặc VPS tùy khả năng chạy lâu dài.
- SQL Server hiện đang chạy trên máy cá nhân.

Lưu ý quan trọng:

- SQL Server trên máy cá nhân không phù hợp làm production public lâu dài nếu không cấu hình IP public, firewall, port forwarding, SSL/VPN, uptime và bảo mật.
- Không được mở trực tiếp SQL Server ra Internet một cách thiếu bảo vệ.
- Phương án khuyến nghị khi deploy chính thức:
  1. SQL Server trên Azure SQL/SQL Server VM; hoặc
  2. backend và SQL Server trên cùng VPS/private network.
- Nếu chỉ demo ngắn hạn, có thể dùng tunnel/VPN an toàn nhưng phải ghi rõ hạn chế.

Có hai môi trường:

- Development: chạy local, database local.
- Production: domain public, API public, database production, env riêng.

README phải hướng dẫn:

- cài dependencies;
- cấu hình `.env`;
- migrate;
- seed;
- chạy dev;
- build;
- test;
- deploy.

Không bắt buộc Docker ở bản đầu, nhưng cấu trúc không được cản trở việc bổ sung Docker sau này.

---

# 22. Git và quy trình làm việc

- Public code lên GitHub.
- Một monorepo.
- Branch:
  - main
  - develop
  - feature/*
- Commit rõ ràng.
- Không commit `.env`.
- Có `.env.example`.
- Có README.
- Có docs:
  - requirements;
  - architecture;
  - ERD;
  - API;
  - test plan;
  - deployment guide.

---

# 23. Kế hoạch triển khai bắt buộc

Không code tất cả ngay. Chia thành các milestone:

## Milestone 0 — Phân tích và thiết kế

- Chốt sitemap.
- Chốt permission matrix.
- Chốt use case.
- Chốt order/payment/inventory state machine.
- Vẽ ERD.
- Viết API contract sơ bộ.
- Chưa code nghiệp vụ lớn.

## Milestone 1 — Khởi tạo

- Monorepo.
- Next.js.
- Express.
- TypeScript.
- Tailwind.
- SQL Server connection.
- lint/format/test setup.
- environment validation.
- health endpoint.

## Milestone 2 — Auth và role

- đăng ký;
- đăng nhập;
- refresh;
- logout;
- OTP quên mật khẩu;
- route guard;
- 403 RoSach;
- admin login.

## Milestone 3 — Catalog

- category;
- author;
- publisher;
- product;
- variant;
- image;
- search;
- autocomplete;
- filter;
- product detail;
- SEO.

## Milestone 4 — Customer experience

- wishlist;
- cart local;
- cart database;
- cart merge;
- profile;
- addresses;
- notification shell.

## Milestone 5 — Order, inventory, payment

- checkout;
- shipping fee;
- stock reservation;
- COD;
- bank transfer;
- QR;
- 15-minute expiry;
- order history;
- tracking;
- cancellation;
- return request.

## Milestone 6 — Admin/Staff

- dashboard;
- product CRUD;
- inventory;
- order workflow;
- payment confirmation;
- users/staff;
- contacts;
- notifications;
- audit log.

## Milestone 7 — Content và RoBot

- Review Ro Sách;
- Ro-mance;
- banner;
- FAQ;
- product suggestions;
- unanswered queries.

## Milestone 8 — Reviews và reporting

- verified purchase review;
- moderation;
- revenue;
- cost;
- profit;
- charts;
- export.

## Milestone 9 — Hoàn thiện

- responsive;
- accessibility;
- SEO;
- security review;
- test;
- performance;
- seed;
- docs.

## Milestone 10 — Deploy

- production environment;
- domain;
- frontend;
- backend;
- database;
- smoke test;
- deployment guide.

---

# 24. Việc Codex cần làm ngay trong lượt đầu

Không bắt đầu code tính năng ngay.

Hãy tạo hoặc cập nhật thư mục `docs/` với các tài liệu sau:

1. `01-requirements.md`
2. `02-sitemap.md`
3. `03-role-permission-matrix.md`
4. `04-use-cases.md`
5. `05-order-payment-inventory-flow.md`
6. `06-erd-proposal.md`
7. `07-api-contract-draft.md`
8. `08-development-roadmap.md`
9. `09-open-questions-and-assumptions.md`

Sau đó trình bày:

- sitemap đầy đủ;
- ma trận quyền Customer/Staff/Admin;
- ERD đề xuất;
- những điểm có nguy cơ mâu thuẫn;
- các giả định;
- danh sách quyết định cần tôi duyệt.

Chỉ sau khi tôi duyệt Milestone 0 mới bắt đầu scaffold dự án.

---

# 25. Tiêu chí hoàn thành

Dự án được coi là hoàn thành khi:

- build production thành công;
- SQL Server lưu dữ liệu thật;
- phân quyền backend đúng;
- customer không thể truy cập admin;
- staff chỉ thấy và gọi được API được cấp;
- admin đầy đủ quyền nghiệp vụ;
- không bán vượt tồn kho;
- tổng tiền do backend tính;
- đơn chuyển khoản hết hạn sau 15 phút;
- customer theo dõi đúng đơn của mình;
- review chỉ dành cho verified purchase;
- chatbot FAQ hoạt động;
- dashboard có dữ liệu thật;
- doanh thu/lợi nhuận có công thức rõ;
- website responsive;
- SEO cơ bản đầy đủ;
- deploy public;
- README giúp giảng viên chạy được;
- có tài khoản demo và seed data;
- có test cho các luồng quan trọng.

---

# 26. Cách giao tiếp với tôi

Mỗi lần hoàn thành một task, trả lời theo mẫu:

```text
## Đã hoàn thành
- ...

## File đã tạo/sửa
- ...

## Lệnh đã chạy
- ...

## Kết quả kiểm tra
- lint:
- type-check:
- test:
- build:

## Quyết định/giả định
- ...

## Việc tiếp theo đề xuất
- ...
```

Không nói “đã hoàn thành” nếu chưa chạy kiểm tra.
Không bỏ qua lỗi bằng cách tắt TypeScript, ESLint hoặc validation.
Không xóa code đang hoạt động nếu chưa giải thích.
