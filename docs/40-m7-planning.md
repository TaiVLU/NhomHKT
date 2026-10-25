# M7.0 AI & UX Planning

Status: ANALYSIS ONLY.

M6 is approved and closed. M7 starts from a stable local-only graduation release candidate.

M7 philosophy:

- AI is an AI Receptionist.
- AI is not an AI Agent.
- AI is not an automation workflow.
- AI must not change Commerce Core.
- AI helps customers understand and navigate RoSach.

## Repository Baseline

Current stack:

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS through global CSS tokens.
- Backend: Express, Prisma, SQL Server.
- SEO: centralized SEO Descriptor pipeline with metadata, canonical, robots, sitemap, Open Graph, Twitter Card, and structured data.
- Commerce: cart, checkout, orders, inventory movement, ledger, admin catalog and admin orders are stable M6 surfaces.

M7 must not redesign:

- Catalog Read Model.
- Order Snapshot.
- Inventory Movement boundary.
- Inventory Ledger.
- Cart non-reservation.
- Checkout final validation.
- AppError contract.

## Frontend Assessment

Strengths:

- App Router route structure is clear.
- Public customer pages are usable: home, catalog, category, product detail, cart, checkout, account, orders.
- Admin pages are functional for catalog and orders.
- Global visual tokens exist for color, typography, spacing, focus, card surfaces, and responsive behavior.
- Loading, empty, error, and success states exist in the core commerce flows.
- Product images have fallback handling.
- Browser smoke from M6 passed with no blocking console errors.

Constraints:

- Styling is concentrated in `app/globals.css`; M7 UI additions should avoid making this file harder to maintain.
- There is no chatbot shell or AI UI surface yet.
- There is no client-side command palette or global help pattern.
- Product discovery is currently route/form driven, not conversational.

Recommendation:

- Build one small, isolated AI Receptionist UI surface.
- Keep it visually consistent with RoSach tokens.
- Avoid touching existing commerce flows except for safe navigation links.

## UX Assessment

Strengths:

- Brand voice is editorial and warm.
- Customer purchase flow is demonstrable.
- Admin workflows are practical and dense enough for repeated use.
- Focus-visible styling exists.
- Responsive layouts exist for customer and admin pages.

Improvement opportunities:

- Add a friendly support entry point that answers common questions without forcing users to search documentation.
- Improve perceived speed with more consistent skeletons.
- Polish hover/pressed/disabled states across product cards and buttons.
- Add more consistent Vietnamese microcopy for empty/error states.
- Ensure chatbot window never covers core mobile CTAs.

## SEO Assessment

Strengths:

- Metadata is centralized.
- Canonical and robots policies are tested.
- Sitemap is generated through typed providers.
- Product detail uses structured data through the SEO platform.
- SEO regression tests cover cross-asset consistency.

M7 SEO direction:

- Do not redesign SEO architecture.
- Use M7 to audit content quality, headings, internal links, image alt text, and chatbot discoverability.
- If AI answers recommend books, ensure recommendations link to canonical product URLs.

## Performance Assessment

Strengths:

- Next.js build passes.
- Product/catalog data uses server rendering where appropriate.
- Image fallback exists.
- Motion reduction handling exists for some animated states.

Known constraints:

- Product cover images can trigger LCP warnings when the primary cover is above the fold.
- No dedicated bundle budget is documented.
- Chatbot could increase JS if implemented carelessly.

M7 performance principle:

- Chatbot must be lazy-loaded after user intent.
- Initial page load should not include AI SDK or heavy markdown/chat dependencies unless needed.

## Chatbot Integration Assessment

Recommended integration model:

- Floating client component mounted in non-admin `SiteChrome`.
- UI opens on click; conversation state remains local to the browser session.
- Initial M7 can use curated FAQ and safe catalog lookup before introducing external AI calls.
- If an AI provider is later approved, backend proxy should own API keys and safety policy.

Do not integrate chatbot into:

- checkout mutation;
- cart mutation;
- admin mutation;
- inventory mutation;
- order transition;
- pricing;
- account management.

## Proposed M7 Scope

M7 should be small and demo-friendly:

1. AI Receptionist UI.
2. FAQ and buying guidance knowledge base.
3. Safe product search/suggestion support.
4. UX polish checklist from `docs/42-m7-ux-improvement-plan.md`.
5. SEO audit checklist from `docs/43-m7-seo-audit-plan.md`.
6. Performance checklist from `docs/44-m7-performance-plan.md`.
7. Manual demo script for the receptionist.

Out of scope:

- AI order creation.
- AI checkout.
- AI admin assistant.
- AI inventory/pricing/catalog mutation.
- workflow automation.
- public deployment.

## M7 Work Packages

### M7.1 UX Foundation

- Prepare chatbot visual shell.
- Define copy, suggestion chips, open/close/minimize behavior.
- Add no business logic.

### M7.2 Receptionist Knowledge

- Define FAQ categories.
- Map user intents to static answers and safe links.
- Add product-search read-only flow.

### M7.3 AI Integration, If Approved

- Introduce provider only after Technical Lead approval.
- Keep secrets backend-only.
- Add guardrails and refusal policy.

### M7.4 QA and Demo Readiness

- Browser test the chatbot on desktop/tablet/mobile.
- Verify accessibility, keyboard behavior, and no CTA overlap.
- Verify no Commerce Core mutation is possible.
