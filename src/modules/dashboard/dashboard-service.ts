import { prisma } from "@/lib/db";
import type { DashboardAlert, DashboardKPIs } from "./types";

export interface DashboardData {
	kpis: DashboardKPIs;
	alerts: DashboardAlert[];
}

const numeric = (value: { toString(): string } | number) => Number(value.toString());

export class DashboardService {
	private async getLowStockAlerts(): Promise<DashboardAlert[]> {
		const products = await prisma.product.findMany({
			select: {
				id: true,
				name: true,
				sku: true,
				reorderPoint: true,
				reorderRule: { select: { minQty: true, maxQty: true, isActive: true } },
				stockBalances: { select: { onHandQty: true } },
			},
			orderBy: { name: "asc" },
		});

		return products.reduce<DashboardAlert[]>((result, product) => {
				const currentStock = product.stockBalances.reduce((sum, balance) => sum + numeric(balance.onHandQty), 0);
				const reorderPoint = numeric(product.reorderPoint);
				const rule = product.reorderRule?.isActive ? product.reorderRule : undefined;
				const effectiveThreshold = rule ? numeric(rule.minQty) : reorderPoint;
				if (currentStock > effectiveThreshold) return result;
				result.push({
					productId: product.id,
					productName: product.name,
					sku: product.sku,
					currentStock,
					reorderPoint,
					effectiveThreshold,
					suggestedQuantity: rule ? Math.max(0, numeric(rule.maxQty) - currentStock) : undefined,
					isOutOfStock: currentStock <= 0,
				});
				return result;
			}, [])
			.sort((left, right) => {
				if (left.isOutOfStock !== right.isOutOfStock) return left.isOutOfStock ? -1 : 1;
				const leftRatio = left.effectiveThreshold === 0 ? 1 : left.currentStock / left.effectiveThreshold;
				const rightRatio = right.effectiveThreshold === 0 ? 1 : right.currentStock / right.effectiveThreshold;
				return leftRatio - rightRatio;
			});

		const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
			prisma.inventoryOperation.count({ where: { type: "RECEIPT", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
			prisma.inventoryOperation.count({ where: { type: "DELIVERY", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
			prisma.inventoryOperation.count({ where: { type: "TRANSFER", status: { in: ["DRAFT", "WAITING", "READY"] }, scheduledDate: { not: null } } }),
		]);

		return {
			kpis: {
				totalProducts: products.length,
				lowStockCount: alerts.length,
				outOfStockCount: alerts.filter((alert) => alert.isOutOfStock).length,
				pendingReceipts,
				pendingDeliveries,
				scheduledTransfers,
			},
			alerts,
	}

	async getDashboard(): Promise<DashboardData> {
		const [alerts, pendingReceipts, pendingDeliveries, scheduledTransfers, totalProducts] = await Promise.all([
			this.getLowStockAlerts(),
			prisma.inventoryOperation.count({ where: { type: "RECEIPT", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
			prisma.inventoryOperation.count({ where: { type: "DELIVERY", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
			prisma.inventoryOperation.count({ where: { type: "TRANSFER", status: { in: ["DRAFT", "WAITING", "READY"] }, scheduledDate: { not: null } } }),
			prisma.product.count(),
		]);

		return {
			kpis: {
				totalProducts,
				lowStockCount: alerts.length,
				outOfStockCount: alerts.filter((alert) => alert.isOutOfStock).length,
				pendingReceipts,
				pendingDeliveries,
				scheduledTransfers,
			},
			alerts,
		};
	}

	async getLowStock(): Promise<DashboardAlert[]> {
		return this.getLowStockAlerts();
	}
}
