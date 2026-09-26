/**
 * Common domain enums and utility types shared across the entire codebase.
 * These mirror the Prisma enums so the frontend has type-safe copies without
 * importing from @prisma/client (which is server-only).
 */

export type UserRole = "MANAGER" | "STAFF";

export type OperationStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";

export type OperationType = "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";

export type StockMovementType =
  | "RECEIPT"
  | "DELIVERY"
  | "TRANSFER"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

/** Alias for backward compatibility */
export type StockMoveType = StockMovementType;

/** Utility type: make specific keys required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Utility type: make all keys optional except specified */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/** Timestamps added by Prisma */
export interface Timestamps {
  createdAt: string; // ISO string on the client
  updatedAt: string;
}

/** Paginated response wrapper */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
