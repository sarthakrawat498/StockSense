import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { PaginatedStockResponse, StockQueryFilters, StockBalanceRow } from "@/modules/stock-ledger";
import type { ProductStock } from "@/modules/product";

function queryString(filters: StockQueryFilters = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
	const query = params.toString();
	return query ? `?${query}` : "";
}

export const stockService = {
	list: (filters: StockQueryFilters = {}) => httpClient.get<PaginatedStockResponse>(`${API.STOCK.BASE}${queryString(filters)}`),
	getProductStock: (productId: string) => httpClient.get<ProductStock>(API.PRODUCTS.STOCK(productId)),
	getLocationStock: (locationId: string) => httpClient.get<StockBalanceRow[]>(`${API.LOCATIONS.BY_ID(locationId)}/stock`),
};
