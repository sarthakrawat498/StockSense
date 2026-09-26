import type { Timestamps } from "@/types/common.types";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export interface Product extends Timestamps {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: Category;
  uom: string;
  unitCost: string;
  reorderPoint: number;
  /** Computed: total on-hand qty across all locations */
  totalStock?: number;
  /** Computed: true if totalStock <= reorderPoint */
  isLowStock?: boolean;
}

export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  locationName?: string;
  warehouseName?: string;
  onHandQty: number;
  reservedQty: number;
  freeQty: number;
}

export interface ProductStock {
  productId: string;
  balances: StockLevel[];
  totalOnHand: number;
  totalReserved: number;
  totalFree: number;
}

export interface ReorderRule {
  id: string;
  productId: string;
  minQty: number;
  maxQty: number;
  isActive: boolean;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateProductParams {
  name: string;
  sku: string;
  categoryId: string;
  uom: string;
  unitCost: string;
  reorderPoint?: number;
  initialStock?: number;
  initialLocationId?: string;
  actorId?: string;
}

export interface UpdateProductParams {
  name?: string;
  categoryId?: string;
  uom?: string;
  unitCost?: string;
  reorderPoint?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
}
