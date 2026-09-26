"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { productsService } from "../services/products.service";

export function useProduct(productId: string | null) {
	return useQuery({ queryKey: productId ? QUERY_KEYS.products.detail(productId) : ["products", "detail", "disabled"], queryFn: () => productsService.getById(productId as string), enabled: Boolean(productId) });
}
