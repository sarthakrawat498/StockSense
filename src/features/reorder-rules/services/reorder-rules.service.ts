import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { ReorderRuleFilters, ReorderRuleList, CreateReorderRuleParams, UpdateReorderRuleParams, ReorderRule } from "@/modules/reorder-rule";

function queryString(filters: ReorderRuleFilters = {}) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) if (value !== undefined) params.set(key, String(value));
	const query = params.toString();
	return query ? `?${query}` : "";
}

export const reorderRulesService = {
	list: (filters: ReorderRuleFilters = {}) => httpClient.get<ReorderRuleList>(`${API.REORDER_RULES.BASE}${queryString(filters)}`),
	getById: (id: string) => httpClient.get<ReorderRule>(API.REORDER_RULES.BY_ID(id)),
	create: (input: CreateReorderRuleParams) => httpClient.post<ReorderRule>(API.REORDER_RULES.BASE, input),
	update: (id: string, input: UpdateReorderRuleParams) => httpClient.patch<ReorderRule>(API.REORDER_RULES.BY_ID(id), input),
	remove: (id: string) => httpClient.delete<ReorderRule>(API.REORDER_RULES.BY_ID(id)),
};
