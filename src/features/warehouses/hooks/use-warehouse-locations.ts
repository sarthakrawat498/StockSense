"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { warehousesService } from "../services/warehouses.service";

export function useWarehouseLocations(warehouseId: string | null) {
	return useQuery({
		queryKey: warehouseId ? QUERY_KEYS.warehouses.locations(warehouseId) : ["warehouses", "locations", "disabled"],
		queryFn: () => warehousesService.listLocations(warehouseId as string),
		enabled: Boolean(warehouseId),
	});
}
