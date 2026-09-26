import { operationsApi, type CreateOperationPayload } from "../../services/operations-api";

export const deliveriesApi = {
  list: (params?: { search?: string; status?: string; warehouseId?: string; page?: number; pageSize?: number }) =>
    operationsApi.list("DELIVERY", params),
  getById: (id: string) => operationsApi.getById("DELIVERY", id),
  create: (payload: CreateOperationPayload) => operationsApi.create("DELIVERY", payload),
  confirm: (id: string) => operationsApi.confirm("DELIVERY", id),
  cancel: (id: string) => operationsApi.cancel("DELIVERY", id),
};
