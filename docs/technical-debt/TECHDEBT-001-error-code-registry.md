# TECHDEBT-001 - Centralize Error Code Registry

Status: Backlog  
Priority: Low  
Blocking: No  
Source Milestone: M6.0C

## Context

`AppError` and machine-readable error codes are stable, but error-code values are not yet managed by a centralized registry.

## Risk

- Duplicate error code.
- Incorrect naming convention.
- Harder search and documentation.
- Harder long-term compatibility guarantees.

## Constraints

- Do not change the current response contract.
- Do not change error codes already used by the frontend.
- Do not implement this in M6.0C.
- Implement only in an appropriate hardening milestone after Technical Lead specification.

## Acceptance Criteria

- A centralized registry/type exists.
- No duplicate code exists.
- Existing API contract is unchanged.
- Unit and integration tests still PASS.
