"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { StockQueryFilters } from "@/modules/stock-ledger";
import { stockService } from "../services/stock.service";

export function useStock(filters: StockQueryFilters = {}) {
	return useQuery({ queryKey: QUERY_KEYS.stock.all(filters as Record<string, unknown>), queryFn: () => stockService.list(filters) });
}

export function useLocationStock(locationId: string | null) {
	return useQuery({ queryKey: locationId ? QUERY_KEYS.stock.location(locationId) : ["stock", "location", "disabled"], queryFn: () => stockService.getLocationStock(locationId as string), enabled: Boolean(locationId) });
}
