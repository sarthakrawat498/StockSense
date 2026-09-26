"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { CreateProductParams, UpdateProductParams } from "@/modules/product";
import { productsService } from "../services/products.service";

export function useProductMutations() {
	const queryClient = useQueryClient();
	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ["products"] });
		void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stock.all() });
	};
	return {
		createProduct: useMutation({ mutationFn: (input: CreateProductParams) => productsService.create(input), onSuccess: invalidate }),
		updateProduct: useMutation({ mutationFn: ({ id, input }: { id: string; input: UpdateProductParams }) => productsService.update(id, input), onSuccess: invalidate }),
	};
}
