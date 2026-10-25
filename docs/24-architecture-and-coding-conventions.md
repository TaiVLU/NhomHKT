# Architecture and Coding Conventions

## M6.2 Commerce Domain Ownership

The locked commerce decisions remain authoritative:

- Catalog Read Model is the current state projection.
- Order Snapshot is the historical source of truth.
- Product.primaryCategoryId is the primary category authority.
- Inventory Ledger is the source of stock movement truth.
- AppError is the standard error contract.

Checkout and Orders may orchestrate commerce workflows, but committed stock movement belongs to the Inventory Movement boundary. Feature modules must not directly change `Inventory.onHandQuantity` without also appending the corresponding `InventoryLedger` row in the same transaction.

Cart is non-reserving. It may validate availability but must not reserve, consume, restore, or ledger stock.

## Frontend

```text
app/
components/ui/
components/layout/
features/auth/
features/catalog/
features/cart/
features/order/
features/admin/
lib/
services/
hooks/
schemas/
types/
constants/
```

Page không chứa toàn bộ logic. Tách:
- UI primitives;
- feature components;
- hooks;
- API client;
- validation schema.

## Backend

```text
src/
modules/
  auth/
    auth.controller.ts
    auth.service.ts
    auth.repository.ts
    auth.routes.ts
    auth.schema.ts
middlewares/
config/
database/
jobs/
shared/
```

Luồng:

```text
Route -> Middleware -> Controller -> Service -> Repository -> Prisma -> SQL Server
```

Controller không chứa business logic phức tạp.
Repository không quyết định business rule.

Prisma ORM là data-access mặc định. Raw SQL chỉ dùng dạng parameterized trong repository/transaction khi Prisma không biểu đạt tốt yêu cầu khóa và atomic update tồn kho; service vẫn sở hữu business rule.

## BIGINT và JSON boundary

- Database/Prisma/backend dùng BIGINT/`bigint`.
- JSON không serialize native JavaScript `bigint`; API mapper phải chuyển mọi entity ID/FK ID thành decimal string trước khi tạo response.
- Request validation nhận ID dưới dạng string chữ số dương và chuyển sang `bigint` chỉ trong backend boundary.
- Frontend và shared API types khai báo ID là `string`; cấm `Number(id)`, `parseInt(id)` hoặc phép toán số trên ID.
- `orderCode` vẫn là chuỗi nghiệp vụ riêng, không đồng nhất với `Order.id`.

## Naming

- TypeScript: camelCase.
- Class/Component: PascalCase.
- Constants: UPPER_SNAKE_CASE.
- File: kebab-case hoặc convention framework, phải thống nhất.
- REST resource dùng danh từ số nhiều.

## Chất lượng

- Không `any` tùy tiện.
- Không `SELECT *`.
- Không magic number.
- Không `console.log` production.
- Không hard-code secret.
- Không nuốt lỗi.
- Không tắt lint để qua build.

## Commit

- `feat(auth): ...`
- `fix(order): ...`
- `refactor(cart): ...`
- `test(inventory): ...`
- `docs(erd): ...`
