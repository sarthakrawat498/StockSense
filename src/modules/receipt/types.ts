import type { OperationStatus } from "@/types/common.types";

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateReceiptInput {
  warehouseId: string;
  toLocationId: string;
  contactName?: string;
  address?: string;
  scheduledDate?: string;
  responsibleUserId?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface UpdateReceiptInput {
  contactName?: string;
  address?: string;
  scheduledDate?: string;
  toLocationId?: string;
  items?: Array<{ id?: string; productId: string; quantity: number }>;
}

export interface ReceiptFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
