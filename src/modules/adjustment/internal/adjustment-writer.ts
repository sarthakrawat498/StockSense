import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { CreateAdjustmentInput, UpdateAdjustmentInput } from "../types";
import { ReferenceGenerator } from "@/modules/inventory-operation";

/**
 * Write operations for adjustments.
 */
export class AdjustmentWriter {
  static async create(input: CreateAdjustmentInput) {
    const warehouse = await prisma.warehouse.findUniqueOrThrow({
      where: { id: input.warehouseId },
      select: { code: true },
    });

    const reference = await ReferenceGenerator.generate(warehouse.code, "ADJUSTMENT");

    return prisma.inventoryOperation.create({
      data: {
        reference,
        type: "ADJUSTMENT",
        status: "DRAFT",
        warehouseId: input.warehouseId,
        toLocationId: input.toLocationId,
        responsibleUserId: input.responsibleUserId,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: new Decimal(item.quantity),
            countedQuantity: new Decimal(item.countedQuantity),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async update(id: string, input: UpdateAdjustmentInput) {
    if (input.items && input.items.length > 0) {
      await prisma.inventoryOperationItem.deleteMany({
        where: { operationId: id },
      });
    }

    return prisma.inventoryOperation.update({
      where: { id },
      data: {
        toLocationId: input.toLocationId,
        ...(input.items && input.items.length > 0
          ? {
              items: {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  quantity: new Decimal(item.quantity),
                  countedQuantity: new Decimal(item.countedQuantity),
                })),
              },
            }
          : {}),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
