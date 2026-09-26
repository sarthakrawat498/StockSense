import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/app-error";
import type { PaginatedStockResponse, StockBalanceRow, StockQueryFilters } from "./stock-read-types";

const stockSelect = {
	id: true,
	productId: true,
	locationId: true,
	onHandQty: true,
	reservedQty: true,
	product: {
		select: {
			name: true,
			sku: true,
			categoryId: true,
			reorderPoint: true,
			category: { select: { name: true } },
		},
	},
	location: {
		select: {
			name: true,
			warehouseId: true,
			warehouse: { select: { name: true } },
		},
	},
} satisfies Prisma.StockBalanceSelect;

type StockRecord = Prisma.StockBalanceGetPayload<{ select: typeof stockSelect }>;

const numberValue = (value: Prisma.Decimal | number | string) => Number(value.toString());

function toStockRow(record: StockRecord): StockBalanceRow {
	const onHandQty = numberValue(record.onHandQty);
	const reservedQty = numberValue(record.reservedQty);
	const freeQty = onHandQty - reservedQty;
	const reorderPoint = numberValue(record.product.reorderPoint);

	return {
		id: record.id,
		productId: record.productId,
		productName: record.product.name,
		sku: record.product.sku,
		categoryId: record.product.categoryId,
		categoryName: record.product.category.name,
		warehouseId: record.location.warehouseId,
		warehouseName: record.location.warehouse.name,
		locationId: record.locationId,
		locationName: record.location.name,
		onHandQty,
		reservedQty,
		freeQty,
		reorderPoint,
		isLowStock: freeQty <= reorderPoint,
	};
}

function whereFor(filters: StockQueryFilters): Prisma.StockBalanceWhereInput {
	const productFilters: Prisma.ProductWhereInput[] = [
		...(filters.categoryId ? [{ categoryId: filters.categoryId }] : []),
		...(filters.search
			? [{
				OR: [
					{ name: { contains: filters.search, mode: "insensitive" as const } },
					{ sku: { contains: filters.search, mode: "insensitive" as const } },
				],
			}]
			: []),
	];

	return {
		...(filters.productId ? { productId: filters.productId } : {}),
		...(filters.locationId ? { locationId: filters.locationId } : {}),
		...(filters.warehouseId ? { location: { warehouseId: filters.warehouseId } } : {}),
		...(productFilters.length > 0 ? { product: { AND: productFilters } } : {}),
	};
}

export class StockReadService {
	async list(filters: StockQueryFilters = {}): Promise<PaginatedStockResponse> {
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 20;
		const records = await prisma.stockBalance.findMany({
			where: whereFor(filters),
			orderBy: [
				{ product: { name: "asc" } },
				{ product: { sku: "asc" } },
				{ location: { name: "asc" } },
			],
			select: stockSelect,
		});

		const rows = records.map(toStockRow).filter((row) =>
			filters.lowStock === undefined || row.isLowStock === filters.lowStock,
		);
		const total = rows.length;
		const start = (page - 1) * pageSize;

		return {
			items: rows.slice(start, start + pageSize),
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		};
	}

	async getByLocation(locationId: string): Promise<StockBalanceRow[]> {
		const location = await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
		if (!location) {
			throw new NotFoundError("Location not found");
		}

		const records = await prisma.stockBalance.findMany({
			where: { locationId },
			orderBy: [{ product: { name: "asc" } }, { product: { sku: "asc" } }],
			select: stockSelect,
		});

		return records.map(toStockRow);
	}
}
