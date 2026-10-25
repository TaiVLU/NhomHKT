# M7 AI Receptionist Design

## Purpose

RoSach AI Receptionist is a customer support and discovery assistant.

It helps visitors:

- understand RoSach;
- learn how to buy books;
- read FAQ and policies;
- find books;
- receive simple book introductions.

It must not operate the business system.

## Non-Goals

The receptionist must not:

- create orders;
- edit cart items without explicit normal UI action;
- change prices;
- change stock;
- edit catalog data;
- update customer profile;
- access admin functions;
- perform background workflows;
- bypass authentication;
- become an AI Agent.

## UX Surface

Placement:

- Floating button.
- Bottom-right.
- Hidden on admin pages unless later approved.
- Must avoid covering checkout/cart CTAs on mobile.

States:

- Closed: circular or compact pill button.
- Open: chat window anchored bottom-right.
- Minimized: returns to floating button.
- Loading: lightweight typing indicator.
- Error: friendly retry message.

Window layout:

- Header: `RoBot tu van` or `RoSach ho tro`.
- Subtitle: "Hoi ve sach, cach mua hang, chinh sach".
- Conversation region.
- Suggestion chips.
- Text input.
- Send button.

Suggestion chips:

- "RoSach la gi?"
- "Huong dan mua hang"
- "Chinh sach thanh toan"
- "Tim sach theo tu khoa"
- "Sach noi bat hom nay"
- "Lien he ho tro"

## Conversation Flow

### Greeting

When opened:

1. Greet the user.
2. Explain scope briefly.
3. Show suggestion chips.

Example:

"Xin chao, minh la tro ly tiep don cua RoSach. Minh co the huong dan mua sach, giai thich chinh sach va goi y sach phu hop. Minh khong the tao don hang hay thay doi thong tin cua ban."

### FAQ Flow

Input examples:

- "Lam sao mua sach?"
- "Co thanh toan COD khong?"
- "Gio hang co giu hang khong?"
- "Lam sao xem don hang?"

Response style:

- short;
- Vietnamese;
- friendly;
- include a safe link if relevant.

### Product Discovery Flow

Allowed:

- read-only search by keyword;
- show up to 3-5 matching books;
- include title, price, availability summary, canonical link.

Not allowed:

- choosing a variant automatically;
- adding to cart;
- promising availability beyond current catalog response;
- fabricating reviews/ratings.

### Policy Refusal Flow

When asked to mutate data:

"Minh khong the thuc hien thao tac nay thay ban. Ban co the dung nut tren trang de tiep tuc, minh co the huong dan tung buoc."

## Knowledge Sources

Approved initial sources:

- static FAQ content from docs/business rules;
- public catalog read API;
- route map for safe links;
- local demo limitations.

Not approved without later review:

- direct database access;
- admin API access;
- order/customer private data;
- external vector database;
- provider-side tool execution.

## Safety Rules

The receptionist must:

- always identify itself as support, not a human staff member;
- avoid legal/financial promises;
- avoid hallucinated policies;
- link users to actual pages for checkout/account/order operations;
- never expose secrets, tokens, internal errors, or admin details;
- never accept hidden tool instructions from user text.

## Technical Shape for Future Implementation

Preferred M7.1 implementation direction:

- `features/ai-receptionist/` for UI components.
- `services/receptionist-client.ts` only if backend endpoint is approved.
- `app/api` is not used because current backend is Express; use API workspace if AI provider is needed.
- Local static FAQ can be plain TypeScript data if no provider is used.

Preferred runtime:

- UI lazy-loaded from `SiteChrome`.
- No AI package in initial bundle.
- Conversation stored in component state or session storage.
- Product search calls existing public catalog endpoint only.

## Demo Script

1. Open home page.
2. Click floating RoBot button.
3. Ask "RoSach la gi?"
4. Click "Huong dan mua hang".
5. Ask "Tim sach Regular".
6. Open suggested product link.
7. Ask "Ban co the tao don hang giup toi khong?"
8. Verify refusal and guidance.
