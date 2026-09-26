import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/app-error";
import type { PaginatedResponse } from "@/types/api.types";
import type { StockMove, StockMoveFilters } from "./types";

const ledgerSelect = {
	id: true,
	productId: true,
	quantity: true,
	movementType: true,
	movedAt: true,
	product: { select: { name: true, sku: true } },
	operation: { select: { reference: true, type: true } },
	fromLocation: { select: { id: true, name: true } },
	toLocation: { select: { id: true, name: true } },
} satisfies Prisma.StockLedgerSelect;

type LedgerRecord = Prisma.StockLedgerGetPayload<{ select: typeof ledgerSelect }>;

function toMove(record: LedgerRecord): StockMove {
	const movedAt = record.movedAt.toISOString();
	return {
		id: record.id,
		productId: record.productId,
		productName: record.product.name,
		productSku: record.product.sku,
		fromLocationId: record.fromLocation?.id,
		fromLocationName: record.fromLocation?.name,
		toLocationId: record.toLocation?.id,
		toLocationName: record.toLocation?.name,
		quantity: Number(record.quantity.toString()),
		type: record.movementType,
		operationType: record.operation.type,
		reference: record.operation.reference,
		createdAt: movedAt,
		movedAt,
	};
}

function whereFor(filters: StockMoveFilters): Prisma.StockLedgerWhereInput {
	const locations = filters.locationId ? [{ fromLocationId: filters.locationId }, { toLocationId: filters.locationId }] : [];
	const relationFilters: Prisma.StockLedgerWhereInput[] = [];
	if (locations.length) relationFilters.push({ OR: locations });
	if (filters.warehouseId) relationFilters.push({ OR: [{ fromLocation: { warehouseId: filters.warehouseId } }, { toLocation: { warehouseId: filters.warehouseId } }] });
	return {
		...(filters.productId ? { productId: filters.productId } : {}),
		...(filters.operationType ? { operation: { type: filters.operationType } } : {}),
		...(filters.fromDate || filters.toDate ? { movedAt: { ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}), ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}) } } : {}),
		...(relationFilters.length ? { AND: relationFilters } : {}),
	};
}

export class StockLedgerService {
	async list(filters: StockMoveFilters = {}): Promise<PaginatedResponse<StockMove>> {
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 20;
		const where = whereFor(filters);
		const [total, records] = await prisma.$transaction([
			prisma.stockLedger.count({ where }),
			prisma.stockLedger.findMany({ where, orderBy: { movedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: ledgerSelect }),
		]);
		return { items: records.map(toMove), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
	}

	async getById(id: string): Promise<StockMove> {
		const record = await prisma.stockLedger.findUnique({ where: { id }, select: ledgerSelect });
		if (!record) throw new NotFoundError("Ledger entry not found");
		return toMove(record);
	}
}
