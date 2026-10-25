# M7.4C-D2 Public Catalog Content, Image Gallery and Filter UX Report

## Executive result

M7.4C-D2 closes the remaining public demo-catalog presentation defects without changing the database schema, migrations, Commerce Core, chatbot contract, Typebot flow, CORS, or package set. The canonical local dataset remains 24 synthetic Vietnamese books, eight approved categories, eight approved authors, and four approved publishers.

## Root cause and bounded correction

- Interrupted M3 UI and M6 E2E catalog exercises had left four active technical authors and four active technical publishers. D1 cleanup covered products, categories, and superseded named taxonomy but did not include the timestamped author/publisher prefixes.
- Public taxonomy endpoints returned every active record even when it had no link to a public, active, sellable product.
- D1 intentionally provided one category-level primary cover per book. Product detail already exposed a thumbnail strip but had no complete ordered gallery dataset, previous/next controls, or keyboard behavior.
- The desktop filter panel was sticky but could exceed the viewport, hiding lower fields and actions.
- D1 descriptions were substantial enough for data hygiene but remained single-paragraph template copy.

The correction adds bounded author/publisher cleanup prefixes, tightens public taxonomy eligibility to a public product relation, creates four repository-owned images for every approved product, implements an accessible gallery, makes desktop filters internally scrollable with persistent actions, and replaces all 24 descriptions with distinct three-paragraph editorial copy.

## Taxonomy hygiene

Guarded cleanup recognizes only these added author/publisher slug families:

- `m3-ui-author`, `m6-e2e-author-*`;
- `m3-ui-publisher`, `m6-e2e-publisher-*`.

Matched rows are deactivated, not deleted. The local correction deactivated four authors and four publishers. Public category/author/publisher endpoints now require at least one linked product that is ACTIVE, not deleted, mirrors `isActive=true`, and has an active variant. Admin taxonomy behavior is unchanged.

`seed:validate` now blocks visible bounded QA authors/publishers and any active local-demo author or publisher outside the approved seed lists. Tests deliberately insert bounded technical taxonomy, prove validation blocks it, prove it is absent from the public read surface, and then prove cleanup deactivates it.

## Image manifest and lifecycle

The typed seed manifest defines four ordered roles for every approved product:

| Order | Role | File |
|---:|---|---|
| 0 | Primary cover | `cover.png` |
| 1 | Back cover | `back-cover.png` |
| 2 | Preview page | `preview-01.png` |
| 3 | Preview page | `preview-02.png` |

Assets live at `apps/web/public/product-images/<product-slug>/`. The repository contains 24 directories and 96 PNG files. The generator uses synthetic titles, approved synthetic author names, neutral layout, and original placeholder copy; it does not reproduce copyrighted cover art or book pages.

Seed reruns upsert stable `rosach-demo/<slug>[/<role>]` public IDs, preserve one primary image, and update order and Vietnamese alt text without duplicating rows. Proven old `m6-demo/open-library/` image rows attached to canonical products are removed by the seed; unrelated uploaded images are not broadly deleted. Product list, detail, Open Graph, JSON-LD, and chatbot continue to consume the same ordered ProductImage/Catalog read model.

### Manual replacement workflow

To replace a synthetic placeholder with approved real artwork:

1. Confirm usage rights and prepare PNG, JPEG, or WebP using the existing image policy.
2. Keep the stable role filename and directory, for example `apps/web/public/product-images/mua-gio-qua-pho-nho/cover.png`.
3. Use 600×900px or a larger 2:3 equivalent. Keep each file below the existing 5 MiB upload limit and optimize it before committing it.
4. Update the typed manifest only if the file extension, role, order, or alt text changes.
5. Run the image generator only when intentionally rebuilding the synthetic placeholder set; it overwrites all 96 generated files.
6. Run `seed:demo`, `seed:validate`, the focused web tests, SEO regression, and a desktop/mobile visual check.
7. Verify list primary image, gallery ordering, Open Graph/JSON-LD canonical image, and chatbot absolute image URL.

## Gallery behavior

- The primary image initializes from the ProductImage whose URL matches the read-model primary image.
- Duplicate ID/URL candidates are filtered while preserving API order.
- Thumbnail buttons expose a pressed/current state and meaningful labels.
- Previous/next buttons wrap around and show the current position.
- Left/right arrow keys work while focus is inside the gallery.
- A one-image product has no inactive navigation UI; a missing image continues to use the existing safe placeholder.
- Desktop and mobile use the same component, responsive thumbnail strip, focus styles, and public-safe alt text.

