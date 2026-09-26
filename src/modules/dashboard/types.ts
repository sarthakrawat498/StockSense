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
  recentOperations: RecentOperation[];
}

export interface RecentOperation {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  warehouseName: string;
  responsibleUserName: string;
  scheduledDate?: string;
  createdAt: string;
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
