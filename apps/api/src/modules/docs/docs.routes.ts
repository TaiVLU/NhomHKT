import { Router } from 'express';
import type { Request, Response } from 'express';
import { OPENAPI_SPEC } from './openapi.js';

const docsHtml = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HKT Store API documentation</title>
<style>body{max-width:960px;margin:3rem auto;padding:0 1.5rem;font:16px/1.6 system-ui,sans-serif;color:#272321;background:#fbf7f0}h1,h2{font-family:Georgia,serif;color:#541727}code{background:#f3ebe1;padding:.15rem .35rem;border-radius:4px}a{color:#7a263a;font-weight:700}.notice{padding:1rem;border:1px solid #e3d8cb;border-radius:12px;background:#fffdfa}</style>
</head><body><h1>HKT Store API v1</h1><p class="notice">Tài liệu chỉ đọc. Không có token, mật khẩu mẫu hoặc secret. Mọi BIGINT ID trong JSON là <code>string</code>, không phải JavaScript number.</p><p><a href="/docs/openapi.json">Tải OpenAPI 3.1 JSON</a> · <a href="/api/v1/health">Health</a> · <code>/api/v1/diagnostics</code> (Admin-only)</p><h2>Modules</h2><ul><li>Health (public)</li><li>Auth</li><li>Account và Address (Bearer token)</li><li>Public Catalog (public)</li><li>Admin Catalog / Staff Catalog (Bearer token; Staff read-only)</li><li>Upload (Bearer token; PRODUCT_MANAGE)</li><li>Diagnostics (Bearer token; Admin API_DIAGNOSTICS)</li></ul><h2>Cách kiểm tra</h2><ol><li>Mở OpenAPI JSON bằng liên kết trên trong local API</li><li>Dùng health để xác nhận API/database</li><li>Dùng integration và smoke tests làm nguồn xác nhận endpoint thực sự hoạt động</li></ol></body></html>`;

export const createDocsRouter = (): Router => {
  const router = Router();
  router.get('/', (_request: Request, response: Response) => response.type('html').send(docsHtml));
  router.get('/openapi.json', (_request: Request, response: Response) => response.json(OPENAPI_SPEC));
  return router;
};