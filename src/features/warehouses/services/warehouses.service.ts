import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { Location, Warehouse } from "@/modules/warehouse";

export const warehousesService = {
	list: () => httpClient.get<Warehouse[]>(API.WAREHOUSES.BASE),
	getById: (id: string) => httpClient.get<Warehouse>(API.WAREHOUSES.BY_ID(id)),
	create: (input: { name: string; code: string; address?: string }) => httpClient.post<Warehouse>(API.WAREHOUSES.BASE, input),
	update: (id: string, input: { name?: string; address?: string }) => httpClient.patch<Warehouse>(API.WAREHOUSES.BY_ID(id), input),
	listLocations: (warehouseId: string) => httpClient.get<Location[]>(API.WAREHOUSES.LOCATIONS(warehouseId)),
	createLocation: (warehouseId: string, input: { name: string; code: string }) => httpClient.post<Location>(API.WAREHOUSES.LOCATIONS(warehouseId), input),
	getLocation: (id: string) => httpClient.get<Location>(API.LOCATIONS.BY_ID(id)),
	updateLocation: (id: string, input: { name: string }) => httpClient.patch<Location>(API.LOCATIONS.BY_ID(id), input),
};
