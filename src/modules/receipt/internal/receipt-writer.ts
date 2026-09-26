import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { CreateReceiptInput, UpdateReceiptInput } from "../types";
import { ReferenceGenerator } from "@/modules/inventory-operation";

/**
 * Write operations for receipts.
 */
export class ReceiptWriter {
  /**
   * Create a new receipt in DRAFT status.
   */
  static async create(input: CreateReceiptInput) {
    // Resolve warehouse code for reference generation
    const warehouse = await prisma.warehouse.findUniqueOrThrow({
      where: { id: input.warehouseId },
      select: { code: true },
    });

    const reference = await ReferenceGenerator.generate(warehouse.code, "RECEIPT");

    let responsibleUserId = input.responsibleUserId;
    if (!responsibleUserId) {
      const defaultUser = await prisma.user.findFirst();
      responsibleUserId = defaultUser?.id ?? "00000000-0000-0000-0000-000000000000";
    }

    return prisma.inventoryOperation.create({
      data: {
        reference,
        type: "RECEIPT",
        status: "DRAFT",
        warehouseId: input.warehouseId,
        toLocationId: input.toLocationId,
        contactName: input.contactName,
        address: input.address,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : undefined,
        responsibleUserId,
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
            product: {
              select: { id: true, name: true, sku: true, uom: true },
            },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }

  /**
   * Update a receipt that is in DRAFT status.
   */
  static async update(id: string, input: UpdateReceiptInput) {
    // If items are provided, delete existing and recreate
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
        toLocationId: input.toLocationId,
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
            product: {
              select: { id: true, name: true, sku: true, uom: true },
            },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
