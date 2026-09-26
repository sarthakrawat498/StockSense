import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type {
	CreateLocationParams,
	CreateWarehouseParams,
	Location,
	UpdateLocationParams,
	UpdateWarehouseParams,
	Warehouse,
} from "./types";

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

const locationSelect = {
	id: true,
	name: true,
	code: true,
	warehouseId: true,
	createdAt: true,
	updatedAt: true,
	warehouse: { select: { name: true } },
} satisfies Prisma.LocationSelect;

type LocationRecord = Prisma.LocationGetPayload<{ select: typeof locationSelect }>;

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

function toLocation(record: LocationRecord): Location {
	return {
		id: record.id,
		name: record.name,
		code: record.code,
		warehouseId: record.warehouseId,
		warehouseName: record.warehouse.name,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function mapPrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
		const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "name or code";
		throw new ConflictError(`A warehouse with the same ${target} already exists`);
	}

	throw error;
}

function mapLocationPrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") {
			throw new ConflictError("A location with the same code already exists in this warehouse");
		}

		if (error.code === "P2025") {
			throw new NotFoundError("Location not found");
		}
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

	async createLocation(warehouseId: string, params: Omit<CreateLocationParams, "warehouseId">): Promise<Location> {
		try {
			const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId }, select: { id: true } });
			if (!warehouse) {
				throw new NotFoundError("Warehouse not found");
			}

			const location = await prisma.location.create({
				data: { warehouseId, name: params.name, code: params.code },
				select: locationSelect,
			});

			return toLocation(location);
		} catch (error) {
			mapLocationPrismaError(error);
		}
	}

	async listLocationsByWarehouse(warehouseId: string): Promise<Location[]> {
		const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId }, select: { id: true } });
		if (!warehouse) {
			throw new NotFoundError("Warehouse not found");
		}

		const locations = await prisma.location.findMany({
			where: { warehouseId },
			orderBy: [{ name: "asc" }, { code: "asc" }],
			select: locationSelect,
		});

		return locations.map(toLocation);
	}

	async getLocationById(id: string): Promise<Location> {
		const location = await prisma.location.findUnique({ where: { id }, select: locationSelect });
		if (!location) {
			throw new NotFoundError("Location not found");
		}

		return toLocation(location);
	}

	async updateLocation(id: string, params: UpdateLocationParams): Promise<Location> {
		try {
			const location = await prisma.location.update({
				where: { id },
				data: params,
				select: locationSelect,
			});

			return toLocation(location);
		} catch (error) {
			mapLocationPrismaError(error);
		}
	}
}
