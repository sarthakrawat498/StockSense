import type { OperationStatus } from "@/types/common.types";

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateTransferInput {
  warehouseId: string;
  fromLocationId: string;
  toLocationId: string;
  scheduledDate?: string;
  responsibleUserId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface UpdateTransferInput {
  fromLocationId?: string;
  toLocationId?: string;
  scheduledDate?: string;
  items?: Array<{ id?: string; productId: string; quantity: number }>;
}

export interface TransferFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
