export interface LowStockAlert {
	productId: string;
	productName: string;
	sku: string;
	currentStock: number;
	reorderPoint: number;
	effectiveThreshold: number;
	suggestedQuantity: number;
	isOutOfStock: boolean;
}
