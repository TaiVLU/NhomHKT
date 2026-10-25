# M6.0B-3 Seed, Demo Data & Operational Hygiene

M7.5D clarification: repeated demo seed runs preserve all non-seed inventory movement deltas (including real checkout and approved Admin adjustment ledger entries). The deterministic seed baseline is reconciled with those deltas; it must never reset on-hand stock independently of retained ledger history.

## Seed Architecture

RoSach separates seed responsibilities into:

- Base/reference seed: `apps/api/src/seed/demo-seed.ts` `seedReferenceData()`.
- Demo catalog seed: `apps/api/src/seed/demo-seed.ts` `seedDemoCatalog()`.
- Demo commerce seed: `apps/api/src/seed/demo-seed.ts` `seedDemoCommerce()`.
- Deterministic data definitions: `apps/api/src/seed/demo-data.ts`.
- Snapshot serialization: `apps/api/src/seed/order-snapshot.ts`.
- Post-seed validation: `apps/api/src/seed/validation.ts`.
- Scoped local cleanup: `apps/api/src/seed/legacy-cleanup.ts`.

The normal seed command is non-production and idempotent. It uses deterministic slugs,
SKUs, usernames, emails, and order numbers. It does not use timestamps or random values
as permanent logical keys.

## Commands

Run from the repository root:

```bash
npm run seed:demo -w @rosach/api
npm run catalog:seed-demo-users -w @rosach/api
npm run seed:validate -w @rosach/api
npm run seed:cleanup-local -w @rosach/api -- --confirm-local-cleanup
npm run catalog:contract-audit -w @rosach/api
```

`seed:demo` is safe for development/test databases and refuses `NODE_ENV=production`.
`catalog:seed-demo-users` aligns the local privileged accounts with the email-based Admin UI. It requires distinct valid `M3_DEMO_ADMIN_EMAIL` and `M3_DEMO_STAFF_EMAIL` values plus passwords from the untracked environment. It updates an account matched by username or email in place, preserving its ID and references; a split identity conflict fails closed instead of deleting or merging records.
`seed:cleanup-local` is destructive only inside the explicitly scoped legacy/test residue
set and requires `--confirm-local-cleanup`.

## Environment Safety

Seed cleanup prints the detected `NODE_ENV`, database host, and database name. Cleanup
refuses:

- `NODE_ENV=production`;
- unknown or non-local database hosts;
- database names that do not look like RoSach local/demo/test targets;
- missing `--confirm-local-cleanup`.

The cleanup command is not a production migration and must not be used for production
data repair.

## Demo Data Matrix

Catalog seed includes:

- eight user-facing Vietnamese categories: Văn học, Thiếu nhi, Kinh tế, Kỹ năng sống,
  Phát triển bản thân, Khoa học, Lịch sử, and Công nghệ thông tin;
- one inactive internal category;
- 8 synthetic demo authors and 4 synthetic demo publishers;
- 24 ACTIVE public products with distinct three-paragraph Vietnamese descriptions and four ordered owned local images each;
- 2 DRAFT, 2 INACTIVE, and 1 ARCHIVED lifecycle fixtures;
- regular-price, discounted, low-stock, out-of-stock, reserved-stock, and inactive-variant cases.

Every ACTIVE product has a non-null active primary category and a matching
`ProductCategory` relation. Non-ACTIVE products do not use Product `isActive` as a
lifecycle source of truth.

Commerce seed includes:

- demo customer `m6demo`;
- demo staff `m6staff`;
- one active cart;
- pending, confirmed, completed, and cancelled demo orders;
- complete immutable `OrderItem` snapshots.

Base M6 demo credentials are local-only fake values:

- `m6demo` / `M6Demo12345`
- `m6staff` / `M6Staff12345`

Do not reuse these credentials outside local/demo environments.

For current local privileged access, use `M3_DEMO_ADMIN_*` and `M3_DEMO_STAFF_*` from `apps/api/.env`, then run `catalog:seed-demo-users`. The tracked examples use `admin.rosach@gmail.com` and `staff.rosach@gmail.com` with placeholder passwords only. Re-running the command updates password hashes and role/status on the same identities without duplicates.

## Lifecycle Rule

`Product.publicationState` is the source of truth. `Product.isActive` is a deprecated
compatibility mirror derived from `publicationState`.

