import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type { CreateWarehouseParams, UpdateWarehouseParams, Warehouse } from "./types";

const warehouseSelect = {
	id: true,
	name: true,
	code: true,
	address: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { locations: true } },
} satisfies Prisma.WarehouseSelect;

type WarehouseRecord = Prisma.WarehouseGetPayload<{ select: typeof warehouseSelect }>;

function toWarehouse(record: WarehouseRecord): Warehouse {
	return {
		id: record.id,
		name: record.name,
		code: record.code,
		address: record.address ?? undefined,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
		locationCount: record._count.locations,
	};
}

function mapPrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
		const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "name or code";
		throw new ConflictError(`A warehouse with the same ${target} already exists`);
	}

	throw error;
}

export class WarehouseService {
	async create(params: CreateWarehouseParams): Promise<Warehouse> {
		try {
			const warehouse = await prisma.warehouse.create({
				data: {
					name: params.name,
					code: params.code,
					address: params.address,
				},
				select: warehouseSelect,
			});

			return toWarehouse(warehouse);
		} catch (error) {
			mapPrismaError(error);
		}
	}

	async list(): Promise<Warehouse[]> {
		const warehouses = await prisma.warehouse.findMany({
			orderBy: { name: "asc" },
			select: warehouseSelect,
		});

		return warehouses.map(toWarehouse);
	}

	async getById(id: string): Promise<Warehouse> {
		const warehouse = await prisma.warehouse.findUnique({
			where: { id },
			select: warehouseSelect,
		});

		if (!warehouse) {
			throw new NotFoundError("Warehouse not found");
		}

		return toWarehouse(warehouse);
	}

	async update(id: string, params: UpdateWarehouseParams): Promise<Warehouse> {
		try {
			const warehouse = await prisma.warehouse.update({
				where: { id },
				data: params,
				select: warehouseSelect,
			});

			return toWarehouse(warehouse);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
				throw new NotFoundError("Warehouse not found");
			}

			mapPrismaError(error);
		}
	}
}
