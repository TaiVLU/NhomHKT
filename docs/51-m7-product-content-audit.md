# M7.1A Product Image and Content Audit

Status: AUDIT ONLY

## Data Source

Runtime source:

- `GET http://127.0.0.1:4000/api/v1/products?pageSize=100`
- `GET http://127.0.0.1:4000/api/v1/categories`
- `GET http://127.0.0.1:4000/api/v1/authors`
- `GET http://127.0.0.1:4000/api/v1/publishers`

Summary from local API:

- Public products returned: 30
- Products without primary image: 7
- Purchasable products: 5
- Out-of-stock products: 25
- Short description present: 30/30
- Long description present: 30/30
- Several demo/test taxonomy records are visible in taxonomy API responses.

## Product Image Audit

| Product | Slug | Image | Alt text | Ratio/display | Notes |
|---|---|---:|---:|---|---|
| M6 Demo Optional Metadata Missing | `m6-demo-optional-metadata-missing` | WARN | WARN | Placeholder 3:4 | No primary image |
| M6 Demo Multi Author Edition | `m6-demo-multi-author-edition` | WARN | WARN | Placeholder 3:4 | No primary image |
| M6 Demo Out Of Stock Visible | `m6-demo-out-of-stock-visible` | WARN | WARN | Placeholder 3:4 | No primary image |
| M6 Demo Low Stock | `m6-demo-low-stock` | WARN | WARN | Placeholder 3:4 | No primary image |
| M6 Demo Discounted In Stock | `m6-demo-discounted-in-stock` | WARN | PASS | 3:4 crop | Open Library returned `1px` image in runtime audit |
| M6 Demo Regular In Stock | `m6-demo-regular-in-stock` | WARN | PASS | 3:4 crop | One gallery image good; ISBN cover URL returned `1px` for variant image |
| Sense and Sensibility | `sense-and-sensibility` | WARN | WARN | Placeholder 3:4 | No primary image |
| The Iliad | `the-iliad` | PASS | PASS | 3:4 crop | Open Library cover |
| Harry Potter and the Chamber of Secrets | `harry-potter-chamber-of-secrets` | PASS | PASS | 3:4 crop | Open Library cover |
| Harry Potter and the Sorcerers Stone | `harry-potter-sorcerers-stone` | PASS | PASS | 3:4 crop | Open Library cover |
| The Little Prince | `the-little-prince` | PASS | PASS | 3:4 crop | Open Library cover |
| The Demon-Haunted World | `the-demon-haunted-world` | PASS | PASS | 3:4 crop | Open Library cover |
| A Brief History of Time | `a-brief-history-of-time` | PASS | PASS | 3:4 crop | Open Library cover |
| Cosmos | `cosmos-carl-sagan` | PASS | PASS | 3:4 crop | Open Library cover |
| Good Strategy Bad Strategy | `good-strategy-bad-strategy` | WARN | WARN | Placeholder 3:4 | No primary image |
| The Lean Startup | `the-lean-startup` | PASS | PASS | 3:4 crop | Open Library cover |
| Zero to One | `zero-to-one` | PASS | PASS | 3:4 crop | Open Library cover |
| 21 Lessons for the 21st Century | `21-lessons-for-the-21st-century` | PASS | PASS | 3:4 crop | Open Library cover |
| Homo Deus | `homo-deus` | PASS | PASS | 3:4 crop | Open Library cover |
| Sapiens | `sapiens-yuval-noah-harari` | PASS | PASS | 3:4 crop | Open Library cover |
| The Art of War | `the-art-of-war` | WARN | WARN | Placeholder 3:4 | No primary image |
| Atomic Habits | `atomic-habits` | PASS | PASS | 3:4 crop | Open Library cover |
| Meditations | `meditations-marcus-aurelius` | PASS | PASS | 3:4 crop | Open Library cover |
| The Republic | `the-republic-plato` | PASS | PASS | 3:4 crop | Open Library cover |
| The Odyssey | `the-odyssey` | PASS | PASS | 3:4 crop | Open Library cover |
| Frankenstein | `frankenstein-mary-shelley` | PASS | PASS | 3:4 crop | Open Library cover |
| Moby Dick | `moby-dick` | PASS | PASS | 3:4 crop | Open Library cover |
| Pride and Prejudice | `pride-and-prejudice` | PASS | PASS | 3:4 crop | Open Library cover |
| Animal Farm | `animal-farm-george-orwell` | PASS | PASS | 3:4 crop | Open Library cover |
| 1984 | `1984-george-orwell` | PASS | PASS | 3:4 crop | Open Library cover |

Image findings:

