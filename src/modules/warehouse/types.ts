import type { Timestamps } from "@/types/common.types";

export interface Warehouse extends Timestamps {
  id: string;
  name: string;
  code: string;
  address?: string;
  locationCount?: number;
}

export interface Location extends Timestamps {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  warehouseName?: string;
}

export interface CreateWarehouseParams {
  name: string;
  code: string;
  address?: string;
}

export interface UpdateWarehouseParams {
  name?: string;
  address?: string;
}

export interface CreateLocationParams {
  warehouseId: string;
  name: string;
  code: string;
}

export interface UpdateLocationParams {
  name?: string;
}
