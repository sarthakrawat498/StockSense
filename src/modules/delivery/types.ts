import type { OperationStatus } from "@/types/common.types";

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export interface CreateDeliveryInput {
  warehouseId: string;
  fromLocationId: string;
  contactName?: string;
  address?: string;
  scheduledDate?: string;
  responsibleUserId?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface UpdateDeliveryInput {
  contactName?: string;
  address?: string;
  scheduledDate?: string;
  fromLocationId?: string;
  items?: Array<{ id?: string; productId: string; quantity: number }>;
}

export interface DeliveryFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
