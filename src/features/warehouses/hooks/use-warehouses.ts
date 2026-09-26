"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { warehousesService } from "../services/warehouses.service";

export function useWarehouses() {
	return useQuery({ queryKey: QUERY_KEYS.warehouses.all(), queryFn: warehousesService.list });
}
