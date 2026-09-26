"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ProductFilters } from "@/modules/product";
import { productsService } from "../services/products.service";

export function useProducts(filters: ProductFilters = {}) {
	return useQuery({ queryKey: QUERY_KEYS.products.all(filters as Record<string, unknown>), queryFn: () => productsService.list(filters) });
}
