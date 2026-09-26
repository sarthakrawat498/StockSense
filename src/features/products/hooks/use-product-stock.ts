"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { productsService } from "../services/products.service";

export function useProductStock(productId: string | null) {
	return useQuery({
		queryKey: productId ? QUERY_KEYS.products.stock(productId) : ["products", "stock", "disabled"],
		queryFn: () => productsService.getStock(productId as string),
		enabled: Boolean(productId),
	});
}
