"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { warehousesService } from "../services/warehouses.service";

export function useWarehouses() {
	return useQuery({ queryKey: QUERY_KEYS.warehouses.all(), queryFn: warehousesService.list });
}

export function useWarehouse(id: string | null) {
	return useQuery({
		queryKey: id ? QUERY_KEYS.warehouses.detail(id) : ["warehouses", "detail", "disabled"],
		queryFn: () => warehousesService.getById(id as string),
		enabled: Boolean(id),
	});
}
