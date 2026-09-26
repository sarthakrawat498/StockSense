import {
  NotFoundError,
  InvalidStatusTransitionError,
} from "@/lib/errors/app-error";
import { InventoryOperationService } from "@/modules/inventory-operation";
import { TransferReader } from "./internal/transfer-reader";
import { TransferWriter } from "./internal/transfer-writer";
import type {
  CreateTransferInput,
  UpdateTransferInput,
  TransferFilters,
} from "./types";

/**
 * Transfer service — public API for internal transfer operations.
 */
export class TransferService {
  static async list(filters: TransferFilters) {
    return TransferReader.findMany(filters);
  }

  static async getById(id: string) {
    const transfer = await TransferReader.findById(id);
    if (!transfer) {
      throw new NotFoundError("Transfer", id);
    }
    return transfer;
  }

  static async create(input: CreateTransferInput) {
    return TransferWriter.create(input);
  }

  static async update(id: string, input: UpdateTransferInput) {
    const existing = await TransferReader.findById(id);
    if (!existing) {
      throw new NotFoundError("Transfer", id);
    }
    if (existing.status !== "DRAFT") {
      throw new InvalidStatusTransitionError(
        existing.status,
        "Cannot edit a non-DRAFT transfer",
      );
    }
    return TransferWriter.update(id, input);
  }

  static async confirm(id: string, performedById?: string) {
    return InventoryOperationService.confirm(id, performedById);
  }

  static async cancel(id: string) {
    return InventoryOperationService.cancel(id);
  }
}
