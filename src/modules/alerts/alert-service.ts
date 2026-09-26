import { prisma } from "@/lib/db";
import type { LowStockAlert } from "./types";

const numeric = (value: { toString(): string } | number) => Number(value.toString());

export class AlertService {
	async getLowStockAlerts(): Promise<LowStockAlert[]> {
		const products = await prisma.product.findMany({
			orderBy: [{ name: "asc" }, { sku: "asc" }],
			select: {
				id: true,
				name: true,
				sku: true,
				reorderPoint: true,
				reorderRule: { select: { minQty: true, maxQty: true, isActive: true } },
				stockBalances: { select: { onHandQty: true } },
			},
		});

		return products.flatMap((product) => {
			const currentStock = product.stockBalances.reduce((sum, balance) => sum + numeric(balance.onHandQty), 0);
			const reorderPoint = numeric(product.reorderPoint);
			const activeRule = product.reorderRule?.isActive ? product.reorderRule : null;
			const effectiveThreshold = activeRule ? numeric(activeRule.minQty) : reorderPoint;

			if (currentStock > effectiveThreshold) return [];

			const targetStock = activeRule ? numeric(activeRule.maxQty) : effectiveThreshold;
			return [{
				productId: product.id,
				productName: product.name,
				sku: product.sku,
				currentStock,
				reorderPoint,
				effectiveThreshold,
				suggestedQuantity: Math.max(0, targetStock - currentStock),
				isOutOfStock: currentStock <= 0,
			}];
		});
	}
}
