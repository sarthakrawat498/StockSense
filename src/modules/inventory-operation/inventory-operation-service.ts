import { prisma } from "@/lib/db";
import {
  InvalidStatusTransitionError,
  NotFoundError,
} from "@/lib/errors/app-error";
import { InventoryOperationWriter } from "./internal/inventory-operation-writer";

/**
 * Shared service for confirming and canceling inventory operations.
 *
 * All four operation types (receipt, delivery, transfer, adjustment)
 * delegate their confirm/cancel logic here so that the atomic
 * transaction pattern is centralized.
 */
export class InventoryOperationService {
  /**
   * Confirm an operation → DONE.
   *
   * Runs the entire stock update + ledger write + status change
   * inside a single Prisma interactive transaction.
   */
  static async confirm(operationId: string, performedById?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the operation with items
      const operation = await tx.inventoryOperation.findUnique({
        where: { id: operationId },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, uom: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      });

      if (!operation) {
        throw new NotFoundError("InventoryOperation", operationId);
      }

      // 2. Validate status transition — only DRAFT/WAITING/READY can → DONE
      if (operation.status === "DONE") {
        throw new InvalidStatusTransitionError("DONE", "DONE");
      }
      if (operation.status === "CANCELED") {
        throw new InvalidStatusTransitionError("CANCELED", "DONE");
      }

      const activeUserId = performedById || operation.responsibleUserId;

      // 3. Dispatch to type-specific stock logic
      switch (operation.type) {
        case "RECEIPT":
          await InventoryOperationWriter.applyReceipt(tx, operation, activeUserId);
          break;
        case "DELIVERY":
          await InventoryOperationWriter.applyDelivery(tx, operation, activeUserId);
          break;
        case "TRANSFER":
          await InventoryOperationWriter.applyTransfer(tx, operation, activeUserId);
          break;
        case "ADJUSTMENT":
          await InventoryOperationWriter.applyAdjustment(tx, operation, activeUserId);
          break;
      }

      // 4. Mark DONE
      const updated = await InventoryOperationWriter.markDone(tx, operationId);
      return updated;
    });
  }

  /**
   * Cancel an operation.
   *
   * Only operations that are NOT already DONE can be canceled.
   * Canceled operations do not affect stock.
   */
  static async cancel(operationId: string) {
    return prisma.$transaction(async (tx) => {
      const operation = await tx.inventoryOperation.findUnique({
        where: { id: operationId },
        select: { id: true, status: true },
      });

      if (!operation) {
        throw new NotFoundError("InventoryOperation", operationId);
      }

      if (operation.status === "DONE") {
        throw new InvalidStatusTransitionError("DONE", "CANCELED");
      }

      if (operation.status === "CANCELED") {
        throw new InvalidStatusTransitionError("CANCELED", "CANCELED");
      }

      return InventoryOperationWriter.markCanceled(tx, operationId);
    });
  }
}
