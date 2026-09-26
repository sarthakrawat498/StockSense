# StockSense — Project Context

## 1. Project Overview

StockSense is a modular Inventory Management System (IMS) for digitizing stock-related operations that would otherwise be handled through manual registers, Excel sheets, or scattered tracking methods.

The hackathon problem statement centers on:

- Product management
- Multi-warehouse inventory
- Location-level stock availability
- Incoming stock / receipts
- Outgoing stock / delivery orders
- Internal transfers
- Inventory adjustments / physical stock counts
- Stock movement history / ledger
- Low-stock and out-of-stock visibility
- Dashboard KPIs and filters
- User authentication and OTP-based password reset
- Inventory Manager and Warehouse Staff roles

The system should remain hackathon-focused. Do not introduce unnecessary ERP functionality such as invoicing, purchase orders, sales orders, batch tracking, serial numbers, advanced RBAC, accounting, or complex supplier/customer modules unless a later requirement explicitly needs them.

---

## 2. Source Requirements

The source problem statement defines two target user groups:

- Inventory Managers — manage incoming and outgoing stock.
- Warehouse Staff — perform transfers, picking, shelving, and counting.

The system supports the following operation types:

- Receipts (Incoming Stock)
- Delivery Orders (Outgoing Stock)
- Internal Transfers
- Inventory Adjustment
- Move History
- Dashboard
- Warehouse settings
- User profile / logout

The dashboard supports filtering by:

- Document type: Receipts / Delivery / Internal / Adjustments
- Status: Draft / Waiting / Ready / Done / Canceled
- Warehouse or location
- Product category

The source also shows values such as:

- Reference numbers such as `WH/IN/0001` and `WH/OUT/0001`
- Contacts such as suppliers/customers
- Product names and SKUs
- Unit of Measure
- Quantities such as `6 PCS`, `100 KG`, and `3 KG`
- Per-unit cost
- On Hand stock
- Free to Use stock
- Schedule date
- Responsible user
- From / To locations

All stock movements should ultimately be reflected in the Stock Ledger.

---

## 3. Core Domain Model

The database contains these 10 tables/models:

1. `users`
2. `password_reset_otps`
3. `warehouses`
4. `locations`
5. `categories`
6. `products`
7. `stock_balances`
8. `inventory_operations`
9. `inventory_operation_items`
10. `stock_ledger`

Every primary key and foreign key uses UUID.

PostgreSQL is the database and Prisma is the ORM.

---

## 4. Important Domain Rules

### 4.1 User identity and role

`users` stores the user's authentication and authorization information.

Fields:

- `id` — UUID PK
- `username` — unique login identifier shown by the UI
- `email` — unique
- `password_hash`
- `role` — `MANAGER` or `STAFF`
- `warehouse_id` — nullable FK to `warehouses`

Role is stored before authentication. Login does not create or assign the role.

The backend authenticates the user, then includes the user identity and authorization context in the session/JWT.

Recommended authenticated context:

- `userId`
- `role`
- `warehouseId` when assigned

The first manager can be seeded for the hackathon. Managers can assign warehouse staff to warehouses.

A newly created user may have `warehouse_id = NULL` until assigned.

---

## 5. Warehouse and Location Model

A warehouse contains multiple locations.

Examples:

- Main Warehouse
- Production Floor
- Rack A
- Rack B
- Production Rack

`locations` therefore belongs to `warehouses`.

A location is not a property of a product.

A product can exist at multiple locations at the same time.

Example:

```text
Steel Rod

Main Warehouse     60 KG
Production Rack    40 KG
Rack B              20 KG
```

Therefore there is intentionally **no** `location_id` or `opening_location_id` on `products`.

---

## 6. Product Model

A product stores product identity, not inventory position.

Fields:

- `id` — UUID
- `name`
- `sku` — unique
- `category_id`
- `uom`
- `unit_cost`
- timestamps

`uom` is a string rather than an enum so the system can support values encountered in the source requirements, including:

- `PCS`
- `KG`
- `L`
- `M`
- `BOX`
- `SET`

Quantity fields must use PostgreSQL `DECIMAL`, not integer, because stock can be measured in units such as kilograms and may need fractional quantities.