## Catalog filter UX

The desktop sidebar remains sticky under the site header. Its summary stays fixed, filter fields scroll within `calc(100vh - 112px)`, and the Apply/Clear action row remains visible at the bottom. This change is scoped to `.catalog-sidebar`; the existing mobile filter drawer retains its own scrolling behavior and query semantics.

## Product descriptions

- All 24 public books have unique Vietnamese short descriptions between 80 and 160 characters.
- Full descriptions contain exactly three source paragraphs and currently measure 547–632 characters.
- Copy is synthetic and title-specific, covering subject, structure, and intended reading use without factual claims about real books.
- Product detail labels the section `Mô tả sản phẩm`, preserves paragraph breaks through React Markdown, skips raw HTML, applies sanitization, and constrains reading width and spacing.

## Verification and tests

Automated coverage includes:

- seed bounds, text lengths, paragraph count, four-image manifest, one primary, stable order, unique alt text, and physical file existence;
- bounded QA author/publisher validation, public exclusion, and safe cleanup;
- public taxonomy relation eligibility;
- gallery thumbnails, previous/next, keyboard movement, wrap-safe state, and single-image behavior;
- existing ProductImage fallback, catalog filter, Product/Book JSON-LD, Open Graph, sitemap, chatbot, Cart, Checkout, and Order regressions through the full suites.

Runtime verification records desktop and mobile catalog/product behavior, public taxonomy content, owned image responses, gallery interaction, filter scrolling/actions, description formatting, console errors, and failed requests.

### Local runtime evidence

- API health and `/san-pham` both returned HTTP 200 before browser verification.
- Chromium desktop at 1440×900 showed 24 products, exactly eight approved categories, eight approved authors, four approved publishers, and no M3/M6/E2E taxonomy labels.
- Once sticky, the desktop filter top was 96px; its field region measured 680px client height against 958px scroll height with `overflow-y:auto`; the action footer ended at 887.6px inside the 900px viewport. Selecting `Bùi Thanh Tùng` and applying the form produced the canonical filtered URL and four results.
- Chromium mobile at 390×844 hid the desktop sidebar and opened the existing bounded filter drawer with the same clean taxonomy.
- Product detail exposed four thumbnails. Next-button and ArrowLeft interaction updated the main alt text, selected thumbnail, and `1/4`–`2/4` position consistently. Mobile rendered a 343px gallery, horizontally scrollable thumbnails, and a 311px description section with three paragraphs.
- All inspected gallery images completed with non-zero natural width. No browser console error occurred. Development mode emitted one non-blocking Next.js LCP advisory for the cover URL because the same asset also appears in the thumbnail strip; production build completed successfully and the primary main image already requests eager loading.
- A UTF-8 `POST /api/v1/chatbot/search` for `sách thiếu nhi` returned HTTP 200, `PRODUCT_BY_CATEGORY`, three clean products, public-safe price/availability, absolute `http://localhost:3000/sach/...` and `/product-images/.../cover.png` URLs, and no internal ID or QA field. Public taxonomy APIs returned 8 authors and 4 publishers with no technical label.

## Quality gates

- `npm run format:check`: PASS.
- API and Web workspace lint: PASS; the image generator is inside API `src` and is covered by the API lint command.
- `npm run type-check`: PASS for API, Web, and Shared.
- API full test suite: PASS, 24 files / 168 tests.
- Web full test suite: PASS, 43 files / 210 tests.
- Shared suite: PASS, 1 file / 1 test (379 total tests).
- SEO regression: PASS, 9 files / 48 tests.
- `npm run seed:validate -w @rosach/api`: PASS with `blocking=false` and every blocker count at zero after the test suites.
- `npm run build`: PASS for Prisma generation, API TypeScript, Next.js 16.2.10 Turbopack production build, and Shared TypeScript.
- `git diff --check`: PASS; only the repository's existing Windows LF/CRLF conversion warnings were printed.

## Scope limits

- No package, schema, migration, Commerce Core, chatbot response contract, Typebot flow/widget, global CORS, dashboard, deployment, commit, or push change.
- Assets are synthetic demo placeholders, not production publishing artwork.
- The existing SQL Server database remains the configured integration-test target; safe-first teardown and guarded validation contain interrupted-run residue, while an isolated test database remains infrastructure follow-up.
