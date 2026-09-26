# StockSense

StockSense is a modular inventory management system for managing products, warehouses, warehouse locations, stock operations, inventory balances, and stock movement history.

The project is designed for the StockSense hackathon and focuses on the operational workflows required by Inventory Managers and Warehouse Staff without introducing unnecessary ERP functionality.

## Product Scope

StockSense supports:

- Product and category management.
- Multiple warehouses and warehouse locations.
- Location-level stock availability.
- Incoming receipts.
- Outgoing delivery orders.
- Internal transfers.
- Physical inventory adjustments.
- Stock balance and stock ledger views.
- Low-stock and out-of-stock visibility.
- Dashboard KPIs and recent operation activity.
- User roles for managers and warehouse staff.
- OTP-based password reset support.

The system intentionally does not include suppliers, customers, purchase orders, sales orders, invoices, batches, serial numbers, accounting, or complex permission matrices unless a later requirement explicitly adds them.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI primitives |
| Client data | TanStack Query |
| Validation | Zod |
| Backend | Next.js App Router route handlers |
| ORM | Prisma |
| Database | PostgreSQL on Neon |
| Authentication foundation | JWT, bcryptjs, cookies, OTP reset flow |
| Testing | Jest, Testing Library, Playwright |
| Formatting | Prettier |

## Architecture

StockSense uses a modular Next.js architecture. The frontend communicates with route handlers through HTTP. Route handlers validate requests and delegate business logic to application services. Services use Prisma for database access.

```mermaid
flowchart TD
    Browser[Browser UI]
    Pages[Next.js Pages and Components]
    Hooks[TanStack Query Hooks]
    Services[Feature API Services]
    Client[Shared HTTP Client]
    Routes[Next.js API Route Handlers]
    Domain[Domain Services]
    Prisma[Prisma Client]
    Neon[(Neon PostgreSQL)]

    Browser --> Pages
    Pages --> Hooks
    Hooks --> Services
    Services --> Client
    Client --> Routes
    Routes --> Domain
    Domain --> Prisma
    Prisma --> Neon
```

### Application layers

```text
src/
├── app/                 Next.js pages and API route handlers
├── components/          Shared UI components and layouts
├── constants/           Routes, API endpoints, and query keys
├── features/            Feature-specific UI, hooks, schemas, and services
├── lib/                 HTTP, authentication, database, errors, and utilities
├── modules/             Domain services, domain types, and data access logic
├── providers/           Global React providers
└── types/               Shared TypeScript contracts
```

### Request flow

```text
Page or component
    ↓
TanStack Query hook
    ↓
Feature service
    ↓
Shared HTTP client
    ↓
Next.js route handler
    ↓
Zod validation
    ↓
Domain service
    ↓
Prisma transaction or query
    ↓
Neon PostgreSQL
```

Pages should not access Prisma directly. Database-specific logic belongs in `src/modules` and `src/lib/db`.

## Domain Architecture

The inventory domain separates current inventory state from historical inventory movement:

```text
stock_balances = current state
stock_ledger   = historical movement records
```

Only validated stock-changing operations update balances and create ledger entries. These changes must happen inside one database transaction.

### Operation types

| Type | Direction | Source location | Destination location |
| --- | --- | --- | --- |
| `RECEIPT` | Stock enters the warehouse | Not applicable | Required |
| `DELIVERY` | Stock leaves the warehouse | Required | Not applicable |
| `TRANSFER` | Internal movement | Required | Required |
| `ADJUSTMENT` | Physical count correction | Service-defined | Service-defined |

### Operation statuses

```text
DRAFT → WAITING → READY → DONE
                     ↘ CANCELED
```

The exact transition rules are enforced by the operation service. Draft, waiting, and ready operations do not change actual stock unless reservation behavior is explicitly implemented.

## Database Schema

The canonical schema is defined in [prisma/schema.prisma](prisma/schema.prisma). PostgreSQL is used through Prisma, and all primary and foreign keys use UUIDs.

