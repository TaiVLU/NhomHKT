# HKT Store

HKT Store là monorepo thương mại điện tử chuyên kinh doanh manga, truyện tranh và sách phát triển kỹ năng thực chiến, triển khai theo từng milestone trong `docs/29-development-roadmap.md`.

> **HKT Store — Thế giới Manga & Kho tàng kỹ năng thực chiến.**

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