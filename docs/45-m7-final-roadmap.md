# M7 Final Roadmap

## Guiding Principle

M7 improves customer experience through a small AI Receptionist and focused UX/SEO/performance polish.

It does not modify Commerce Core.

## M7.0 Analysis and Design

Deliverables:

- M7 planning document.
- AI Receptionist design.
- UX improvement plan.
- SEO audit plan.
- Performance plan.
- Final M7 roadmap.

Status: this milestone is documentation-only.

## M7.1 Receptionist UI Shell

Scope:

- Floating bottom-right button.
- Expandable chat window.
- Suggestion chips.
- Local-only state.
- Keyboard and mobile behavior.

No AI provider integration yet unless separately approved.

## M7.2 Receptionist Knowledge and FAQ

Scope:

- Curated FAQ answers.
- Buying guidance.
- Policy guidance.
- Safe route links.
- Read-only product search suggestions.

Acceptance:

- No mutation APIs.
- No admin APIs.
- No fabricated commerce facts.

## M7.3 Optional AI Provider Integration

Starts only after Technical Lead approval.

Scope:

- Backend-owned provider key.
- Safe prompt and refusal rules.
- Read-only retrieval from approved knowledge.
- Logging policy without sensitive data.

Out of scope:

- tool execution;
- order creation;
- cart mutation;
- inventory/pricing/catalog mutation.

## M7.4 UX Polish Pass

Scope:

- typography audit;
- spacing polish;
- loading/skeleton consistency;
- product card polish;
- responsive chatbot checks;
- accessibility basics.

## M7.5 SEO and Performance Certification

Scope:

- rerun SEO regression suite;
- verify chatbot does not create SEO regressions;
- measure bundle impact;
- verify no LCP/CLS regression from chatbot;
- update docs and demo script.

## Final M7 Acceptance Criteria

- AI Receptionist is useful, safe, and easy to demo.
- Commerce Core remains unchanged.
- No Critical or High UX/security/performance regressions.
- Local demo can show chatbot guidance and product discovery.
- Technical Lead approves before any M8 or deployment work.
