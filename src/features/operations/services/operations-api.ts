import { API } from "@/constants/api-endpoints";
import type { OperationType, OperationStatus, PaginatedResult } from "@/types/common.types";

export interface OperationListItem {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  warehouseId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  contactName: string | null;
  address?: string | null;
  scheduledDate: string | null;
  validatedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  warehouse?: { id: string; name: string; code: string };
  fromLocation?: { id: string; name: string; code: string } | null;
  toLocation?: { id: string; name: string; code: string } | null;
  responsibleUser?: { id: string; username: string };
  _count?: { items: number };
  items?: OperationDetailItem[];
}

export interface OperationDetailItem {
  id: string;
  operationId: string;
  productId: string;
  quantity: number | string;
  countedQuantity?: number | string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    uom: string;
    unitCost?: number | string;
  };
}

export interface OperationDetail extends OperationListItem {
  notes?: string | null;
  items: OperationDetailItem[];
  responsibleUser: { id: string; username: string; email?: string };
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

export interface LocationOption {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  uom: string;
  unitCost?: string | number;
}

export interface CreateOperationPayload {
  warehouseId: string;
  fromLocationId?: string;
  toLocationId?: string;
  contactName?: string;
  address?: string;
  scheduledDate?: string;
  notes?: string;
  responsibleUserId?: string;
  items: Array<{
    productId: string;
    quantity?: number;
    countedQuantity?: number;
  }>;
}

function getEndpointConfig(type: OperationType) {
  switch (type) {
    case "RECEIPT":
      return API.RECEIPTS;
    case "DELIVERY":
      return API.DELIVERIES;
    case "TRANSFER":
      return API.TRANSFERS;
    case "ADJUSTMENT":
      return API.ADJUSTMENTS;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const errorMsg = body?.message || body?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return body.data as T;
}

export const operationsApi = {
  async list(
    type: OperationType,
    params?: { search?: string; status?: string; warehouseId?: string; page?: number; pageSize?: number }
  ): Promise<PaginatedResult<OperationListItem>> {
    const ep = getEndpointConfig(type);
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "all") searchParams.set("status", params.status);
    if (params?.warehouseId && params.warehouseId !== "all") searchParams.set("warehouseId", params.warehouseId);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

    const url = `${ep.BASE}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return requestJson<PaginatedResult<OperationListItem>>(url);
  },

  async getById(type: OperationType, id: string): Promise<OperationDetail> {
    const ep = getEndpointConfig(type);
    return requestJson<OperationDetail>(ep.BY_ID(id));
  },

  async create(type: OperationType, payload: CreateOperationPayload): Promise<OperationDetail> {
    const ep = getEndpointConfig(type);

    // Format specific fields for adjustments vs standard movements
    let body: Record<string, unknown>;

    if (type === "ADJUSTMENT") {
      body = {
        warehouseId: payload.warehouseId,
        toLocationId: payload.toLocationId,
        responsibleUserId: payload.responsibleUserId,
        items: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          countedQuantity: item.countedQuantity ?? item.quantity ?? 0,
        })),
      };
    } else if (type === "TRANSFER") {
      body = {
        warehouseId: payload.warehouseId,
        fromLocationId: payload.fromLocationId,
        toLocationId: payload.toLocationId,
        scheduledDate: payload.scheduledDate || undefined,
        responsibleUserId: payload.responsibleUserId,
        items: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity ?? 1,
        })),
      };
    } else if (type === "DELIVERY") {
      body = {
        warehouseId: payload.warehouseId,
        fromLocationId: payload.fromLocationId,
        contactName: payload.contactName || undefined,
        address: payload.address || undefined,
        scheduledDate: payload.scheduledDate || undefined,
        responsibleUserId: payload.responsibleUserId,
        items: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity ?? 1,
        })),
      };
    } else {
      // RECEIPT
      body = {
        warehouseId: payload.warehouseId,
        toLocationId: payload.toLocationId,
        contactName: payload.contactName || undefined,
        address: payload.address || undefined,
        scheduledDate: payload.scheduledDate || undefined,
        responsibleUserId: payload.responsibleUserId,
        items: payload.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity ?? 1,
        })),
      };
    }

    return requestJson<OperationDetail>(ep.BASE, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async confirm(type: OperationType, id: string): Promise<OperationDetail> {
    const ep = getEndpointConfig(type);
    return requestJson<OperationDetail>(ep.CONFIRM(id), {
      method: "POST",
    });
  },

  async cancel(type: OperationType, id: string): Promise<OperationDetail> {
    const ep = getEndpointConfig(type);
    return requestJson<OperationDetail>(ep.CANCEL(id), {
      method: "POST",
    });
  },

  async fetchWarehouses(): Promise<WarehouseOption[]> {
    return requestJson<WarehouseOption[]>(API.WAREHOUSES.BASE);
  },

  async fetchLocations(warehouseId: string): Promise<LocationOption[]> {
    return requestJson<LocationOption[]>(API.WAREHOUSES.LOCATIONS(warehouseId));
  },

  async fetchProducts(): Promise<ProductOption[]> {
    const data = await requestJson<{ items: ProductOption[] }>(`${API.PRODUCTS.BASE}?pageSize=100`);
    return data.items || [];
  },
};
