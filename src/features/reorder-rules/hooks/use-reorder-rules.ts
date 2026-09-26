"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ReorderRuleFilters } from "@/modules/reorder-rule";
import { reorderRulesService } from "../services/reorder-rules.service";

export function useReorderRules(filters: ReorderRuleFilters = {}) {
	return useQuery({ queryKey: QUERY_KEYS.reorderRules.all(filters as Record<string, unknown>), queryFn: () => reorderRulesService.list(filters) });
}

export function useReorderRule(id: string | null) {
	return useQuery({ queryKey: id ? QUERY_KEYS.reorderRules.detail(id) : ["reorderRules", "detail", "disabled"], queryFn: () => reorderRulesService.getById(id as string), enabled: Boolean(id) });
}