```mermaid
erDiagram
    USER }o--o| WAREHOUSE : assigned_to
    USER ||--o{ PASSWORD_RESET_OTP : requests
    USER ||--o{ INVENTORY_OPERATION : responsible_for
    USER ||--o{ STOCK_LEDGER : performs

    WAREHOUSE ||--o{ LOCATION : contains
    WAREHOUSE ||--o{ INVENTORY_OPERATION : owns

    CATEGORY ||--o{ PRODUCT : classifies
    PRODUCT ||--o{ STOCK_BALANCE : has
    LOCATION ||--o{ STOCK_BALANCE : stores

    PRODUCT ||--o{ INVENTORY_OPERATION_ITEM : included_in
    INVENTORY_OPERATION ||--o{ INVENTORY_OPERATION_ITEM : contains
    INVENTORY_OPERATION ||--o{ STOCK_LEDGER : generates
    INVENTORY_OPERATION_ITEM ||--o{ STOCK_LEDGER : explains
    PRODUCT ||--o{ STOCK_LEDGER : moves
    LOCATION ||--o{ STOCK_LEDGER : source_or_destination
```

### Tables and responsibilities

#### `users`

Stores authentication, role, and optional warehouse assignment.

| Column | Description |
| --- | --- |
| `id` | UUID primary key |
| `username` | Unique login identifier |
| `email` | Unique email address |
| `password_hash` | Password hash |
| `first_name`, `last_name` | Optional profile fields |
| `role` | `MANAGER` or `STAFF` |
| `warehouse_id` | Optional assigned warehouse |
| `created_at`, `updated_at` | Audit timestamps |

#### `password_reset_otps`

Stores hashed, expiring, single-use password reset codes.

| Column | Description |
| --- | --- |
| `id` | UUID primary key |
| `user_id` | User foreign key |
| `code_hash` | Hashed OTP value |
| `expires_at` | Expiration timestamp |
| `used_at` | Nullable consumption timestamp |

#### `warehouses`

Stores physical warehouses.

| Column | Constraint or description |
| --- | --- |
| `id` | UUID primary key |
| `name` | Unique warehouse name |
| `code` | Unique warehouse code |
| `address` | Optional address |
| `created_at`, `updated_at` | Audit timestamps |

#### `locations`

Stores physical locations within warehouses, such as receiving bays, racks, and storage areas.

| Column | Constraint or description |
| --- | --- |
| `id` | UUID primary key |
| `warehouse_id` | Warehouse foreign key |
| `name` | Location name |
| `code` | Unique within its warehouse |
| `created_at`, `updated_at` | Audit timestamps |

The composite constraint `UNIQUE(warehouse_id, code)` allows the same location code in different warehouses while preventing duplicates within one warehouse.

#### `categories`

Stores product categories. Category names are unique.

#### `products`

Stores product identity and commercial information. Products do not contain location fields.

| Column | Description |
| --- | --- |
| `id` | UUID primary key |
| `name` | Product name |
| `sku` | Unique stock-keeping unit |
| `category_id` | Category foreign key |
| `uom` | String unit such as `PCS`, `KG`, `M`, or `BOX` |
| `unit_cost` | Decimal unit cost |
| `reorder_point` | Default low-stock threshold |

#### `reorder_rules`

Stores optional product-specific replenishment thresholds.

| Column | Description |
| --- | --- |
| `product_id` | Unique product foreign key |
| `min_qty` | Low-stock threshold |
| `max_qty` | Suggested replenishment target |
| `is_active` | Whether the rule is active |

#### `stock_balances`

Stores the current balance of each product at each location.

| Column | Description |
| --- | --- |
| `product_id` | Product foreign key |
| `location_id` | Location foreign key |
| `on_hand_qty` | Current physical quantity |
| `reserved_qty` | Quantity reserved for pending workflows |
| `updated_at` | Last balance update |

The composite constraint `UNIQUE(product_id, location_id)` ensures exactly one current balance per product/location pair.

The available quantity is calculated as:

```text
free_to_use = on_hand_qty - reserved_qty
```

#### `inventory_operations`

Shared header for receipts, deliveries, transfers, and adjustments.

It contains the operation type, status, reference, warehouse, optional locations, responsible user, contact information, scheduling data, and lifecycle timestamps.

