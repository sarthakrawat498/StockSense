import type { Timestamps } from "@/types/common.types";

export interface Warehouse extends Timestamps {
  id: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  locationCount?: number;
}

export interface Location extends Timestamps {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  warehouseName?: string;
  parentId?: string;
  isActive: boolean;
  children?: Location[];
}

export interface CreateWarehouseParams {
  name: string;
  code: string;
  address?: string;
}

export interface UpdateWarehouseParams {
  name?: string;
  address?: string;
  isActive?: boolean;
}

export interface CreateLocationParams {
  warehouseId: string;
  name: string;
  code: string;
  parentId?: string;
}
