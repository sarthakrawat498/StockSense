import type { OperationStatus } from "@/types/common.types";

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateAdjustmentInput {
  warehouseId: string;
  /** The location being adjusted */
  toLocationId: string;
  responsibleUserId?: string;
  items: Array<{
    productId: string;
    /** Recorded/theoretical quantity (defaults to current stock if omitted) */
    quantity?: number;
    /** Physical count (what is actually there) */
    countedQuantity: number;
  }>;
}

export interface UpdateAdjustmentInput {
  toLocationId?: string;
  items?: Array<{
    id?: string;
    productId: string;
    quantity: number;
    countedQuantity: number;
  }>;
}

export interface AdjustmentFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
