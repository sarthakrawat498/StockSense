"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { CreateReorderRuleParams, UpdateReorderRuleParams } from "@/modules/reorder-rule";
import { reorderRulesService } from "../services/reorder-rules.service";

export function useReorderRuleMutations() {
	const queryClient = useQueryClient();
	const invalidate = () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reorderRules.all() }); void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all() }); void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stock.all() }); };
	return {
		create: useMutation({ mutationFn: (input: CreateReorderRuleParams) => reorderRulesService.create(input), onSuccess: invalidate }),
		update: useMutation({ mutationFn: ({ id, input }: { id: string; input: UpdateReorderRuleParams }) => reorderRulesService.update(id, input), onSuccess: invalidate }),
		remove: useMutation({ mutationFn: (id: string) => reorderRulesService.remove(id), onSuccess: invalidate }),
	};
}
