# ADR-030 Inventory Movement Boundary

Status: Accepted for M6.2 remediation.

## Context

M6.0C locked the commerce baseline:

- Catalog Read Model is the current state projection.
- Order Snapshot is the historical source of truth.
- Product.primaryCategoryId is the primary category authority.
- Inventory Ledger is the source of stock truth.
- AppError is the standard error contract.

The M6.2 Phase I audit found that manual inventory adjustments wrote `InventoryLedger`, but checkout consumption and order cancellation restoration updated `Inventory.onHandQuantity` directly. That made the ledger incomplete.

## Decision

All committed stock quantity changes must pass through one Inventory Movement boundary.

The boundary owns the atomic pair:

1. update `Inventory.onHandQuantity`;
2. append `InventoryLedger`.

Supported M6.2 movement types:

- `RECEIVE_STOCK`
- `MANUAL_INCREASE`
- `MANUAL_DECREASE`
- `CORRECTION`
- `CHECKOUT_CONSUMPTION`
- `ORDER_CANCELLATION_RESTORE`

Each movement executes inside the caller's Prisma transaction. If any later step in the caller transaction fails, both the inventory update and ledger append roll back.

## Why

`Inventory.onHandQuantity` is the operational current value, but it must be explainable by ledgered movements. Without this boundary, different modules can change stock while bypassing the historical record, making reconciliation and audit impossible.

The boundary preserves existing commerce behavior. It does not introduce reservations, change checkout order creation, change order snapshots, or replace the Catalog Read Model.

## Ownership

Checkout may request a checkout consumption movement.

Orders may request a cancellation restoration movement.

Inventory may request manual adjustment movements.

Only the Inventory Movement boundary performs the committed stock mutation and ledger append.

## Cart Policy

Cart remains non-reserving.

Adding or updating a cart item validates current availability, but it must not increment `reservedQuantity`, decrement `onHandQuantity`, or append `InventoryLedger`. Inventory is consumed only during successful checkout.

## Consequences

- Ledger reconstruction now includes manual adjustments, checkout consumption, and cancellation restoration.
- Existing transaction rollback semantics are preserved.
- `reservedQuantity` remains a persisted field, but no speculative reservation lifecycle is implemented in M6.2.
- Future stock movement types must be added to the Inventory Movement boundary instead of updating `Inventory` directly from feature modules.