```text
publicationState -> Product.isActive
```

Seeds, fixtures, and cleanup scripts must not infer lifecycle from `isActive`.

## Snapshot Rule

Order history is snapshot-first. New seeded `OrderItem` rows store complete immutable
snapshots for product title, slug, variant, SKU, prices, category, authors, publisher,
and line totals. Historical orders must remain valid after current catalog records are
renamed, changed, or deleted.

Author snapshot semantics:

- `NULL`: historical value unknown or unrecoverable;
- `[]`: deterministically no authors.

Normal demo orders use deterministic JSON array strings for known authors.

## Cleanup Scope

Local cleanup remediates only bounded legacy/test residue identities and prefixes listed in
`apps/api/src/seed/legacy-cleanup.ts`. This includes timestamp-independent Cart, Checkout,
M3 UI, Inventory, and M6 E2E fixtures plus bounded M3/M6 author and publisher prefixes and the superseded M5A public catalog. Cleanup
downgrades matching public products to DRAFT, clears the compatibility mirror and primary
category assignment, and deactivates matched technical taxonomy. Referenced rows are not
deleted.

The cleanup does not delete arbitrary user data and does not perform a broad reset. Test
teardown also deactivates fixture products/categories/authors/publishers before graph deletion, so a later
teardown failure does not leave a publicly visible record.

Public taxonomy reads require a linked ACTIVE, non-deleted product with an active variant. An active orphan taxonomy row therefore cannot become public merely because an interrupted test failed before cleanup.

M7.5A Admin classification views use the same data-hygiene boundary operationally: the default Hoạt động view excludes inactive/deleted records and recognized technical fixture identities; Đã ẩn / QA and Tất cả are explicit audit views. This is a UI containment layer only. The bounded cleanup command and `seed:validate` remain the authoritative local remediation/validation path, and no raw deletion is used for fixture history.

## Demo Product Image Manifest

Every approved public product owns four deterministic PNG paths under
`apps/web/public/product-images/<product-slug>/`: `cover.png`, `back-cover.png`,
`preview-01.png`, and `preview-02.png`. The typed manifest in `demo-data.ts` controls role,
order, primary selection, path, and alt text. `seed:validate` blocks a missing primary,
fewer than four owned gallery rows, bounded QA taxonomy, unapproved active demo taxonomy,
descriptions below 400 characters, or descriptions without paragraph breaks.

From `apps/api`, `npx tsx src/scripts/generate-demo-product-images.ts` rebuilds the neutral synthetic placeholders with
the existing repository toolchain. It is not part of normal seed execution and must not be
run after manual artwork replacement unless overwriting all generated placeholders is intended.

## Expected Audit Output

After cleanup and seed validation, blocking data-quality checks should be zero:

```json
{
  "activeProductsWithoutValidPrimaryCategory": "0",
  "orderItemsMissingMandatorySnapshots": "0",
  "invalidPublicationStateValues": "0",
  "productIsActiveMirrorMismatches": "0",
  "malformedAuthorSnapshotJson": "0"
}
```

`npm run seed:validate -w @rosach/api` exits non-zero when a blocking invariant fails.

## Recovery

For local/demo databases:

1. Run the scoped cleanup command if legacy invalid rows exist.
2. Run `seed:demo`.
3. Run `seed:demo` a second time to verify idempotency.
4. Run `seed:validate` and `catalog:contract-audit`.

If cleanup refuses the target, verify `DATABASE_URL` points to a local RoSach development,
demo, or test database before retrying.

## Known Limitations

### M7.4E reporting fixtures

Four `M7E-DEMO-*` completed orders supplement, but never replace, the existing four M6 demo orders. They use fixed order numbers, fixed 2026-06/2026-07 timestamps and normal immutable item snapshots to demonstrate multiple recognized dates and equal-duration comparison periods. Re-running `seed:demo` remains idempotent and does not rewrite their creation timestamps after creation.


- The seed is not a full database reset.
- It does not create payment gateway, shipping-provider, promotion, or coupon data.
- API error-code registry consolidation remains planned for M6.0C.
- Legacy fallback order snapshots are tested separately and are not part of normal demo
  seed data.
- Integration tests still use the configured local SQL Server database. A dedicated test
  database is an infrastructure follow-up; guarded cleanup and blocking validation are the
  current bounded containment controls.
