"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { warehousesService } from "../services/warehouses.service";

export function useWarehouseMutations() {
	const queryClient = useQueryClient();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses.all() });

	const createWarehouse = useMutation({ mutationFn: warehousesService.create, onSuccess: invalidate });
	const updateWarehouse = useMutation({ mutationFn: ({ id, input }: { id: string; input: { name?: string; address?: string } }) => warehousesService.update(id, input), onSuccess: invalidate });
	const createLocation = useMutation({ mutationFn: ({ warehouseId, input }: { warehouseId: string; input: { name: string; code: string } }) => warehousesService.createLocation(warehouseId, input), onSuccess: (_, variables) => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses.locations(variables.warehouseId) }); void invalidate(); } });
	const updateLocation = useMutation({ mutationFn: ({ id, input }: { id: string; input: { name: string } }) => warehousesService.updateLocation(id, input) });

	return { createWarehouse, updateWarehouse, createLocation, updateLocation };
}
