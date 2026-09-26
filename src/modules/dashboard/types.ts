/**
 * Dashboard KPI types — aggregated stats for the main dashboard view.
 */
export interface DashboardKPIs {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
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
