import { operationsApi, type CreateOperationPayload } from "../../services/operations-api";

export const adjustmentsApi = {
  list: (params?: { search?: string; status?: string; warehouseId?: string; page?: number; pageSize?: number }) =>
    operationsApi.list("ADJUSTMENT", params),
  getById: (id: string) => operationsApi.getById("ADJUSTMENT", id),
  create: (payload: CreateOperationPayload) => operationsApi.create("ADJUSTMENT", payload),
  confirm: (id: string) => operationsApi.confirm("ADJUSTMENT", id),
  cancel: (id: string) => operationsApi.cancel("ADJUSTMENT", id),
};
