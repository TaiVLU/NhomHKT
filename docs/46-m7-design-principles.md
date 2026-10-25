# M7 Design Principles

Status: APPROVED BASELINE FOR M7 IMPLEMENTATION

## Purpose

M7 improves the user-facing experience of RoSach without changing the approved Commerce Core. The milestone should make the local graduation demo feel clearer, calmer, and more helpful while preserving the business architecture closed in M6.

## Product Philosophy

RoSach is a local-first graduation bookstore application. It should feel like a real, trustworthy bookstore, not an engineering test harness. UX improvements should therefore prioritize:

- clear customer guidance;
- stable commerce behavior;
- readable Vietnamese content;
- consistent visual language;
- accessible interactions;
- predictable local demo flows.

## AI Principle

AI in M7 is an AI Receptionist.

It may help customers:

- understand RoSach;
- find books;
- learn how to buy;
- read FAQ and policy guidance;
- receive non-transactional recommendations based on visible catalog data.

It must not:

- create orders;
- change cart, checkout, inventory, price, user, or order data;
- act as an autonomous workflow agent;
- bypass API authorization;
- invent unsupported business facts.

## Commerce Core Boundary

The following M6 architecture decisions remain locked:

- Catalog Read Model = Current State Projection.
- Order Snapshot = Historical Source of Truth.
- Product.primaryCategoryId = Primary Category Authority.
- Inventory Movement Boundary = Owner of Stock Mutation.
- Inventory Ledger = Complete Stock Movement History.
- AppError = Standard Error Contract.
- Cart = Non-Reserving.
- Checkout = Final Validation Boundary.
- Orders = Historical Business Record.

M7 UI polish may improve presentation and content, but it must not weaken or replace these decisions.

## Website Polish Principle

Website polish is not redesign.

Allowed work:

- typography correction;
- spacing and wrapping correction;
- component consistency;
- responsive refinement;
- loading, empty, error, dialog, and toast polish;
- accessibility improvements;
- demo content cleanup;
- stable local image fallback;
- documentation and tests.

Not allowed without Technical Lead approval:

- new commerce features;
- new database schema;
- new API contract;
- new checkout/inventory/order behavior;
- public deployment configuration;
- AI chatbot implementation before its implementation milestone.

## Design Language

The established RoSach language remains:

- editorial bookstore tone;
- warm paper background;
- burgundy primary accent;
- serif display headings;
- sans-serif body and controls;
- calm card surfaces;
- clear commerce states;
- Vietnamese-first wording.

Changes should make the existing language more consistent, not replace it.

## UX Priority Order

1. Prevent customer confusion.
2. Preserve commerce correctness.
3. Make local demo data feel real.
4. Improve readability and responsive behavior.
5. Improve accessibility.
6. Improve visual consistency.
7. Document deferred scope honestly.

## Content Principle

Public-facing demo data should not expose milestone names, test names, or implementation language. It should use customer-facing book titles, categories, authors, publishers, descriptions, alt text, and metadata.

Internal implementation identifiers may remain unchanged when changing them would affect architecture, contracts, or historical data.

## Accessibility Principle

Every interactive change should remain usable with:

- Tab;
- Shift+Tab;
- Enter;
- Space;
- Escape where a dialog or drawer is present;
- visible focus;
- meaningful labels;
- non-empty image alt text unless the image is genuinely decorative.

## Local-Only Principle

RoSach remains local-only during M7 planning and M7.1 polish:

- Web: `http://localhost:3000`
- API: `http://127.0.0.1:4000/api/v1`
- Database: local SQL Server through Prisma

No public domain, DNS, SSL, hosting, public monitoring, or production secret setup belongs to M7.1.
