import {
  NotFoundError,
  InvalidStatusTransitionError,
} from "@/lib/errors/app-error";
import { InventoryOperationService } from "@/modules/inventory-operation";
import { ReceiptReader } from "./internal/receipt-reader";
import { ReceiptWriter } from "./internal/receipt-writer";
import type {
  CreateReceiptInput,
  UpdateReceiptInput,
  ReceiptFilters,
} from "./types";

/**
 * Receipt service — public API for receipt operations.
 *
 * CRUD + confirm/cancel, delegating stock logic to the shared
 * InventoryOperationService.
 */
export class ReceiptService {
  // ─── Queries ─────────────────────────────────────────────────────────────

  static async list(filters: ReceiptFilters) {
    return ReceiptReader.findMany(filters);
  }

  static async getById(id: string) {
    const receipt = await ReceiptReader.findById(id);
    if (!receipt) {
      throw new NotFoundError("Receipt", id);
    }
    return receipt;
  }

  // ─── Mutations ───────────────────────────────────────────────────────────

  static async create(input: CreateReceiptInput) {
    return ReceiptWriter.create(input);
  }

  static async update(id: string, input: UpdateReceiptInput) {
    // Only DRAFT receipts can be edited
    const existing = await ReceiptReader.findById(id);
    if (!existing) {
      throw new NotFoundError("Receipt", id);
    }
    if (existing.status !== "DRAFT") {
      throw new InvalidStatusTransitionError(
        existing.status,
        "Cannot edit a non-DRAFT receipt",
      );
    }
    return ReceiptWriter.update(id, input);
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  static async confirm(id: string, performedById?: string) {
    return InventoryOperationService.confirm(id, performedById);
  }

  static async cancel(id: string) {
    return InventoryOperationService.cancel(id);
  }
}
