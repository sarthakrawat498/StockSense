import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/app-error";
import type { Prisma } from "@prisma/client";

/**
 * Read-only helpers shared across all inventory operation types.
 */
export class InventoryOperationReader {
  /**
   * Fetch a full operation by ID with items and product details.
   * Throws NotFoundError if not found.
   */
  static async findByIdOrThrow(id: string) {
    const operation = await prisma.inventoryOperation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, uom: true, unitCost: true },
            },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        responsibleUser: { select: { id: true, username: true, email: true } },
      },
    });

    if (!operation) {
      throw new NotFoundError("InventoryOperation", id);
    }

    return operation;
  }

  /**
   * Get a stock balance for a product at a location.
   * Returns null if no balance exists yet.
   */
  static async getStockBalance(productId: string, locationId: string) {
    return prisma.stockBalance.findUnique({
      where: {
        productId_locationId: { productId, locationId },
      },
    });
  }
}
