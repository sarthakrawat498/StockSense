import type { Timestamps, OperationStatus } from "@/types/common.types";

export interface DeliveryLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  demandQty: number;
  doneQty: number;
}

export interface Delivery extends Timestamps {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  customerName?: string;
  status: OperationStatus;
  scheduledDate?: string;
  validatedAt?: string;
  notes?: string;
  lines: DeliveryLine[];
}

export interface CreateDeliveryParams {
  warehouseId: string;
  customerName?: string;
  scheduledDate?: string;
  notes?: string;
  lines: { productId: string; demandQty: number }[];
}

export interface UpdateDeliveryParams {
  customerName?: string;
  scheduledDate?: string;
  notes?: string;
  lines?: { id?: string; productId: string; demandQty: number; doneQty?: number }[];
}

export interface DeliveryFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
