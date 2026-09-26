"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { categoriesService } from "../services/categories.service";

export function useCategoryMutations() {
	const queryClient = useQueryClient();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.all() });
	return {
		createCategory: useMutation({ mutationFn: categoriesService.create, onSuccess: invalidate }),
		updateCategory: useMutation({ mutationFn: ({ id, input }: { id: string; input: { name: string } }) => categoriesService.update(id, input), onSuccess: invalidate }),
	};
}
