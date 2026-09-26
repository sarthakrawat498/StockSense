import type { Timestamps, OperationStatus } from "@/types/common.types";

export interface ReceiptLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  demandQty: number;
  doneQty: number;
}

export interface Receipt extends Timestamps {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  supplierName?: string;
  status: OperationStatus;
  scheduledDate?: string;
  validatedAt?: string;
  notes?: string;
  lines: ReceiptLine[];
}

export interface CreateReceiptParams {
  warehouseId: string;
  supplierName?: string;
  scheduledDate?: string;
  notes?: string;
  lines: { productId: string; demandQty: number }[];
}

export interface UpdateReceiptParams {
  supplierName?: string;
  scheduledDate?: string;
  notes?: string;
  lines?: { id?: string; productId: string; demandQty: number; doneQty?: number }[];
}

export interface ReceiptFilters {
  warehouseId?: string;
  status?: OperationStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
