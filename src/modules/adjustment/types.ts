import type { Timestamps, OperationStatus } from "@/types/common.types";

export interface AdjustmentLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  locationId?: string;
  locationName?: string;
  theoreticalQty: number;
  countedQty: number;
  difference: number;
}

export interface Adjustment extends Timestamps {
  id: string;
  reference: string;
  reason?: string;
  status: OperationStatus;
  validatedAt?: string;
  notes?: string;
  lines: AdjustmentLine[];
}

export interface CreateAdjustmentParams {
  reason?: string;
  notes?: string;
  lines: { productId: string; locationId?: string; countedQty: number }[];
}

export interface UpdateAdjustmentParams {
  reason?: string;
  notes?: string;
  lines?: { id?: string; productId: string; locationId?: string; countedQty: number }[];
}

export interface AdjustmentFilters {
  status?: OperationStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
