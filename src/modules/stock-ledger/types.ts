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
}

export interface StockMoveFilters {
  productId?: string;
  warehouseId?: string;
  type?: StockMoveType;
  operationType?: OperationType;
  reference?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
