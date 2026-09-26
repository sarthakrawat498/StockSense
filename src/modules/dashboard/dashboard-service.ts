import { OperationStatus, OperationType } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { DashboardFilters, DashboardKPIs } from "./types";

const numeric = (value: { toString(): string } | number) => Number(value.toString());

export class DashboardService {
	async getDashboard(filters: DashboardFilters = {}): Promise<DashboardKPIs> {
		const products = await prisma.product.findMany({
			where: filters.categoryId ? { categoryId: filters.categoryId } : undefined,
			select: {
				reorderPoint: true,
				stockBalances: {
					where: filters.warehouseId
						? { location: { warehouseId: filters.warehouseId } }
						: undefined,
					select: { onHandQty: true },
				},
			},
		});

        let totalProductsInStock = 0;
        let lowStockItems = 0;
        let outOfStockItems = 0;

        for (const product of products) {
            const currentStock = product.stockBalances.reduce(
                (sum, balance) => sum + numeric(balance.onHandQty),
                0,
            );
            const reorderPoint = numeric(product.reorderPoint);

            if (currentStock > 0) totalProductsInStock += 1;
            if (currentStock <= 0) outOfStockItems += 1;
            else if (currentStock <= reorderPoint) lowStockItems += 1;
        }

        const operationWhere = {
            ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
            ...(filters.operationType ? { type: filters.operationType } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.categoryId
                ? { items: { some: { product: { categoryId: filters.categoryId } } } }
                : {}),
        };
        const pendingWhere = {
            ...operationWhere,
            status: filters.status ?? { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        };

		const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
			prisma.inventoryOperation.count({ where: { ...pendingWhere, type: OperationType.RECEIPT } }),
			prisma.inventoryOperation.count({ where: { ...pendingWhere, type: OperationType.DELIVERY } }),
			prisma.inventoryOperation.count({
				where: { ...pendingWhere, type: OperationType.TRANSFER, scheduledDate: { not: null } },
			}),
		]);

		return {
			totalProductsInStock,
			lowStockItems,
			outOfStockItems,
			pendingReceipts,
			pendingDeliveries,
			scheduledTransfers,
		};
	}
}
