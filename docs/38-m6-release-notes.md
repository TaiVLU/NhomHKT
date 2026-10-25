# M6 Release Notes

Release candidate: `m6-final` after Technical Lead approval.

## Added

- SEO Descriptor pipeline, metadata integration, robots policy, sitemap framework, structured data graph, and SEO regression suite.
- Product and book structured data migration through the SEO platform.
- Global structured data schemas and knowledge graph assembly.
- Inventory Movement boundary for manual adjustment, checkout consumption, and cancellation restoration.
- Deterministic local demo seed with customer, staff, and admin accounts.
- M6 demo seed validation for catalog, snapshots, accounts, inventory ledger, and ledger reconstruction.
- Local demo readiness guide.

## Changed

- Checkout stock consumption and cancellation restoration now append ledger movements atomically.
- Cart remains non-reserving and does not create speculative inventory movements.
- Product publication UI sends `primaryCategoryId` and `publicationState` explicitly.
- Public catalog fetches avoid stale cache during local admin publish/deactivate demonstrations.
- Homepage heading font stack was adjusted to preserve natural Vietnamese spacing.
- Local fake upload URLs fall back safely to the book placeholder image.

## Fixed

- Inventory Ledger completeness gap from M6.2 audit.
- Admin product publish/deactivate reliability.
- Browser console noise from fake image URLs.
- Homepage hero typography defect in `the gioi` phrase.
- Demo admin account reproducibility.

## Not Included

- Public deployment.
- AI chatbot, recommendations, or semantic search.
- Full admin dashboard metrics.
- Wishlist/favorites.
- User/role management UI.
