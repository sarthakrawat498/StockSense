import type { Prisma, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  InsufficientStockError,
  ValidationError,
} from "@/lib/errors/app-error";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Atomic stock-update functions that run inside a Prisma interactive transaction.
 *
 * Each method receives the transaction client (`tx`) so that all DB writes
 * happen within the same PostgreSQL transaction.
 */
export class InventoryOperationWriter {
  // ─── Receipt ─────────────────────────────────────────────────────────────

  /**
   * Receipt confirmation: stock + at toLocation for every item.
   */
  static async applyReceipt(
    tx: TxClient,
    operation: {
      id: string;
      toLocationId: string | null;
      items: Array<{ id: string; productId: string; quantity: Prisma.Decimal }>;
    },
    performedById: string,
  ) {
    if (!operation.toLocationId) {
      throw new ValidationError("Receipt must have a destination location (toLocationId)");
    }

    for (const item of operation.items) {
      // Upsert stock balance: increment onHandQty
      await tx.stockBalance.upsert({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.toLocationId,
          },
        },
        create: {
          productId: item.productId,
          locationId: operation.toLocationId,
          onHandQty: item.quantity,
          reservedQty: new Decimal(0),
        },
        update: {
          onHandQty: { increment: item.quantity },
        },
      });

      // Create ledger entry
      await tx.stockLedger.create({
        data: {
          operationId: operation.id,
          operationItemId: item.id,
          productId: item.productId,
          toLocationId: operation.toLocationId,
          quantity: item.quantity,
          movementType: "RECEIPT",
          performedById,
        },
      });
    }
  }

  // ─── Delivery ────────────────────────────────────────────────────────────

  /**
   * Delivery confirmation: stock − at fromLocation for every item.
   * Validates that sufficient stock is available before decrementing.
   */
  static async applyDelivery(
    tx: TxClient,
    operation: {
      id: string;
      fromLocationId: string | null;
      items: Array<{
        id: string;
        productId: string;
        quantity: Prisma.Decimal;
        product: { name: string };
      }>;
    },
    performedById: string,
  ) {
    if (!operation.fromLocationId) {
      throw new ValidationError("Delivery must have a source location (fromLocationId)");
    }

    for (const item of operation.items) {
      // Check available stock
      const balance = await tx.stockBalance.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.fromLocationId,
          },
        },
      });

      const available = balance
        ? balance.onHandQty.sub(balance.reservedQty)
        : new Decimal(0);

      if (available.lt(item.quantity)) {
        throw new InsufficientStockError(
          item.product.name,
          available.toNumber(),
          item.quantity.toNumber(),
        );
      }

      // Decrement stock
      await tx.stockBalance.update({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.fromLocationId,
          },
        },
        data: {
          onHandQty: { decrement: item.quantity },
        },
      });

      // Ledger entry
      await tx.stockLedger.create({
        data: {
          operationId: operation.id,
          operationItemId: item.id,
          productId: item.productId,
          fromLocationId: operation.fromLocationId,
          quantity: item.quantity,
          movementType: "DELIVERY",
          performedById,
        },
      });
    }
  }

  // ─── Transfer ────────────────────────────────────────────────────────────

  /**
   * Transfer confirmation: stock − at fromLocation, stock + at toLocation.
   */
  static async applyTransfer(
    tx: TxClient,
    operation: {
      id: string;
      fromLocationId: string | null;
      toLocationId: string | null;
      items: Array<{
        id: string;
        productId: string;
        quantity: Prisma.Decimal;
        product: { name: string };
      }>;
    },
    performedById: string,
  ) {
    if (!operation.fromLocationId || !operation.toLocationId) {
      throw new ValidationError("Transfer must have both source and destination locations");
    }

    if (operation.fromLocationId === operation.toLocationId) {
      throw new ValidationError("Transfer source and destination locations must be different");
    }

    for (const item of operation.items) {
      // Check source stock
      const balance = await tx.stockBalance.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.fromLocationId,
          },
        },
      });

      const available = balance
        ? balance.onHandQty.sub(balance.reservedQty)
        : new Decimal(0);

      if (available.lt(item.quantity)) {
        throw new InsufficientStockError(
          item.product.name,
          available.toNumber(),
          item.quantity.toNumber(),
        );
      }

      // Decrement source
      await tx.stockBalance.update({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.fromLocationId,
          },
        },
        data: {
          onHandQty: { decrement: item.quantity },
        },
      });

      // Increment destination
      await tx.stockBalance.upsert({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: operation.toLocationId,
          },
        },
        create: {
          productId: item.productId,
          locationId: operation.toLocationId,
          onHandQty: item.quantity,
          reservedQty: new Decimal(0),
        },
        update: {
          onHandQty: { increment: item.quantity },
        },
      });

      // Ledger entry
      await tx.stockLedger.create({
        data: {
          operationId: operation.id,
          operationItemId: item.id,
          productId: item.productId,
          fromLocationId: operation.fromLocationId,
          toLocationId: operation.toLocationId,
          quantity: item.quantity,
          movementType: "TRANSFER",
          performedById,
        },
      });
    }
  }

  // ─── Adjustment ──────────────────────────────────────────────────────────

  /**
   * Adjustment confirmation: sets stock to counted quantity and creates
   * ledger entries for the delta.
   *
   * - quantity    = theoretical / recorded qty (what the system thinks)
   * - countedQuantity = physical count
   * - delta = countedQuantity - quantity
   */
  static async applyAdjustment(
    tx: TxClient,
    operation: {
      id: string;
      toLocationId: string | null;
      items: Array<{
        id: string;
        productId: string;
        quantity: Prisma.Decimal;
        countedQuantity: Prisma.Decimal | null;
        product: { name: string };
      }>;
    },
    performedById: string,
  ) {
    if (!operation.toLocationId) {
      throw new ValidationError("Adjustment must have a location (toLocationId)");
    }

    for (const item of operation.items) {
      if (item.countedQuantity === null) {
        throw new ValidationError(
          `Adjustment item for product '${item.product.name}' must have a countedQuantity`,
        );
      }

      const theoretical = item.quantity;
      const counted = item.countedQuantity;
      const delta = counted.sub(theoretical);

      if (delta.isZero()) continue; // No change needed

      const movementType = delta.gt(0) ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
      const absDelta = delta.abs();

      if (delta.gt(0)) {
        // Stock increase: upsert to add the delta
        await tx.stockBalance.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: operation.toLocationId,
            },
          },
          create: {
            productId: item.productId,
            locationId: operation.toLocationId,
            onHandQty: counted,
            reservedQty: new Decimal(0),
          },
          update: {
            onHandQty: { increment: absDelta },
          },
        });
      } else {
        // Stock decrease: ensure balance exists, then decrement
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: operation.toLocationId,
            },
          },
        });

        if (!balance || balance.onHandQty.lt(absDelta)) {
          throw new ValidationError(
            `Cannot adjust '${item.product.name}' below zero. ` +
            `Current: ${balance?.onHandQty.toNumber() ?? 0}, delta: ${delta.toNumber()}`,
          );
        }

        await tx.stockBalance.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: operation.toLocationId,
            },
          },
          data: {
            onHandQty: { decrement: absDelta },
          },
        });
      }

      // Ledger entry (always positive quantity, movementType indicates direction)
      await tx.stockLedger.create({
        data: {
          operationId: operation.id,
          operationItemId: item.id,
          productId: item.productId,
          // For ADJUSTMENT_IN → stock comes in to location
          // For ADJUSTMENT_OUT → stock leaves from location
          ...(movementType === "ADJUSTMENT_IN"
            ? { toLocationId: operation.toLocationId }
            : { fromLocationId: operation.toLocationId }),
          quantity: absDelta,
          movementType: movementType as "ADJUSTMENT_IN" | "ADJUSTMENT_OUT",
          performedById,
        },
      });
    }
  }

  // ─── Status Helpers ──────────────────────────────────────────────────────

  /**
   * Mark operation as DONE with validatedAt timestamp.
   */
  static async markDone(tx: TxClient, operationId: string) {
    return tx.inventoryOperation.update({
      where: { id: operationId },
      data: {
        status: "DONE",
        validatedAt: new Date(),
      },
    });
  }

  /**
   * Mark operation as CANCELED with canceledAt timestamp.
   */
  static async markCanceled(tx: TxClient, operationId: string) {
    return tx.inventoryOperation.update({
      where: { id: operationId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });
  }
}
