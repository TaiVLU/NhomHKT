# M7.3 Performance Design Principles

Status: M7.3A AUDIT BASELINE

M7.3 starts from measurement before optimization. No source, CSS, config, API, database, package, asset, test, deployment, analytics, or SEO implementation change is allowed in M7.3A.

## Principles

| Principle | Rule | Evidence Boundary |
|---|---|---|
| Audit first | Record source, build, test, and runtime evidence before recommending M7.3B work. | Commands and file paths must be listed. |
| No fake metrics | Do not state LCP, CLS, INP, TBT, FCP, Speed Index, transfer size, request count, bundle size, or load time unless measured by an actual command/tool. | Unmeasured values are `NOT MEASURED`. |
| Production-mode preference | Use `npm run build` and `next start` when safe; development mode is not representative because of HMR and source maps. | Production runtime findings must state env and URL. |
| Preserve closed milestones | M7.3B must preserve M6 architecture, M7.1 website experience, M7.2 technical SEO, commerce behavior, auth, accessibility, SSR text, metadata, canonical, robots, sitemap, Open Graph, Twitter, manifest, and JSON-LD. | Every recommendation carries SEO, accessibility, and commerce impact. |
| Server first | Public text, headings, canonical links, metadata, and structured data stay server-rendered. | Do not move public routes to client-only rendering. |
| Minimal client boundary | Client components should be scoped to real browser interaction, state, effect, router, storage, or context needs. | `"use client"` files are inventoried before any split recommendation. |
| Data freshness safety | Public catalog data may be considered for cache/memoization only with freshness evidence. Cart, checkout, account, auth, admin, price, stock, and order data must not be cached across users. | Data recommendations must mark public/private data and user-isolation risk. |
| Request discipline | Independent fetches may be candidates for `Promise.all`; metadata/page duplicate fetches require evidence before changing. | Native `fetch` with identical URL/options may be memoized by Next, but custom patterns are treated as risk unless verified. |
| Image priority rules | Only the true above-fold LCP image should be eager/priority. Product grid images below fold should stay lazy. Social preview assets are crawler metadata assets, not runtime LCP candidates. | Image audit distinguishes UI images from social assets. |
| Font safety | Do not change font family or weight in audit. Prefer documenting whether fonts are local/system/external and whether they can cause blocking or CLS. | `globals.css` is the source of truth. |
| CSS caution | Shadows, sticky layers, backdrop filters, fixed overlays, animations, and duplicate responsive UI are performance risks only when tied to evidence. | M7.3A classifies risk, not visual preference. |
| Accessibility safety | Optimizations must preserve zoom, keyboard navigation, focus visibility, accessible names, alt text, reduced motion, loading states, and semantic controls. | High/P1 findings include accessibility impact. |
| SEO safety | Do not lazy-load H1, primary product content, metadata, canonical, robots, or JSON-LD through browser effects. | SEO impact must be explicit. |
| Commerce safety | Do not change price, stock, cart totals, checkout idempotency, order submission, auth, permission, inventory, or availability semantics for speed. | Commerce impact must be explicit. |
| Local versus deployment boundary | Local HTTP, absent public domain, absent SSL, absent Search Console, and API/db availability are environment/deployment constraints, not source-code failures. | Teacher checklist rows are mapped to local, M7.3B, M7.5, or external scope. |
| Rollback principle | M7.3B changes should be small, measured before/after, and reversible without reopening M7.2 SEO or Commerce Core. | Roadmap includes rollback notes. |

## Stop Line

M7.3A may create docs 73-80 and update `docs/00-document-map.md` and `docs/99-project-memory.md` only. All implementation candidates remain recommendations for M7.3B or later.