#### `inventory_operation_items`

Stores the products and quantities belonging to an inventory operation. The composite constraint `UNIQUE(operation_id, product_id)` prevents duplicate product lines within one operation.

#### `stock_ledger`

Append-oriented history of validated inventory movements. Ledger records reference the operation, operation item, product, optional source/destination locations, quantity, movement type, performing user, and movement timestamp.

## API Surface

### Master data

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/warehouses` | List or create warehouses |
| `GET`, `PATCH` | `/api/warehouses/:id` | Read or update a warehouse |
| `GET`, `POST` | `/api/warehouses/:id/locations` | List or create locations |
| `GET`, `PATCH` | `/api/locations/:id` | Read or update a location |
| `GET`, `POST` | `/api/categories` | List or create categories |
| `GET`, `PATCH` | `/api/categories/:id` | Read or update a category |
| `GET`, `POST` | `/api/products` | List or create products |
| `GET`, `PATCH` | `/api/products/:id` | Read or update a product |
| `GET` | `/api/reorder-rules` | List reorder rules |
| `POST` | `/api/reorder-rules` | Create a reorder rule |
| `GET`, `PATCH`, `DELETE` | `/api/reorder-rules/:id` | Manage one reorder rule |

### Stock and dashboard reads

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/stock` | Paginated stock balances with filters |
| `GET` | `/api/products/:id/stock` | Product stock by location |
| `GET` | `/api/locations/:id/stock` | Stock stored at a location |
| `GET` | `/api/alerts/low-stock` | Products below their effective threshold |
| `GET` | `/api/dashboard` | Dashboard KPIs and recent operation activity |

The stock endpoint supports `productId`, `warehouseId`, `locationId`, `categoryId`, `search`, `lowStock`, `page`, and `pageSize` filters.

### API response format

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Validation and application errors use:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required",
      "code": "too_small"
    }
  ]
}
```

## Frontend Integration Architecture

Frontend API integration follows this dependency direction:

```text
Page or component
    ↓
TanStack Query hook
    ↓
Feature service
    ↓
Shared HTTP client
    ↓
Next.js API route
    ↓
Domain service
    ↓
Prisma and Neon PostgreSQL
```

Feature services are located under `src/features/*/services`, query hooks under `src/features/*/hooks`, and shared API paths under `src/constants/api-endpoints.ts`.

The frontend uses TanStack Query for server-state caching, loading and error states, query invalidation, and warehouse, location, product, category, stock, dashboard, and alert reads.

## Local Development

### Prerequisites

- Node.js 18 or newer.
- npm.
- A PostgreSQL database or a Neon project.
- Git.

### Installation

```bash
git clone https://github.com/sarthakrawat498/StockSense.git
cd StockSense
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/stocksense"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST:PORT/stocksense"
BOOTSTRAP_MANAGER_PASSWORD="change-this-password"
```

For Neon, use the pooled connection for application runtime and the direct, unpooled connection for migrations and seeding.

Do not commit `.env` files or database credentials.

### Database setup

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Open Prisma Studio:

```bash
npm run db:studio
```

### Run the application

```bash
npm run dev
```

The development server runs at `http://localhost:3000` unless that port is already in use.

## Testing and Validation

```bash
npm run type-check
npx prisma validate
npm test
npm run test:coverage
npm run test:e2e
```

## Seeded Development Data

The seed script creates deterministic development data, including:

- One manager.
- Warehouse staff users.
- North and South distribution warehouses.
- Receiving and storage locations.
- Product categories and products.
- Stock balances at specific locations.
- Sample inventory operations and ledger entries.

The seed is designed to be idempotent and uses stable lookup keys for repeated development runs.

## Development Principles

- Keep stock balances and stock ledger records conceptually separate.
- Update stock and ledger entries in one database transaction.
- Validate operation-specific location rules in the service layer.
- Use decimal values for quantities and costs.
- Keep products independent from locations.
- Avoid adding enterprise entities that are outside the stated scope.
- Keep API route handlers thin and place business rules in domain services.
- Do not silently fall back to mock data after a frontend integration is complete.
- Preserve the standard API response envelope across endpoints.
