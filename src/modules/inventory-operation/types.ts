import type { OperationType } from "@/types/common.types";

/**
 * Input for the shared confirmation handler.
 * Each operation-specific service constructs this before calling
 * InventoryOperationService.confirm().
 */
export interface ConfirmOperationInput {
  operationId: string;
  performedById: string;
}

/**
 * Input for the shared cancel handler.
 */
export interface CancelOperationInput {
  operationId: string;
}

/**
 * Shape returned by the reference generator.
 */
export interface ReferenceInfo {
  reference: string;
  operationType: OperationType;
  warehouseCode: string;
}
