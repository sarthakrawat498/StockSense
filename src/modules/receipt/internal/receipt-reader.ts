import { prisma } from "@/lib/db";
import type { ReceiptFilters } from "../types";
import type { OperationStatus, PaginatedResult } from "@/types/common.types";
import { APP } from "@/constants/app.constants";

const DEFAULT_PAGE = APP.PAGINATION.DEFAULT_PAGE;
const DEFAULT_PAGE_SIZE = APP.PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * Read-only database queries for receipts (OperationType = RECEIPT).
 */
export class ReceiptReader {
  /**
   * List receipts with optional filters and pagination.
   */
  static async findMany(filters: ReceiptFilters): Promise<PaginatedResult<unknown>> {
    const page = filters.page ?? DEFAULT_PAGE;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      type: "RECEIPT" as const,
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.status) {
      where.status = filters.status as OperationStatus;
    }

    if (filters.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventoryOperation.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          toLocation: { select: { id: true, name: true, code: true } },
          responsibleUser: { select: { id: true, username: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.inventoryOperation.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single receipt by ID with full item details.
   */
  static async findById(id: string) {
    return prisma.inventoryOperation.findFirst({
      where: { id, type: "RECEIPT" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, uom: true, unitCost: true },
            },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        responsibleUser: { select: { id: true, username: true, email: true } },
      },
    });
  }
}
