import type { Timestamps, OperationStatus } from "@/types/common.types";

export interface TransferLine {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  demandQty: number;
  doneQty: number;
}

export interface Transfer extends Timestamps {
  id: string;
  reference: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  fromLocationId?: string;
  toLocationId?: string;
  status: OperationStatus;
  scheduledDate?: string;
  validatedAt?: string;
  notes?: string;
  lines: TransferLine[];
}

export interface CreateTransferParams {
  fromWarehouseId: string;
  toWarehouseId: string;
  fromLocationId?: string;
  toLocationId?: string;
  scheduledDate?: string;
  notes?: string;
  lines: { productId: string; demandQty: number }[];
}

export interface UpdateTransferParams {
  fromLocationId?: string;
  toLocationId?: string;
  scheduledDate?: string;
  notes?: string;
  lines?: { id?: string; productId: string; demandQty: number; doneQty?: number }[];
}

export interface TransferFilters {
  fromWarehouseId?: string;
  toWarehouseId?: string;
  status?: OperationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}
