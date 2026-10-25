# M7 Performance Plan

## Goal

Add AI Receptionist and UX polish without slowing the M6 local release candidate.

## Lazy Loading Checklist

- Load chatbot window only after user intent.
- Keep closed floating button lightweight.
- Do not load AI/provider client code in the initial route bundle.
- Lazy-load optional rich message rendering if needed.

## Code Splitting Checklist

- Put chatbot UI in an isolated feature module.
- Use dynamic import for the expanded chat window.
- Keep product/catalog/cart/checkout bundles unaffected.
- Avoid adding global dependencies for one chatbot surface.

## Dynamic Import Checklist

- Dynamic import candidate: expanded receptionist panel.
- Static import candidate: tiny floating launcher.
- Loading fallback: small accessible status label or spinner.

## Bundle Optimization Checklist

- Measure bundle before/after M7.1.
- Avoid adding large markdown, animation, or AI SDK packages to frontend.
- Prefer existing CSS and React primitives.
- Keep suggestion chips as data, not a heavy UI library.

## Image Optimization Checklist

- Preserve existing placeholder fallback.
- Review product detail LCP image warning.
- Consider priority/eager loading only for true above-the-fold product image.
- Do not introduce remote image domains without Next image config review.

## Caching Checklist

- Keep catalog cache behavior aligned with local demo freshness requirements.
- Chatbot FAQ content can be static.
- Product search through chatbot should reuse public catalog API and respect existing read model.
- Do not cache personalized/private answers in shared cache.

## Core Web Vitals Checklist

- LCP: product detail cover image.
- CLS: chatbot open/close should not shift page layout.
- INP: chat input and suggestion chips should respond quickly.
- TTFB: chatbot should not block server-rendered pages.

## Reliability Checklist

- Chatbot should degrade gracefully if API/AI is unavailable.
- FAQ suggestions should still work without provider integration if implemented as static local knowledge.
- Errors should not break the page shell.

## Acceptance Criteria

- Initial page load remains visually unchanged with chatbot closed.
- No new blocking console errors.
- Build remains green.
- Browser smoke covers home, catalog, product detail, cart, checkout, and chatbot open/close.
