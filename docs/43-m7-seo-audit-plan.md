# M7 SEO Audit Plan

## Goal

M7 should preserve the M6 SEO platform and improve content-level SEO quality.

Do not redesign the SEO Descriptor pipeline.

## Current SEO Baseline

Implemented:

- title;
- description;
- canonical;
- robots;
- Open Graph;
- Twitter Card;
- sitemap;
- `robots.txt`;
- structured data graph;
- product/book/offer/global schema support;
- route policy regression tests.

## Title Checklist

- Home title reflects brand.
- Catalog title targets book browsing.
- Category title includes category name.
- Product title includes book name and RoSach.
- Auth/account/cart/checkout titles remain noindex where appropriate.

## Description Checklist

- Home description explains RoSach.
- Catalog description is useful without keyword stuffing.
- Category description handles missing category copy gracefully.
- Product description uses real product data.
- No AI-generated descriptions should be published without human review.

## Canonical Checklist

- Clean catalog canonical is `/san-pham`.
- Query/search/filter pages remain canonicalized according to frozen policy.
- Product canonical is `/sach/[slug]`.
- Category canonical is `/danh-muc/[slug]`.
- No query string or fragment enters canonical URL.

## Robots Checklist

- Public routes: index/follow when content is meaningful.
- Catalog query states: noindex/follow according to policy.
- Cart, checkout, account, auth, admin, 404: noindex as already defined.
- Chatbot UI must not create indexable thin pages.

## Open Graph and Twitter Checklist

- Canonical URL matches OG URL.
- Canonical URL matches Twitter URL where applicable.
- Product image matches visible primary product image.
- Fallback image is local and safe.

## JSON-LD Checklist

- Product detail uses Product, Book, Offer, BreadcrumbList where supported.
- Collection pages use CollectionPage/ItemList only when content is meaningful.
- Do not add Review, AggregateRating, FAQPage, Event, VideoObject unless data exists.
- AI answers must not fabricate structured-data facts.

## Breadcrumb Checklist

- Product breadcrumb ends at canonical product URL.
- Category breadcrumb ends at canonical category URL.
- Breadcrumb text matches visible route hierarchy.

## Heading Checklist

- One clear H1 per public route.
- Product cards do not create confusing page-level heading structure.
- Chatbot window should not introduce SEO-important headings that compete with page content.

## Image SEO Checklist

- Product image alt text describes the book cover.
- Placeholder alt should not pretend to be a real cover.
- Avoid remote fake image URLs.
- Review LCP image priority after measuring product detail pages.

## URL Checklist

- Vietnamese public URLs remain stable and readable.
- Legacy `/san-pham/[slug]` redirect policy remains untouched.
- Chatbot product suggestions must link to canonical product URLs.

## Sitemap Checklist

- Only public canonical URLs.
- No private/auth/admin/checkout/cart/account URLs.
- No noindex URLs.
- No query strings or fragments.

## robots.txt Checklist

- Allows public catalog and product routes.
- Disallows private/admin/auth/transactional paths.
- Sitemap URL matches configured local/public origin policy.

## Internal Link Checklist

- Home links to catalog/category/product discovery.
- Product detail links to related books.
- Chatbot suggestions use normal links, not hidden navigation.
- Avoid orphaning important demo products.

## Acceptance Criteria

- Existing SEO regression tests remain green after M7 implementation.
- New chatbot UI does not alter metadata/canonical/robots output.
- Any AI-generated or AI-assisted content is reviewed before becoming indexable.
