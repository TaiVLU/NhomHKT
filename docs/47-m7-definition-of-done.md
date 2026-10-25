# M7 Definition of Done

Status: APPROVED BASELINE FOR M7 IMPLEMENTATION

## Purpose

This document defines the completion standard for M7 work packages. A milestone may be considered ready for Technical Lead review only when it satisfies its approved scope, preserves M6 architecture, and provides evidence through tests, runtime checks, and documentation.

## Global Done Criteria

Every M7 implementation milestone must:

- start from approved M7 planning or audit findings;
- avoid unapproved product expansion;
- preserve Commerce Core architecture;
- keep RoSach local-only unless a later deployment milestone explicitly changes that;
- update relevant documentation;
- run the applicable quality gates;
- report remaining risks honestly;
- stop after the assigned milestone.

## M7.1 Website Polish Done Criteria

M7.1 website polish is done only when:

- every addressed change maps back to a finding from `docs/48` through `docs/54`;
- non-reproduced findings are marked `NOT REPRODUCIBLE`;
- demo data visible to customers no longer reads like milestone/test scaffolding where safely adjustable;
- product image rendering has stable fallback, aspect ratio, and alt text;
- mobile navigation no longer requires users to guess hidden links;
- product detail facts do not overflow on tablet/mobile;
- admin UI terminology is consistently Vietnamese where it is user-facing;
- dialogs, drawer, toast, buttons, links, and forms preserve keyboard access;
- desktop, tablet, and mobile runtime smoke checks pass;
- console, network, and hydration checks have no blocking errors;
- quality gates pass or any failure is explicitly documented with Technical Lead action required.

## M7 AI Receptionist Done Criteria

AI Receptionist implementation is done only when:

- it remains read-only and customer-supportive;
- it cannot mutate cart, order, inventory, price, user, or admin data;
- it uses only approved public/catalog/policy context;
- it includes clear refusal behavior for unsupported actions;
- it provides visible suggestion chips and a bounded conversation window;
- it works locally without public deployment assumptions;
- it includes accessibility and responsive checks.

## M7 SEO Done Criteria

SEO work is done only when:

- it uses the approved SEO Platform;
- pages do not manually create metadata or structured data outside platform ownership;
- canonical, robots, Open Graph, Twitter, sitemap, and JSON-LD remain consistent;
- local-only and public-deployment boundaries are not confused;
- tests cover regressions.

## M7 Performance Done Criteria

Performance work is done only when:

- it is based on measured bottlenecks;
- it avoids speculative rewrites;
- image, bundle, lazy loading, caching, and Core Web Vitals findings are documented;
- before/after evidence is recorded for each optimization;
- functionality and accessibility do not regress.

## Evidence Requirements

At minimum, a completed M7 implementation report must include:

- scope summary;
- files changed;
- findings addressed;
- before/after evidence;
- tests added or updated;
- commands executed;
- runtime verification;
- known deferred items;
- remaining risks;
- recommendation for Technical Lead review.

## Stop Conditions

Stop and report instead of continuing if implementation would require:

- Commerce Core redesign;
- database schema change outside approved scope;
- API contract change outside approved scope;
- checkout logic change;
- inventory ledger policy change;
- order snapshot change;
- public deployment setup;
- chatbot work before its approved implementation milestone.