- `ProductImage` preserves cover ratio with `object-fit: cover`.
- Placeholder fallback exists and renders at 3:4.
- Runtime showed no broken rendered images after fallback behavior.
- Several Open Library responses returned natural width `1`, which is technically loaded but poor visual content.
- Above-fold product detail image triggers a Next dev LCP warning.
- Thumbnail images in product detail intentionally use empty `alt` inside labeled buttons; acceptable if the button label remains complete.

## Product Content Audit

| Product | Category | Author | Publisher | Price | Stock | Content status |
|---|---|---|---|---:|---:|---|
| M6 Demo Optional Metadata Missing | M6 Demo Tong Hop | Missing | Missing | 99,000 | 2 | WARN: synthetic name, missing author/publisher |
| M6 Demo Multi Author Edition | M6 Demo Thieu Nhi | M6 demo authors | M6 Demo RoSach Select | 120,000 | 12 | WARN: synthetic content |
| M6 Demo Out Of Stock Visible | M6 Demo Van Hoc | M6 Demo Mary Shelley | M6 Demo Penguin Classics | 140,000 | 0 | WARN: synthetic content, out of stock |
| M6 Demo Low Stock | M6 Demo Khoa Hoc | M6 Demo Carl Sagan | M6 Demo Science House | 198,000 | 2 | WARN: synthetic content |
| M6 Demo Discounted In Stock | M6 Demo Kinh Doanh | M6 Demo James Clear | M6 Demo RoSach Select | 199,000 | 20 | WARN: synthetic content |
| M6 Demo Regular In Stock | M6 Demo Van Hoc | M6 Demo George Orwell | M6 Demo Penguin Classics | 180,000 | 12 | WARN: synthetic content |
| Sense and Sensibility | Van hoc kinh dien | Jane Austen | Penguin Classics | 165,000 | 0 | WARN: no image, no stock |
| The Iliad | Lich su | Homer | Penguin Classics | 174,000 | 0 | WARN: no stock |
| Harry Potter and the Chamber of Secrets | Thieu nhi | J. K. Rowling | RoSach Select | 270,000 | 0 | WARN: no stock |
| Harry Potter and the Sorcerers Stone | Thieu nhi | J. K. Rowling | RoSach Select | 239,000 | 0 | WARN: missing apostrophe in title, no stock |
| The Little Prince | Thieu nhi | Antoine de Saint-Exupery | RoSach Select | 89,000 | 0 | WARN: no stock |
| The Demon-Haunted World | Khoa hoc pho thong | Carl Sagan | Bantam Books | 213,000 | 0 | WARN: no stock |
| A Brief History of Time | Khoa hoc pho thong | Stephen Hawking | Bantam Books | 230,000 | 0 | WARN: no stock |
| Cosmos | Khoa hoc pho thong | Carl Sagan | Bantam Books | 221,000 | 0 | WARN: no stock |
| Good Strategy Bad Strategy | Kinh doanh | Peter Thiel | Crown Business | 260,000 | 0 | WARN: no image, no stock |
| The Lean Startup | Kinh doanh | Eric Ries | Crown Business | 204,000 | 0 | WARN: no stock |
| Zero to One | Kinh doanh | Peter Thiel | Crown Business | 187,000 | 0 | WARN: no stock |
| 21 Lessons for the 21st Century | Lich su | Yuval Noah Harari | Vintage Books | 229,000 | 0 | WARN: no stock |
| Homo Deus | Lich su | Yuval Noah Harari | Vintage Books | 285,000 | 0 | WARN: no stock |
| Sapiens | Lich su | Yuval Noah Harari | Vintage Books | 238,000 | 0 | WARN: no stock |
| The Art of War | Tu duy song | Sun Tzu | RoSach Select | 125,000 | 0 | WARN: no image, no stock |
| Atomic Habits | Tu duy song | James Clear | Avery | 205,000 | 0 | WARN: no stock |
| Meditations | Tu duy song | Marcus Aurelius | Penguin Classics | 136,000 | 0 | WARN: no stock |
| The Republic | Tu duy song | Plato | Penguin Classics | 180,000 | 0 | WARN: no stock |
| The Odyssey | Van hoc kinh dien | Homer | Penguin Classics | 175,000 | 0 | WARN: no stock |
| Frankenstein | Van hoc kinh dien | Mary Shelley | Penguin Classics | 125,000 | 0 | WARN: no stock |
| Moby Dick | Van hoc kinh dien | Herman Melville | Penguin Classics | 210,000 | 0 | WARN: no stock |
| Pride and Prejudice | Van hoc kinh dien | Jane Austen | Penguin Classics | 129,000 | 0 | WARN: no stock |
| Animal Farm | Van hoc kinh dien | George Orwell | Penguin Classics | 138,000 | 0 | WARN: no stock |
| 1984 | Van hoc kinh dien | George Orwell | Penguin Classics | 149,000 | 0 | WARN: no stock |

