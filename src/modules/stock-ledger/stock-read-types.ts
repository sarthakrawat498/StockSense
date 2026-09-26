import type { PaginatedResponse } from "@/types/api.types";

export interface StockBalanceRow {
	id: string;
	productId: string;
	productName: string;
	sku: string;
	categoryId: string;
	categoryName: string;
	warehouseId: string;
	warehouseName: string;
	locationId: string;
	locationName: string;
	onHandQty: number;
	reservedQty: number;
	freeQty: number;
	reorderPoint: number;
	isLowStock: boolean;
}

export type PaginatedStockResponse = PaginatedResponse<StockBalanceRow>;

export interface StockQueryFilters {
	productId?: string;
	warehouseId?: string;
	locationId?: string;
	categoryId?: string;
	search?: string;
	lowStock?: boolean;
	page?: number;
	pageSize?: number;
}
