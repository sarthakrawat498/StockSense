"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { categoriesService } from "../services/categories.service";

export function useCategories() {
	return useQuery({ queryKey: QUERY_KEYS.categories.all(), queryFn: categoriesService.list });
}