## Content Quality Findings

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| High | Demo names leak into public catalog | `M6 Demo...`, `M6 E2E...`, `Cart Category...` taxonomy visible in public API | Create curated local demo content cleanup plan |
| High | Catalog feels mostly unavailable | 25/30 products are out of stock | Improve demo inventory distribution later |
| High | 7/30 products lack primary images | Runtime API and rendered placeholders | Add stable owned cover assets in approved content milestone |
| Medium | Some metadata is synthetic | Descriptions contain `Demo record for M6 seed...` | Replace with customer-facing copy |
| Medium | Some titles are not editorially polished | `Harry Potter and the Sorcerers Stone` missing apostrophe | Content QA pass |
| Medium | Category/author/publisher naming lacks Vietnamese accents in many records | `Van hoc`, `Khoa hoc`, `Thieu nhi`, `Lich su` | Vietnamese content normalization pass |

## Overall Product Content Rating

Score: 6.5/10.

Conclusion: frontend rendering is functional, but content and image quality should be a major M7.1B planning input.

## M7.1B Resolution

Original findings are preserved above. M7.1B resolution status:

| Finding | Status | Change performed | Code files | Test/runtime evidence | Remaining limitation |
|---|---|---|---|---|---|
| Demo names leak into public catalog | FIXED | Replaced visible M6 demo category/author/publisher/product names and public descriptions with customer-facing bookstore content. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts`, `apps/api/test/seed.integration.test.ts` | `npm run seed -w @rosach/api`; seed validation passed; public API returned curated active demo products. | Stable slugs/SKUs/order numbers intentionally remain deterministic. |
| Catalog feels mostly unavailable | PARTIALLY FIXED | Preserved existing inventory behavior and demo checkout products; did not inflate stock just to improve visual ratio. | `apps/api/src/seed/demo-data.ts`, `apps/api/src/seed/demo-seed.ts` | Post-M7.1B public API metrics: 30 public products, 5 purchasable, 25 out of stock, 16.7% purchasable. Demo checkout products are available. | F04 remains PARTIALLY FIXED because most imported catalog products remain out of stock. |
| 7/30 products lack primary images | PARTIALLY FIXED | Kept stable internal placeholder and hardened fallback for missing/fake/1px remote images. | `apps/web/features/catalog/product-image.tsx`, `apps/web/features/catalog/product-card.test.tsx` | Product-card fallback tests passed; runtime loaded catalog image check showed 0 complete Open Library 1px images displayed. | 7 products still use placeholder; owned/local cover asset production strategy deferred. |
| Some metadata is synthetic | FIXED | Replaced demo fallback descriptions and SEO descriptions with customer-facing Vietnamese copy. | `apps/api/src/seed/demo-seed.ts` | Seed validation passed; API response showed natural Vietnamese descriptions. | Non-demo imported records may still need editorial QA later. |
| Some titles are not editorially polished | DEFERRED | Did not rewrite imported catalog titles beyond approved demo data cleanup. | No source change | Scope compliance: no broad content migration performed. | Imported title/content QA remains future content work. |
| Category/author/publisher naming lacks Vietnamese accents in many records | PARTIALLY FIXED | Curated deterministic demo taxonomy names with Vietnamese accents. | `apps/api/src/seed/demo-data.ts` | Public API returned demo taxonomy names such as `Văn học`, `Khoa học`, `Thiếu nhi`. | Older imported taxonomy records may still be ASCII; broader content normalization deferred. |

### Product Data After M7.1B

Source: local API after `npm run seed -w @rosach/api` and `npm run seed:validate -w @rosach/api`.

| Metric | Value |
|---|---:|
| Total public products | 30 |
| Products with valid primary image URL | 23 |
| Products using placeholder | 7 |
| Products still using Open Library URLs | 23 |
| Open Library 1px images actually displayed after runtime fallback | 0 |
| Purchasable products | 5 |
| Out-of-stock products | 25 |
| Purchasable ratio | 16.7% |

The low purchasable ratio is accepted for M7.1B because this milestone must not change inventory business rules only to improve presentation metrics. The local demo still has enough checkout coverage through `m6-demo-regular-in-stock`, `m6-demo-discounted-in-stock`, `m6-demo-low-stock`, `m6-demo-multi-author-edition`, and `m6-demo-optional-metadata-missing`.
