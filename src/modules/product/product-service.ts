import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import type { PaginatedResponse } from "@/types/api.types";
import type { CreateProductParams, Product, ProductFilters, ProductStock, StockLevel, UpdateProductParams } from "./types";

const productSelect = {
	id: true, name: true, sku: true, categoryId: true, uom: true, unitCost: true,
	reorderPoint: true, createdAt: true, updatedAt: true,
	category: { select: { id: true, name: true } },
	stockBalances: { select: { onHandQty: true, reservedQty: true } },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

const stockSelect = {
	id: true, productId: true, locationId: true, onHandQty: true, reservedQty: true,
	location: { select: { name: true, warehouse: { select: { name: true } } } },
} satisfies Prisma.StockBalanceSelect;

type StockRecord = Prisma.StockBalanceGetPayload<{ select: typeof stockSelect }>;

const numberValue = (value: Prisma.Decimal | number | string) => Number(value.toString());

function toProduct(record: ProductRecord): Product {
	const totalStock = record.stockBalances.reduce((sum, balance) => sum + numberValue(balance.onHandQty), 0);
	return {
		id: record.id, name: record.name, sku: record.sku, categoryId: record.categoryId,
		category: record.category, uom: record.uom, unitCost: record.unitCost.toString(),
		reorderPoint: numberValue(record.reorderPoint), createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(), totalStock,
		isLowStock: totalStock <= numberValue(record.reorderPoint),
	};
}

function toStockLevel(record: StockRecord): StockLevel {
	const onHandQty = numberValue(record.onHandQty);
	const reservedQty = numberValue(record.reservedQty);
	return { id: record.id, productId: record.productId, locationId: record.locationId,
		locationName: record.location.name, warehouseName: record.location.warehouse.name,
		onHandQty, reservedQty, freeQty: onHandQty - reservedQty };
}

function mapPrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") throw new ConflictError("A product with the same SKU already exists");
		if (error.code === "P2025") throw new NotFoundError("Product not found");
	}
	throw error;
}

function openingReference(productId: string) {
	return `OPEN-${productId.slice(0, 8)}-${Date.now().toString(36)}`.slice(0, 30);
}

export class ProductService {
	async create(params: CreateProductParams): Promise<Product> {
		if ((params.initialStock ?? 0) > 0 && !params.actorId) {
			throw new ValidationError("An authenticated user is required to create initial stock");
		}
		try {
			return await prisma.$transaction(async (tx) => {
				if (!(await tx.category.findUnique({ where: { id: params.categoryId }, select: { id: true } }))) throw new NotFoundError("Category not found");
				const openingQty = params.initialStock ?? 0;
				const openingLocation = openingQty > 0 && params.initialLocationId
					? await tx.location.findUnique({ where: { id: params.initialLocationId }, select: { id: true, warehouseId: true } })
					: null;
				if (openingQty > 0 && !openingLocation) throw new NotFoundError("Initial location not found");
				const product = await tx.product.create({ data: { name: params.name, sku: params.sku, categoryId: params.categoryId, uom: params.uom, unitCost: params.unitCost, reorderPoint: params.reorderPoint ?? 0 }, select: productSelect });
				if (openingQty > 0 && openingLocation && params.initialLocationId && params.actorId) {
					const operation = await tx.inventoryOperation.create({ data: { reference: openingReference(product.id), type: "ADJUSTMENT", status: "DONE", warehouseId: openingLocation.warehouseId, toLocationId: params.initialLocationId, responsibleUserId: params.actorId, validatedAt: new Date() }, select: { id: true } });
					const item = await tx.inventoryOperationItem.create({ data: { operationId: operation.id, productId: product.id, quantity: openingQty }, select: { id: true } });
					await tx.stockBalance.upsert({ where: { productId_locationId: { productId: product.id, locationId: params.initialLocationId } }, create: { productId: product.id, locationId: params.initialLocationId, onHandQty: openingQty }, update: { onHandQty: { increment: openingQty } } });
					await tx.stockLedger.create({ data: { operationId: operation.id, operationItemId: item.id, productId: product.id, toLocationId: params.initialLocationId, quantity: openingQty, movementType: "ADJUSTMENT_IN", performedById: params.actorId } });
				}
				return toProduct(await tx.product.findUniqueOrThrow({ where: { id: product.id }, select: productSelect }));
			});
		} catch (error) { mapPrismaError(error); }
	}

	async list(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 20;
		const stockFilter: Prisma.StockBalanceListRelationFilter | undefined = filters.warehouseId || filters.locationId ? { some: { ...(filters.locationId ? { locationId: filters.locationId } : {}), ...(filters.warehouseId ? { location: { warehouseId: filters.warehouseId } } : {}) } } : undefined;
		const where: Prisma.ProductWhereInput = { ...(filters.categoryId ? { categoryId: filters.categoryId } : {}), ...(stockFilter ? { stockBalances: stockFilter } : {}), ...(filters.search ? { OR: [{ name: { contains: filters.search, mode: "insensitive" } }, { sku: { contains: filters.search, mode: "insensitive" } }] } : {}) };
		const [total, products] = await prisma.$transaction([
			prisma.product.count({ where }),
			prisma.product.findMany({ where, orderBy: [{ name: "asc" }, { sku: "asc" }], skip: (page - 1) * pageSize, take: pageSize, select: productSelect }),
		]);
		return { items: products.map(toProduct), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
	}

	async getById(id: string): Promise<Product> {
		const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
		if (!product) throw new NotFoundError("Product not found");
		return toProduct(product);
	}

	async update(id: string, params: UpdateProductParams): Promise<Product> {
		try { return toProduct(await prisma.product.update({ where: { id }, data: params, select: productSelect })); }
		catch (error) { mapPrismaError(error); }
	}

	async getStock(id: string): Promise<ProductStock> {
		if (!(await prisma.product.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundError("Product not found");
		const balances = (await prisma.stockBalance.findMany({ where: { productId: id }, orderBy: { location: { name: "asc" } }, select: stockSelect })).map(toStockLevel);
		return { productId: id, balances, totalOnHand: balances.reduce((sum, item) => sum + item.onHandQty, 0), totalReserved: balances.reduce((sum, item) => sum + item.reservedQty, 0), totalFree: balances.reduce((sum, item) => sum + item.freeQty, 0) };
	}
}
