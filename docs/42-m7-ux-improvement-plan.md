# M7 UX Improvement Plan

## Goal

Improve user experience without redesigning RoSach or changing Commerce Core.

M7 UX work should make the project:

- easier to demo;
- friendlier for first-time users;
- visually more polished;
- more consistent across customer and admin surfaces.

## Typography Checklist

- Verify heading font stack on home, catalog, product detail, cart, checkout, account, and admin pages.
- Confirm no `text-align: justify` causes abnormal Vietnamese word spacing.
- Keep `letter-spacing: 0` unless used for small eyebrow labels.
- Verify line-height for large headings on mobile.
- Check long product names, order numbers, and SKU wrapping.
- Ensure Vietnamese diacritics render naturally.

## CSS Checklist

- Keep RoSach tokens centralized.
- Avoid growing `globals.css` with unrelated component styles if a component-level pattern is introduced.
- Ensure button, card, form, dialog, and toast styles remain consistent.
- Check disabled, hover, active, focus-visible, and loading states.
- Add reduced-motion behavior for chatbot animation.

## Spacing Checklist

- Audit section spacing on home and catalog.
- Keep card padding consistent.
- Ensure mobile sticky header does not crowd content.
- Ensure chatbot button does not overlap cart/checkout action buttons.
- Check admin table/filter spacing on tablet widths.

## Responsive Checklist

- Desktop: 1440x900 and 1280x800.
- Tablet: 1024x768 and 768x1024.
- Mobile: 430x932 and 390x844.
- Verify chatbot closed/open states in each viewport.
- Verify chat window max height and scroll behavior.

## Loading and Skeleton Checklist

- Catalog page loading state.
- Cart loading state.
- Checkout address loading state.
- Order history loading state.
- AI receptionist typing/loading state.
- Avoid layout shift when loading.

## Hover and Animation Checklist

- Product card hover remains subtle.
- Buttons have consistent hover color.
- Chatbot open/close animation is short and optional.
- Respect `prefers-reduced-motion`.
- Avoid decorative motion on checkout or admin mutation flows.

## Product Card Checklist

- Stable image ratio.
- Price wraps cleanly.
- Long title clamps or wraps predictably.
- Author fallback is readable.
- Stock badge is visible but not noisy.
- CTA/link target is clear.

## Image Checklist

- Placeholder works for missing/fake image URLs.
- Product detail primary image has useful alt text.
- Decorative thumbnails have empty alt where appropriate.
- Consider above-the-fold image priority only after measuring LCP impact.

## Accessibility Checklist

- Chatbot button has descriptive `aria-label`.
- Chat window uses dialog-like semantics only if modal behavior is implemented.
- Focus moves into chat window when opened and returns to trigger when closed.
- Escape closes chat window.
- Suggestion chips are keyboard reachable buttons.
- Conversation updates use `aria-live` politely.
- Color contrast remains acceptable.

## Consistency Checklist

- Vietnamese labels use one tone across public pages.
- Admin labels remain task-focused.
- Error messages are actionable.
- Empty states guide next action.
- Links and buttons are not mixed for the same action type.

## Acceptance Criteria

M7 UX work is accepted when:

- chatbot does not block core navigation or commerce CTAs;
- no new console errors appear;
- core M6 flows still pass;
- visual behavior is verified across desktop/tablet/mobile;
- accessibility basics are documented and tested manually.
