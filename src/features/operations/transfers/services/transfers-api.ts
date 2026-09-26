import { operationsApi, type CreateOperationPayload } from "../../services/operations-api";

export const transfersApi = {
  list: (params?: { search?: string; status?: string; warehouseId?: string; page?: number; pageSize?: number }) =>
    operationsApi.list("TRANSFER", params),
  getById: (id: string) => operationsApi.getById("TRANSFER", id),
  create: (payload: CreateOperationPayload) => operationsApi.create("TRANSFER", payload),
  confirm: (id: string) => operationsApi.confirm("TRANSFER", id),
  cancel: (id: string) => operationsApi.cancel("TRANSFER", id),
};
