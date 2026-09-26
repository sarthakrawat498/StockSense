import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { ValidationError } from "@/lib/errors/app-error";
import type { CreateTransferInput, UpdateTransferInput } from "../types";
import { ReferenceGenerator } from "@/modules/inventory-operation";

/**
 * Write operations for transfers.
 */
export class TransferWriter {
  static async create(input: CreateTransferInput) {
    // Validate: from and to must be different
    if (input.fromLocationId === input.toLocationId) {
      throw new ValidationError(
        "Transfer source and destination locations must be different",
      );
    }

    const warehouse = await prisma.warehouse.findUniqueOrThrow({
      where: { id: input.warehouseId },
      select: { code: true },
    });

    const reference = await ReferenceGenerator.generate(warehouse.code, "TRANSFER");

    let responsibleUserId = input.responsibleUserId;
    if (!responsibleUserId) {
      const defaultUser = await prisma.user.findFirst();
      responsibleUserId = defaultUser?.id ?? "00000000-0000-0000-0000-000000000000";
    }

    return prisma.inventoryOperation.create({
      data: {
        reference,
        type: "TRANSFER",
        status: "DRAFT",
        warehouseId: input.warehouseId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
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
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async update(id: string, input: UpdateTransferInput) {
    // Validate if both locations provided
    if (
      input.fromLocationId &&
      input.toLocationId &&
      input.fromLocationId === input.toLocationId
    ) {
      throw new ValidationError(
        "Transfer source and destination locations must be different",
      );
    }

    if (input.items && input.items.length > 0) {
      await prisma.inventoryOperationItem.deleteMany({
        where: { operationId: id },
      });
    }

    return prisma.inventoryOperation.update({
      where: { id },
      data: {
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : undefined,
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
        toLocation: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