---

## 7. Initial Stock Logic

Do not add `opening_location_id` to `products`.

When a product is created with initial stock, the initial location belongs to the inventory record, not the product definition.

Preferred hackathon implementation:

1. Create the product.
2. If initial stock > 0, create an inventory operation representing the stock introduction.
3. Create the operation item.
4. Create/update the corresponding `stock_balances` row.
5. Create a ledger entry so the initial stock is traceable.

This keeps all inventory-changing events represented consistently in the operation/ledger model.

---

## 8. Current Stock Model

`stock_balances` stores the current stock snapshot for each product at each location.

Fields:

- `id` — UUID
- `product_id` — FK
- `location_id` — FK
- `on_hand_qty`
- `reserved_qty`
- `updated_at`

Critical constraint:

```text
UNIQUE(product_id, location_id)
```

There can only be one current balance row for a product/location pair.

`free_to_use` should be calculated as:

```text
free_to_use = on_hand_qty - reserved_qty
```

It does not need to be stored as a separate database column unless there is a later performance requirement.

---

## 9. Inventory Operations

`inventory_operations` is the common operation/header table for **all four** inventory operation types.

It is NOT only for internal transfers.

Supported operation types:

```text
RECEIPT
DELIVERY
TRANSFER
ADJUSTMENT
```

Supported statuses:

```text
DRAFT
WAITING
READY
DONE
CANCELED
```

The operation header stores information shared by the operation:

- unique reference
- operation type
- status
- warehouse
- source location when applicable
- destination location when applicable
- contact name when applicable
- address when applicable
- scheduled date
- responsible user
- creation/update timestamps
- validation/cancellation timestamps

Reference examples:

```text
WH/IN/0001
WH/OUT/0001
WH/TR/0001
WH/ADJ/0001
```

---

## 10. Operation Location Rules

`from_location_id` and `to_location_id` are nullable because different operations have different physical directions.

### Receipt

Stock enters the warehouse.

```text
FROM: external supplier / no internal location
TO:   warehouse location
```

Therefore:

```text
from_location_id = NULL
to_location_id   = NOT NULL
```

### Delivery

Stock leaves the warehouse.

```text
FROM: warehouse location
TO:   external customer / no internal location
```

Therefore:

```text
from_location_id = NOT NULL
to_location_id   = NULL
```

### Transfer

Stock moves between internal locations.

```text
FROM: warehouse location
TO:   warehouse location
```

Therefore both are required.

### Adjustment

Adjustment depends on whether stock increases or decreases. The service layer determines which location is affected and creates the appropriate balance/ledger movement.

These rules should be validated by the application/service layer because Prisma schema alone is not enough to express all operation-specific constraints cleanly.

---

## 11. Inventory Operation Items

`inventory_operation_items` contains the products and quantities belonging to an operation.

An operation can contain multiple products.

Fields:

- `id`
- `operation_id`
- `product_id`
- `quantity`
- `counted_quantity` — used for physical inventory counts/adjustments
- `created_at`

Examples:

```text
Receipt:
Steel Rod       100 KG
Chairs           20 PCS

Delivery:
Chairs           10 PCS

Transfer:
Steel Rod        20 KG

Adjustment:
Recorded         80 KG
Counted          77 KG
Difference       -3 KG
```

---

## 12. Stock Ledger

`stock_ledger` is the historical inventory movement record.

Every validated stock-changing operation should generate ledger records.

Ledger fields include:

- operation
- operation item
- product
- from location
- to location
- quantity
- movement type
- user who performed the movement
- movement timestamp

The ledger is append-oriented historical data. Do not use it as the primary source for every dashboard stock read; `stock_balances` is the current-state table for fast reads.

Conceptually:

```text
stock_balances = CURRENT STATE
stock_ledger   = HISTORICAL MOVEMENTS
```

---

## 13. Stock Update Transaction

Any validated inventory operation that changes stock must update the relevant stock balance(s) and ledger in a single database transaction.

Example transfer:

```text
BEGIN

1. Read source stock balance.
2. Verify sufficient available quantity.
3. Decrease source stock.
4. Increase destination stock.
5. Create stock ledger entry.
6. Mark operation as DONE.
7. Set validated_at.

COMMIT
```

