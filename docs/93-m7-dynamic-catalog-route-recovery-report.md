# M7.4C-W3A Dynamic Catalog Route Recovery Report

Status: dynamic public catalog routes restored and regression-protected; ready for Technical Lead review.

## Root cause

The reported state was reproduced before intervention: `/`, `/san-pham`, and `/danh-muc` returned HTTP 200 while two known product routes and two known category routes returned HTTP 404. At the same time, the corresponding product/category detail API calls returned HTTP 200 with the exact entities visible in list responses.

After stopping only RoSach API/web watchers, confirming ports 3000/4000 were free, and starting both services cleanly, every target dynamic route returned HTTP 200 without deleting `.next`, reseeding, or changing data. This proves the observed incident was a stale long-running Next development watcher/route state, not an API visibility, slug, database, ngrok, or chatbot-rate-limit failure.

Source inspection also found a separate latent false-404 path: the web catalog client trusted TypeScript casts and returned `undefined` when an HTTP 200 success envelope omitted or malformed `data`. A detail page would then treat that value like a genuine missing entity. W3A corrects this boundary so malformed success envelopes throw into the existing error boundary; only an actual upstream HTTP 404 returns `null` and reaches `notFound()`.

## Runtime and environment findings

- SQL Server listened on local port 1433 and the API health/catalog queries used the intended local database.
- API listened on `127.0.0.1:4000`.
- Web server components used `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` from the existing untracked `apps/web/.env.local`.
- List and dynamic pages import the same catalog client; there is no separate detail origin or response contract.
- Products use `/api/v1/products/:slug`; categories use `/api/v1/categories/:slug`.
- Known detail APIs returned the wrapped success contract; unknown slugs returned stable HTTP 404.
- No `.next` deletion or reseed was needed. The public database already contained exactly 24 approved products and 8 approved categories.

## List-to-detail consistency

Internal inspection compared list and detail IDs, names, and slugs for `du-lieu-ke-chuyen`, `luoc-su-nhung-phat-minh`, `thieu-nhi`, and `kinh-te`. Each pair referred to the same database entity. Rendered links were respectively `/sach/:slug` and `/danh-muc/:slug`; direct API detail responses were HTTP 200.

The API read boundary is consistent:

- product list and detail require public `ACTIVE`, non-deleted products with an active variant;
- category list/detail expose active, non-deleted taxonomy linked to public products under the established D2 policy;
- inactive/technical fixtures remain excluded;
- chatbot URLs use the same canonical `/sach/:slug` route.

## Corrections

No API query, visibility rule, schema, data, or route implementation changed. The frontend catalog client now validates the minimal success-envelope shape for product/category/taxonomy/list calls. A malformed HTTP 200 response raises a local client error and reaches the existing Next error boundary rather than becoming a false `notFound()`.

Focused tests cover known product/category envelopes and origin, genuine 404 versus upstream failure, malformed success envelopes, valid page rendering, genuine unknown slugs, metadata failure propagation, and API list/detail visibility consistency.

## HTTP route matrix

All 24 approved product routes returned HTTP 200:

`du-lieu-ke-chuyen`, `nhap-mon-lap-trinh-ben-vung`, `luoc-su-nhung-phat-minh`, `nhung-thanh-pho-ben-song`, `dong-chay-van-minh-viet`, `chuyen-cua-nhung-vi-sao`, `khoa-hoc-cua-giac-ngu`, `tap-trung-trong-the-gioi-on-ao`, `lam-viec-sau-moi-ngay`, `nghe-thuat-lang-nghe`, `mot-ngay-song-co-nhip`, `khoi-nghiep-tu-dieu-nho`, `ban-do-tai-chinh-ca-nhan`, `kinh-te-hoc-tu-quan-nho`, `hat-mam-dung-cam`, `chuyen-tau-den-dao-xanh`, `thu-vien-sau-con-mua`, `nhung-ngay-tren-doi-nang`, `so-tay-doc-sach-cham`, `khu-vuon-cua-may`, `can-phong-day-anh-sang`, `vu-tru-trong-tam-mat`, `tien-bo-mot-phan-tram`, and `mua-gio-qua-pho-nho`.

All approved categories returned HTTP 200 with the correct heading and only relevant products:

| Category | Products | Wrong-category products |
|---|---:|---:|
| `van-hoc` | 5 | 0 |
| `thieu-nhi` | 4 | 0 |
| `kinh-te` | 3 | 0 |
| `ky-nang-song` | 4 | 0 |
| `phat-trien-ban-than` | 3 | 0 |
| `khoa-hoc` | 4 | 0 |
| `lich-su` | 3 | 0 |
| `cong-nghe-thong-tin` | 2 | 0 |

Unknown product and category slugs remained HTTP 404.

## Browser verification

Desktop verification clicked five product cards and all eight category cards. Product pages showed the current heading, gallery, price/availability, and three description paragraphs. `can-phong-day-anh-sang` correctly rendered as temporarily out of stock rather than 404. Category pages showed the exact heading and expected product count.

Browser back/forward, dynamic-route reload, and direct URL paste retained valid pages. At 390x844, product and category detail rendered without horizontal overflow. Browser console contained no runtime error. Chatbot product navigation remains owned by W3; W3A did not modify Typebot flow.

## Database records changed

None. No reseed, raw SQL, deletion, or data mutation was used for route recovery.

## Scope verification

- package installed or package file changed: NO;
- schema or migration: NO;
- Commerce Core: NO;
- chatbot API contract: NO;
- Typebot workspace/flow: NO;
- dashboard implementation: NO;
- deployment: NO;
- commit: NO;
- push: NO.

## W3 readiness

Dynamic product/category routes and canonical chatbot product targets are operational again. W3 may continue after W3A quality gates pass.

## W3A quality gates

- `npm run format:check`: PASS;
- `npm run lint`: PASS for API, web, and shared;
- `npm run type-check`: PASS for API, web, and shared;
- focused API catalog smoke: PASS, 1 test;
- focused web dynamic-route/catalog-client tests: PASS, 5 files / 27 tests;
- `npm run test`: PASS, 401 tests total (173 API, 227 web, 1 shared);
- SEO regression: PASS, 9 files / 48 tests;
- `npm run seed:validate -w @rosach/api`: PASS with no blocking issue;
- `npm run build`: PASS, including Prisma Client generation, API/shared TypeScript, and Next 16.2.10 Turbopack production build;
- `git diff --check`: PASS.

RoSach web/API watchers were stopped before the root build to avoid Windows Prisma engine locks. Ngrok, SQL Server, Codex, and unrelated processes were not stopped. W3A closed before W3 workspace/authentication changes began.
