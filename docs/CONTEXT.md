# StockSense — Agent Context

## What is this project?

StockSense is a modular Inventory Management System (IMS) built for the Odoo Hackathon.
The goal is to replace manual registers and Excel sheets with a centralized, real-time stock tracking app.

Target users: Inventory Managers and Warehouse Staff.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) — frontend and backend in one repo |
| Styling | TailwindCSS + shadcn/ui |
| Forms | react-hook-form + Zod |
| Server state | TanStack Query (React Query v5) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Custom JWT (`jose` + `bcryptjs`), stored as httpOnly cookies |
| Language | TypeScript (strict mode) |
| Path alias | `@/` maps to `src/` |

---

## Folder Structure

```
src/
  app/
    (auth)/               # Public pages: login, signup, forgot-password, reset-password
    (protected)/          # Authenticated pages (guarded by middleware)
      dashboard/
      products/
      operations/
        receipts/
        deliveries/
        transfers/
        adjustments/
      warehouses/
      move-history/
      settings/
      profile/
    api/                  # API route handlers (thin — just parse req, call module service, return response)
      auth/
      products/
      operations/
        receipts/
        deliveries/
        transfers/
        adjustments/
      warehouses/
      dashboard/
      stock-ledger/

  modules/                # Backend business logic — one folder per domain
    auth/
    product/
    warehouse/
    receipt/
    delivery/
    transfer/
    adjustment/
    stock-ledger/
    dashboard/

  features/               # Frontend feature modules — one folder per feature
    auth/
    dashboard/
    products/
    operations/
      receipts/
      deliveries/
      transfers/
      adjustments/
    warehouses/
    move-history/
    settings/

  components/             # Shared UI components
    ui/                   # shadcn/ui auto-generated components (do not edit manually)
    primitives/           # badge, typography
    layouts/              # app-shell, sidebar, header
    data-display/         # data-table, stats-card, status-badge
    feedback/             # loader, empty-state

  providers/              # Global React providers (QueryProvider, AuthProvider)
  hooks/                  # Shared hooks: use-debounce, use-local-storage, use-pagination
  lib/
    db/                   # Prisma client singleton
    auth/                 # JWT sign/verify, session helpers
    api/                  # apiSuccess / apiError response helpers, withAuth() middleware HOF
    utils/                # cn (tailwind merge), date formatters, general formatters
    errors/               # AppError base class + NotFoundError, ConflictError, etc.
  types/                  # Global TypeScript types: api.types.ts, common.types.ts, auth.types.ts
  constants/              # Routes, API endpoints, TanStack Query keys, app constants
  middleware.ts           # Next.js Edge Middleware — protects all routes under /(protected)
```

---

## Module Pattern (Backend)

Every module under `src/modules/<name>/` follows this structure:

```
<name>-service.ts     # Public API — the only file other modules import from
internal/
  <name>-reader.ts    # Read-only DB queries (uses Prisma)
  <name>-writer.ts    # Write/mutate DB operations (uses Prisma)
  <name>-util.ts      # Stateless helpers (hashing, formatting, calculations)
types.ts              # Domain types and DTOs for this module
index.ts              # Re-exports service + types — the public boundary
```

Rule: never import from `internal/` outside the module. Always go through `index.ts`.

---

## Feature Pattern (Frontend)

Every feature under `src/features/<name>/` follows this structure:

```
components/           # UI components specific to this feature (each in its own subfolder)
services/             # HTTP client functions that call the API routes
hooks/                # TanStack Query hooks (useQuery, useMutation) for this feature
schemas/              # Zod validation schemas for forms
types.ts              # Frontend-facing types for this feature
```

---

## Database Models (Prisma)

Key models defined in `prisma/schema.prisma`:

- **User** — email, hashedPassword, firstName, lastName, role (INVENTORY_MANAGER | WAREHOUSE_STAFF)
- **Product** — name, SKU, category, unit of measure, reorderPoint
- **Category** — product categories
- **UnitOfMeasure** — kg, pcs, litre, etc.
- **Warehouse** — name, code, address
- **Location** — belongs to a Warehouse, supports nested hierarchy (parentId)
- **StockLevel** — current on-hand quantity per product per location (updated on every validated operation)
- **Receipt** — incoming goods from vendor (lines: productId + demandQty + doneQty)
- **Delivery** — outgoing goods to customer (lines: productId + demandQty + doneQty)
- **Transfer** — internal movement between warehouses/locations
- **Adjustment** — physical count correction (theoreticalQty vs countedQty)
- **StockMove** — append-only ledger of every stock movement (never update/delete rows)
- **OtpToken** — for OTP-based password reset flow
- **ReorderRule** — min/max qty rules per product for low-stock alerts

---

## Operation Status Flow

All operations (Receipt, Delivery, Transfer, Adjustment) share the same status lifecycle:

```
DRAFT → WAITING → READY → DONE
                         ↘ CANCELED
```

On **validate** (READY → DONE):
- Receipt: StockLevel increases, StockMove IN record created
- Delivery: StockLevel decreases, StockMove OUT record created
- Transfer: StockLevel decreases at source, increases at destination, StockMove TRANSFER record created
- Adjustment: StockLevel set to countedQty, StockMove ADJUST record created for the difference

---

## API Conventions

- All responses use the shape: `{ success: boolean, data?: T, message?: string, errors?: [] }`
- Helper functions in `src/lib/api/response.ts`: `apiSuccess()`, `apiError()`, `apiNotFound()`, etc.
- Protected routes use `withAuth()` HOF from `src/lib/api/middleware.ts`
- Auth tokens are httpOnly cookies: `access_token` (15 min) and `refresh_token` (7 days)

---

## Constants — Always use these, never hardcode strings

- Route paths: `src/constants/routes.ts` → `ROUTES.DASHBOARD`, `ROUTES.RECEIPTS`, etc.
- API endpoints: `src/constants/api-endpoints.ts` → `API.RECEIPTS.BASE`, `API.RECEIPTS.VALIDATE(id)`, etc.
- Query keys: `src/constants/query-keys.ts` → `QUERY_KEYS.receipts.all()`, `QUERY_KEYS.products.detail(id)`, etc.
- App config: `src/constants/app.constants.ts` → pagination defaults, date formats, reference prefixes

---

## Key Rules

1. Pages (`app/(protected)/*/page.tsx`) are thin — they just render feature components, no logic inside.
2. API route handlers (`app/api/*/route.ts`) are thin — parse request, call module service, return response.
3. All business logic lives in `src/modules/`.
4. All UI/data-fetching logic lives in `src/features/`.
5. Shared UI components go in `src/components/`. Feature-specific components stay inside `src/features/`.
6. Import from module `index.ts` only — never from `internal/`.
7. Use `cn()` from `src/lib/utils/cn.ts` for all conditional Tailwind class merging.
8. Run `prisma generate` after any schema change. Run `prisma migrate dev` to apply migrations locally.
