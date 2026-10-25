# M7.5A Full System QA Plan

Status: M7.5A bounded audit and corrective-work plan.

## Baseline

M7.4E is the current approved implementation baseline. It includes the public catalog, product detail and gallery, cart, checkout, order history, Typebot integration, Admin/Staff authentication, the six-route Admin Operations Center, reporting APIs, catalog CRUD, taxonomy management, inventory reads, and deterministic local demo data.

M7.5A is limited to defect discovery plus the two authorized corrections:

1. recover the lower classification section of `/admin/catalog`;
2. make Admin route authorization and unauthorized behavior explicit and consistent.

No schema, migration, package, Commerce Core, historical order, chatbot contract, deployment, commit, or push is in scope.

## Audit coverage

- Authentication: register, login, logout, refresh, role boundaries, and session behavior.
- Public experience: home, catalog, categories, representative products, search/filter/pagination, and unknown slugs.
- Commerce: cart, checkout, order success/history, and existing authority boundaries.
- Typebot: public-only mounting, product links, no-results/failure behavior, and Admin exclusion.
- Admin: dashboard, revenue, product statistics, orders, catalog, inventory, responsive states, and Staff read-only behavior.
- Runtime/security/SEO: console and network failures, 401/403/404/429/500 boundaries, RBAC, PII exposure, metadata, structured data, robots, sitemap, and build regressions.

## Evidence rules

Every defect must have a route, file/component, test, command, or browser observation. Source hypotheses are labelled as risks until runtime evidence confirms them. Full-system findings outside the two authorized corrections are documented for Technical Lead authorization and are not silently fixed in M7.5A.

## Required gates

Run sequentially: format check, lint, type-check, focused Admin catalog/access tests, full tests, SEO regression, seed validation, production build, and `git diff --check`. Stop only RoSach-owned watchers before a root build; do not terminate unrelated Codex/browser processes.

## M7.5B entry condition

M7.5B may start only after the catalog correction and route-access matrix pass automated and manual verification, no authorized-scope regression remains, and every unrelated BLOCKER/HIGH finding has a Technical Lead decision.
