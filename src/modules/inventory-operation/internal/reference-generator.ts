import { prisma } from "@/lib/db";
import type { OperationType } from "@/types/common.types";
import { APP } from "@/constants/app.constants";

/**
 * Generates sequential reference numbers for inventory operations.
 *
 * Format: {warehouseCode}/{prefix}/{seq}
 * Example: MAIN/IN/00001
 */
export class ReferenceGenerator {
  private static readonly prefixMap: Record<OperationType, string> = {
    RECEIPT: APP.OPERATION_REFERENCE_PREFIXES.RECEIPT,
    DELIVERY: APP.OPERATION_REFERENCE_PREFIXES.DELIVERY,
    TRANSFER: APP.OPERATION_REFERENCE_PREFIXES.TRANSFER,
    ADJUSTMENT: APP.OPERATION_REFERENCE_PREFIXES.ADJUSTMENT,
  };

  static async generate(
    warehouseCode: string,
    operationType: OperationType,
  ): Promise<string> {
    const prefix = this.prefixMap[operationType];
    const pattern = `${warehouseCode}/${prefix}/%`;

    // Find the latest reference for this warehouse+type combo
    const latest = await prisma.inventoryOperation.findFirst({
      where: {
        reference: { startsWith: `${warehouseCode}/${prefix}/` },
      },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });

    let nextSeq = 1;
    if (latest?.reference) {
      const parts = latest.reference.split("/");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${warehouseCode}/${prefix}/${String(nextSeq).padStart(5, "0")}`;
  }
}
