import type { OperationStatus, OperationType } from "@prisma/client";

export interface DashboardFilters {
  warehouseId?: string;
  categoryId?: string;
  operationType?: OperationType;
  status?: OperationStatus;
}

export interface DashboardKPIs {
  totalProductsInStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export interface DashboardAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  effectiveThreshold: number;
  suggestedQuantity?: number;
  isOutOfStock: boolean;
}
