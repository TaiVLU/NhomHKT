# Deployment Guide

M6 closure boundary: RoSach is local-only. This document is a future deployment planning note and is not evidence of an active public deployment, public domain, DNS, SSL, or production monitoring setup.

## Development

- Next.js local.
- Express local.
- SQL Server local.
- `.env.development`.

## Production khuyến nghị

- Frontend: Vercel.
- Backend: Render/Railway/VPS.
- Database: Azure SQL hoặc SQL Server cùng VPS/private network.
- Domain trỏ vào frontend.
- API dùng subdomain, ví dụ `api.rosach...`.

## Cảnh báo

Không mở SQL Server trên máy cá nhân trực tiếp ra Internet nếu chưa có:
- firewall;
- IP allowlist;
- TLS/VPN;
- backup;
- uptime;
- giám sát.

## Production checklist

- env riêng;
- HTTPS;
- CORS đúng domain;
- migration;
- seed demo riêng;
- backup;
- health check;
- logging;
- cron/job cho payment expiry;
- smoke test;
- rollback plan.
