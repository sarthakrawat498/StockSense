import {
  NotFoundError,
  InvalidStatusTransitionError,
} from "@/lib/errors/app-error";
import { InventoryOperationService } from "@/modules/inventory-operation";
import { AdjustmentReader } from "./internal/adjustment-reader";
import { AdjustmentWriter } from "./internal/adjustment-writer";
import type {
  CreateAdjustmentInput,
  UpdateAdjustmentInput,
  AdjustmentFilters,
} from "./types";

/**
 * Adjustment service — public API for inventory adjustment operations.
 */
export class AdjustmentService {
  static async list(filters: AdjustmentFilters) {
    return AdjustmentReader.findMany(filters);
  }

  static async getById(id: string) {
    const adjustment = await AdjustmentReader.findById(id);
    if (!adjustment) {
      throw new NotFoundError("Adjustment", id);
    }
    return adjustment;
  }

  static async create(input: CreateAdjustmentInput) {
    return AdjustmentWriter.create(input);
  }

  static async update(id: string, input: UpdateAdjustmentInput) {
    const existing = await AdjustmentReader.findById(id);
    if (!existing) {
      throw new NotFoundError("Adjustment", id);
    }
    if (existing.status !== "DRAFT") {
      throw new InvalidStatusTransitionError(
        existing.status,
        "Cannot edit a non-DRAFT adjustment",
      );
    }
    return AdjustmentWriter.update(id, input);
  }

  static async confirm(id: string, performedById?: string) {
    return InventoryOperationService.confirm(id, performedById);
  }

  static async cancel(id: string) {
    return InventoryOperationService.cancel(id);
  }
}
