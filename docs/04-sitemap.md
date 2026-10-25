# Sitemap

Note: this document contains the original target sitemap. The M6 local release implements the customer/admin routes listed in `docs/39-final-capability-matrix.md`; wishlist, content/CMS, standalone admin dashboard, standalone inventory, payments, customer/staff management, reports, settings, audit logs, and RoBot routes remain deferred or outside current M6 scope.

## Public và Customer

```text
/
├── /san-pham
├── /san-pham-moi
├── /the-loai/[slug]
├── /sach/[slug]
├── /tim-kiem
├── /goc-rosach
│   ├── /review-ro-sach
│   ├── /review-ro-sach/[slug]
│   ├── /ro-mance
│   └── /ro-mance/[slug]
├── /gioi-thieu
├── /lien-he
├── /dang-ky
├── /dang-nhap
├── /quen-mat-khau
├── /gio-hang
├── /thanh-toan
├── /dat-hang-thanh-cong/[orderCode]
└── /tai-khoan
    ├── /ho-so
    ├── /dia-chi
    ├── /don-hang
    ├── /don-hang/[orderCode]
    ├── /yeu-thich
    ├── /thong-bao
    ├── /lien-he
    └── /doi-mat-khau
```

## Admin/Staff

```text
/admin/login
/admin/403
/admin/dashboard
/admin/products
/admin/categories
/admin/authors
/admin/publishers
/admin/inventory
/admin/inventory/history
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

## Widget nổi

Một nút nổi mở:
- RoBot;
- tra cứu đơn;
- liên hệ;
- về đầu trang.
