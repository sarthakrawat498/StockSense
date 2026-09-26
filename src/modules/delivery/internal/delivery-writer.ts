import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { CreateDeliveryInput, UpdateDeliveryInput } from "../types";
import { ReferenceGenerator } from "@/modules/inventory-operation";

/**
 * Write operations for deliveries.
 */
export class DeliveryWriter {
  static async create(input: CreateDeliveryInput) {
    const warehouse = await prisma.warehouse.findUniqueOrThrow({
      where: { id: input.warehouseId },
      select: { code: true },
    });

    const reference = await ReferenceGenerator.generate(warehouse.code, "DELIVERY");

    return prisma.inventoryOperation.create({
      data: {
        reference,
        type: "DELIVERY",
        status: "DRAFT",
        warehouseId: input.warehouseId,
        fromLocationId: input.fromLocationId,
        contactName: input.contactName,
        address: input.address,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : undefined,
        responsibleUserId: input.responsibleUserId,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: new Decimal(item.quantity),
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
        fromLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async update(id: string, input: UpdateDeliveryInput) {
    if (input.items && input.items.length > 0) {
      await prisma.inventoryOperationItem.deleteMany({
        where: { operationId: id },
      });
    }

    return prisma.inventoryOperation.update({
      where: { id },
      data: {
        contactName: input.contactName,
        address: input.address,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : undefined,
        fromLocationId: input.fromLocationId,
        ...(input.items && input.items.length > 0
          ? {
              items: {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  quantity: new Decimal(item.quantity),
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
        fromLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
