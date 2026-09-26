"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { StockMoveFilters } from "@/modules/stock-ledger";
import { moveHistoryService } from "../services/move-history.service";

export function useMoveHistory(filters: StockMoveFilters = {}) {
	return useQuery({
		queryKey: QUERY_KEYS.stockMoves.all(filters as Record<string, unknown>),
		queryFn: () => moveHistoryService.list(filters),
	});
}

export function useMoveHistoryEntry(id: string | null) {
	return useQuery({
		queryKey: id ? QUERY_KEYS.stockMoves.detail(id) : ["stockMoves", "detail", "disabled"],
		queryFn: () => moveHistoryService.getById(id as string),
		enabled: Boolean(id),
	});
}
