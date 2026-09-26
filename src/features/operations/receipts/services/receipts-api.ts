import { operationsApi, type CreateOperationPayload } from "../../services/operations-api";

export const receiptsApi = {
  list: (params?: { search?: string; status?: string; warehouseId?: string; page?: number; pageSize?: number }) =>
    operationsApi.list("RECEIPT", params),
  getById: (id: string) => operationsApi.getById("RECEIPT", id),
  create: (payload: CreateOperationPayload) => operationsApi.create("RECEIPT", payload),
  confirm: (id: string) => operationsApi.confirm("RECEIPT", id),
  cancel: (id: string) => operationsApi.cancel("RECEIPT", id),
};
