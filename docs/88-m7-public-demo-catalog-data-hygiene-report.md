# M7.4C-D1 Public Demo Catalog Data Hygiene Report

> M7.4C-D2 correction: the category-level single-cover limitation, residual M3/M6 author/publisher fixture leakage, single-paragraph copy, basic gallery, and desktop filter overflow described below are superseded by `docs/89-m7-public-catalog-gallery-filter-content-report.md`. D2 keeps the D1 catalog identity and history-preservation decisions while adding four ordered owned images per title and stricter public taxonomy eligibility.

## Executive result

M7.4C-D1 replaces the mixed local public catalog with one bounded, deterministic dataset of 24 Vietnamese-language books. The corrective pass is limited to seed/content hygiene, owned demo images, test-fixture teardown, guarded local cleanup, validation, tests, and documentation. It does not change the database schema, migrations, chatbot contract, Typebot flow, widget integration, or Commerce Core rules.

## Root cause

- The historical M5A catalog seed and the M6 demo seed were both active in the same local database. This produced 30 official records with two incompatible content styles; the M5A set used English titles, transliterated category labels, short technical descriptions, Open Library URLs, and three missing images.
- SQL Server integration tests read `apps/api/.env`, so they used the same `RoSachDb` instance as the local demo runtime. Cart and checkout fixtures were created as `ACTIVE`, assigned to active categories, and therefore satisfied the public catalog visibility predicates while a test was running.
- Normal `afterAll` teardown removes integration-test graphs, but interrupted prior runs left product/category shells. Timestamp-specific cleanup entries did not recognize later fixture timestamps.
- Public taxonomy APIs intentionally return every active, non-deleted taxonomy record. Residual active categories therefore appeared on the home page and `/danh-muc` even after fixture variants had been removed.
- The M6 catalog seeded remote covers only when `imageIsbn` was present. Most M6 products had no image, and the remote source remained an external availability dependency.

## Data classification before mutation

The read-only Prisma audit classified the local database as follows:

| Class | Count / evidence | Decision |
|---|---:|---|
| M5A official legacy demo products | 24 ACTIVE products, SKUs prefixed `M5A-`; no cart/order references | Superseded and deactivated, not deleted |
| M6 official demo products | 6 ACTIVE public products plus lifecycle fixtures; four public SKUs referenced by demo orders and one by the demo cart | Reused in place by SKU so Product/Variant IDs and commerce history remain intact |
| Leaked active QA products | 10 active Cart/Checkout fixture products; interrupted teardown had already removed their variants | Deactivated and detached from primary categories |
| Other recognized QA product shells | 18 already non-public Cart/Checkout/M3/Inventory records | Left non-public; matched by future guarded cleanup |
| Active QA/internal categories | 24 total over both cleanup passes, including Cart, Checkout, M6 E2E, M3 UI, old `m6-demo-*`, and `uncategorized` entries | Deactivated, not deleted |
| Superseded seeded authors/publishers | 23 authors and 9 publishers from the old M5A/M6 public sets | Deactivated after canonical products were reassigned |

No broad delete or raw SQL mutation was used. Cleanup inspected and preserved order, cart, variant, inventory, ledger, and snapshot references.

## Approved public dataset

- Exactly 24 ACTIVE public products.
- Eight active public categories: Văn học, Thiếu nhi, Kinh tế, Kỹ năng sống, Phát triển bản thân, Khoa học, Lịch sử, and Công nghệ thông tin.
- Synthetic, internally consistent Vietnamese titles, authors, publishers, summaries, descriptions, page counts, prices, and stock examples. No factual claims are attached to real books.
- Clean stable slugs and deterministic `M6D-*` SKUs.
- The six historical M6 product identities are reused through their stable SKUs; their clean titles/slugs/content can change without rewriting immutable order-item snapshots.
- One intentionally out-of-stock public record remains to demonstrate the approved public availability state. All public products have at least one active priced variant; 23 currently have positive available stock.

## Image policy

- Eight owned neutral RoSach PNG covers are stored in `apps/web/public/demo-covers`, one visual treatment per approved category.
- Every public product has a deterministic primary ProductImage URL under `/demo-covers/`, a PNG MIME type accepted by the existing SQL Server constraint, and title-specific Vietnamese alt text.
- Product list/detail rendering uses the same ProductImage DTO. Open Graph and Product/Book JSON-LD resolve the relative asset against the canonical site origin.
- Chatbot response fields keep the approved flattened contract; relative catalog image paths are resolved against the existing canonical origin before `productNImage` is returned.
- External image availability is no longer part of the public demo baseline. `/book-placeholder.svg` remains a true failure fallback.

