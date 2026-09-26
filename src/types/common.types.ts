/**
 * Common domain enums and utility types shared across the entire codebase.
 * These mirror the Prisma enums so the frontend has type-safe copies without
 * importing from @prisma/client (which is server-only).
 */

export type UserRole = "MANAGER" | "STAFF";

export type OperationStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";

export type OperationType = "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";

export type StockMoveType = "IN" | "OUT" | "TRANSFER" | "ADJUST";

/** Utility type: make specific keys required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Utility type: make all keys optional except specified */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/** Timestamps added by Prisma */
export interface Timestamps {
  createdAt: string; // ISO string on the client
  updatedAt: string;
}