Do not update stock and ledger in separate independent transactions.

This avoids inconsistencies such as stock changing without a corresponding history record.

---

## 14. Stock Constraints

Application/service validation should enforce:

```text
quantity > 0
counted_quantity >= 0
reserved_qty >= 0
on_hand_qty >= 0
reserved_qty <= on_hand_qty
```

A delivery or transfer must not reduce available stock below the permitted quantity.

Only validated/completed operations should affect actual stock balances.

Draft, Waiting, and Ready operations should not silently alter current stock unless the implementation explicitly introduces reservation behavior.

---

## 15. Role Responsibilities

### MANAGER

The Inventory Manager is the primary inventory-management role.

Expected capabilities include:

- Manage products
- Manage warehouse data
- Manage incoming stock
- Manage outgoing stock
- Review inventory state
- Assign Warehouse Staff to warehouses
- View dashboard and stock history

### STAFF

Warehouse Staff perform warehouse-floor operations described by the source requirements:

- Picking
- Shelving
- Internal transfers
- Stock counting

The implementation should not create a large generic permissions framework unless explicitly required later.

---

## 16. Dashboard Data

The dashboard should be derived from the inventory tables and support the source requirements:

KPIs:

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

Filters:

- Operation/document type
- Operation status
- Warehouse/location
- Product category

Suggested sources:

- Current stock → `stock_balances`
- Product details/category → `products`, `categories`
- Pending operations → `inventory_operations`
- Movement history → `stock_ledger`

---

## 17. Database Relationship Summary

```text
USER
 └── belongs to → WAREHOUSE

WAREHOUSE
 └── contains → LOCATIONS

CATEGORY
 └── contains → PRODUCTS

PRODUCT
 └── has → STOCK_BALANCES
                └── belongs to LOCATION

INVENTORY_OPERATION
 ├── belongs to WAREHOUSE
 ├── has RESPONSIBLE USER
 ├── may have FROM LOCATION
 ├── may have TO LOCATION
 └── contains → OPERATION_ITEMS
                    └── references PRODUCT

INVENTORY_OPERATION
 └── generates → STOCK_LEDGER

STOCK_LEDGER
 ├── references PRODUCT
 ├── may reference FROM LOCATION
 ├── may reference TO LOCATION
 └── references USER who performed the movement
```

---

## 18. Final Prisma Models

The canonical schema is represented by these Prisma models:

```text
User
PasswordResetOtp
Warehouse
Location
Category
Product
StockBalance
InventoryOperation
InventoryOperationItem
StockLedger
```

IDs:

```text
UUID
```

Database:

```text
PostgreSQL
```

ORM:

```text
Prisma
```

---

## 19. Implementation Guardrails

Keep the implementation aligned with the hackathon problem statement.

Do not add unnecessary domain entities simply because they are common in enterprise inventory systems.

In particular, do not introduce these unless a requirement explicitly appears:

- Supplier table
- Customer table
- Purchase order table
- Sales order table
- Invoice table
- Batch/lot table
- Serial number table
- Accounting tables
- Complex permission matrices
- Separate tables for every operation type

Use `inventory_operations` + `inventory_operation_items` as the shared operation model.

Use `stock_balances` for current inventory and `stock_ledger` for historical movements.

---

## 20. Canonical Inventory Examples

### Receive 100 KG Steel

```text
Operation:
RECEIPT

100 KG
external supplier → Main Warehouse

Result:
Main Warehouse steel stock +100 KG
Ledger entry created
```

### Move Steel to Production Rack

```text
Operation:
TRANSFER

Main Warehouse → Production Rack
100 KG

Result:
Main Warehouse -100 KG
Production Rack +100 KG
Ledger entry created
```

### Deliver 20 KG

```text
Operation:
DELIVERY

Production Rack → customer
20 KG

Result:
Production Rack -20 KG
Ledger entry created
```

### Adjust 3 KG damaged stock

```text
Operation:
ADJUSTMENT

Recorded = 80 KG
Physical = 77 KG
Difference = -3 KG

Result:
Stock -3 KG
Ledger entry created
```

All of these movement records contribute to the stock history/ledger.