## Content policy

- Public short descriptions must contain at least 70 characters in the seed contract test.
- Public full descriptions must contain at least 220 trimmed characters; the current dataset measures 355–374 characters per product.
- Public content is Vietnamese, contains no Cart/Checkout/Test/E2E fixture wording, and includes author, publisher, category, format, language, page count, price, stock state, and meaningful alt text.

## Fixture isolation and cleanup strategy

- Cart and checkout integration teardown now deactivates test products and categories before attempting graph deletion. If a later delete fails, the remaining record is non-public.
- Test graphs retain deterministic explicit teardown. A hard process kill cannot run hooks, so the guarded cleanup command now recognizes bounded Cart, Checkout, M3 UI, Inventory, and M6 E2E prefixes independently of timestamps.
- `seed:validate` blocks active QA products/categories, superseded M5A products, unapproved public category names, missing demo images, and demo descriptions below 220 characters.
- The old `catalog:seed-m5a-demo` entry point delegates to the canonical seed rather than recreating the retired dataset.
- Cleanup remains restricted to a recognized local/demo/test target and requires `--confirm-local-cleanup`.

## Local database correction

Commands executed against `127.0.0.1` / `RoSachDb`:

```bash
npm run seed:cleanup-local -- --confirm-local-cleanup
npm run seed:demo
npm run seed:cleanup-local -- --confirm-local-cleanup
npm run seed:validate
```

The first cleanup matched 52 product records, deactivated 10 active QA products and 24 active M5A products, and deactivated 23 categories, 23 authors, and 9 publishers. The second pass deactivated the remaining M3 UI category after its bounded prefix was added. The canonical seed then produced 24 public products and eight public categories with zero blocking validation issues.

## Public surface verification

- `/`, `/danh-muc`, `/danh-muc/van-hoc`, `/san-pham`, `/sach/mua-gio-qua-pho-nho`, `/sitemap.xml`, and `/demo-covers/van-hoc.png` returned HTTP 200 locally.
- `/san-pham` contained owned demo-cover URLs and Vietnamese alt text, with no Cart Category, Checkout fixture, M6 E2E, or M5A identifiers.
- Sitemap contained 24 canonical `/sach/` URLs and eight `/danh-muc/` URLs, with no QA or legacy demo URLs.
- Product detail emitted Product and Book JSON-LD with an absolute canonical cover URL and the full description.
- `POST /api/v1/chatbot/search` returned three clean public books for a Vietnamese literature query, with absolute product and image URLs and no internal IDs.

## Tests

- Added pure seed policy tests for exact catalog/category bounds, unique slugs, content minimums, image paths, active variants, price constraints, and QA naming exclusion.
- Added chatbot coverage for canonicalizing owned relative cover paths.
- Strengthened Cart and Checkout integration teardown to deactivate before delete.
- Existing seed integration and CatalogReadModel coverage continue to verify public lifecycle filtering and database invariants.

## Quality gates

Final sequential closure evidence:

- `npm run format:check`: PASS.
- `npm run lint`: PASS for API, Web, and Shared workspaces.
- `npm run type-check`: PASS for API, Web, and Shared workspaces.
- `npm run test`: PASS; API 24 files / 167 tests, Web 42 files / 208 tests, Shared 1 file / 1 test (376 total).
- SEO regression command from the approved M7 baseline: PASS, 9 files / 34 tests.
- `npm run build`: PASS; Prisma generation, API TypeScript build, Next.js 16.2.10 Turbopack production build, and Shared build completed.
- `git diff --check`: PASS; only the repository's existing Windows LF/CRLF warnings were printed.
- `npm run seed:validate -w @rosach/api`: PASS after the full test run, `blocking=false`, every blocker count `0`.

## Scope and limitations

- No schema, migration, package, Typebot workspace/flow, widget, chatbot response contract, Commerce Core, checkout/order/inventory history, dashboard, deployment, commit, or push change was made.
- Eight category-level covers are intentionally reused across books in the same category. Alt text remains title-specific; unique artwork per title is not required for this bounded correction.
- Integration tests still use the configured local SQL Server database because no isolated test database was provisioned in scope. Safe-first teardown, dynamic guarded cleanup, and blocking validation contain the risk; a hard-kill-proof isolated test database remains an infrastructure follow-up.
- The dataset is intended for local/demo environments. The owned asset URLs become public only when the existing web application is deployed under an approved site origin.
