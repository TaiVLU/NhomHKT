# ADR-029: Catalog Read Model

Status: Approved for M6.0B-2 implementation

## Context

M6.0B-1 introduced publication lifecycle, authoritative primary category, and immutable order item snapshots. M6.0B-2 consolidates application contracts so Catalog, Cart, Checkout, Orders, Admin, SEO, and future consumers do not duplicate lifecycle, pricing, stock, or primary-category rules.

## Decision

RoSach owns current catalog facts through an explicit Catalog Read Model boundary in the API application layer.

The read model exposes current-state Book/Product facts only:

- publication lifecycle and public visibility;
- primary category;
- author and publisher display facts;
- canonical slug and title;
- image facts;
- variant SKU/name/ISBN;
- list price, sale price, and effective price;
- on-hand, reserved, and available stock;
- purchasability and unavailable reason.

Checkout consumes current facts from this read model but remains the owner of immutable OrderItem snapshot persistence. Orders read snapshots first and use current relations only as legacy fallback when snapshot fields are absent.

## Consequences

- `publicationState` is the business source of truth; `Product.isActive` remains a one-way compatibility mirror only.
- Price selection is centralized as `effectivePrice`.
- Stock availability is centralized as `availableQuantity`.
- ACTIVE, zero-stock books remain visible but not purchasable.
- SEO and future chatbot consumers must use the read model instead of querying Product lifecycle or pricing independently.
- The read model must not persist snapshots or mutate inventory.

## Implementation

M6.0B-2 implements the boundary under `apps/api/src/modules/catalog/catalog-read-model.ts` and shared pure rules under `apps/api/src/modules/catalog/catalog-policy.ts`.

## Compatibility

Legacy order fallback remains until historical rows either have complete snapshots or are accepted as partially unknown. Product-level `isActive` remains only for compatibility clients and should be removed in a later cleanup milestone after admin/client contracts fully migrate to `publicationState`.
