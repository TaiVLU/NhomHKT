# Non-functional Requirements

## Bảo mật

- Backend authorization.
- Hash mật khẩu.
- OTP hash và expiry.
- Rate limit.
- Validation.
- CORS allowlist.
- Helmet.
- Không IDOR.
- Không mass assignment.

## Hiệu năng

- Pagination cho danh sách.
- Index database.
- Lazy loading ảnh.
- Cache dữ liệu public phù hợp.
- API P95 mục tiêu dưới 800 ms với dữ liệu đồ án trong môi trường ổn định.

## Khả dụng

- Responsive desktop/tablet/mobile.
- Loading, empty, error và success states.
- Không để widget che CTA trên mobile.

## Duy trì

- TypeScript strict.
- Module hóa.
- Test các business rule quan trọng.
- Tài liệu cập nhật cùng code.

## SEO

- Metadata động.
- sitemap, robots.
- structured data.
- URL thân thiện.
