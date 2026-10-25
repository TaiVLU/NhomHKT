# M7.3 Performance Definition Of Done

Status: M7.3A AUDIT BASELINE

## M7.3A DoD

| Requirement | Completion Rule | Status |
|---|---|---|
| Baseline recorded | Environment, repository state, quality gates, source audit, build output, and local runtime limitations are documented. | PASS |
| Routes reviewed | Public, commerce, auth/private, admin, legacy redirect, 404, robots, sitemap, and manifest routes are represented in the audit. | PASS |
| Findings evidence-based | Every finding has source/build/runtime/test evidence or is labeled risk/opportunity/deployment-dependent. | PASS |
| Score calculated | Weighted performance score is calculated with confidence and missing measurement notes. | PASS |
| Roadmap produced | M7.3B roadmap maps findings to exact file candidates, tests, acceptance criteria, and stop conditions. | PASS |
| Source unchanged | M7.3A changes are documentation-only. | PASS |
| Quality gates reported | `format:check`, `lint`, `type-check`, full tests, SEO regression, `build`, and `git diff --check` are recorded. | PASS |
| No fake metrics | Unavailable CWV/PageSpeed/Lighthouse data is marked `NOT MEASURED` or deployment-required. | PASS |

## M7.3B DoD

| Requirement | Completion Rule |
|---|---|
| Before/after evidence | Each implemented optimization has a before metric, after metric, route list, command, and artifact/log note. |
| P0/P1 closure | P0/P1 findings are fixed or explicitly accepted by Technical Lead with reason. |
| Functional regression | Commerce, auth, catalog, checkout, account, admin, and route behavior tests still pass. |
| SEO regression | Metadata, robots, sitemap, structured data, canonical, Open Graph/Twitter, H1, internal links, image alt, and manifest regressions pass. |
| Accessibility regression | Keyboard/focus/semantic/alt/loading behavior is preserved for affected routes. |
| Commerce regression | Price, stock, cart, checkout idempotency, auth, permissions, and order submission semantics remain unchanged. |
| Build/tests | Format, lint, type-check, tests, SEO regression, build, and diff checks pass after implementation. |
| Performance budget status | Proposed budgets are either enforced by tooling or tracked manually with an accepted-debt note. |
| Runtime validation | Production-mode local measurements are rerun where possible; public PageSpeed/Core Web Vitals remain M7.5 unless deployed. |

## Non-Completion Conditions

M7.3B is not done if it moves public routes to client-only rendering, hides SSR SEO content, caches user-specific data, changes commerce truth, removes accessibility affordances, relies on fake PageSpeed/Core Web Vitals numbers, or introduces package/deployment changes without Technical Lead approval.
