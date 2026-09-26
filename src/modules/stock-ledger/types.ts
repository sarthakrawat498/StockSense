import type { StockMoveType, OperationType } from "@/types/common.types";

export interface StockMove {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  quantity: number;
  type: StockMoveType;
  operationType: OperationType;
  reference: string;
  createdAt: string;
  movedAt: string;
}

export interface StockMoveFilters {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  operationType?: OperationType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
