import type { Timestamps } from "@/types/common.types";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
}

export interface Product extends Timestamps {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId: string;
  category?: Category;
  unitId: string;
  unit?: UnitOfMeasure;
  reorderPoint: number;
  isActive: boolean;
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
  quantity: number;
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
  description?: string;
  categoryId: string;
  unitId: string;
  reorderPoint?: number;
  initialStock?: number;
  initialLocationId?: string;
}

export interface UpdateProductParams {
  name?: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  reorderPoint?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
