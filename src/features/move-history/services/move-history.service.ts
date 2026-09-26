import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { PaginatedResponse } from "@/types/api.types";
import type { StockMove, StockMoveFilters } from "@/modules/stock-ledger";

function queryString(filters: StockMoveFilters = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== "") params.set(key, String(value));
	}
	const query = params.toString();
	return query ? `?${query}` : "";
}

export const moveHistoryService = {
	list: (filters: StockMoveFilters = {}) => httpClient.get<PaginatedResponse<StockMove>>(`${API.STOCK_LEDGER.BASE}${queryString(filters)}`),
	getById: (id: string) => httpClient.get<StockMove>(`${API.STOCK_LEDGER.BASE}/${id}`),
};
