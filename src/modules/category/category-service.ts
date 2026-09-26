import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type { Category, CreateCategoryParams, UpdateCategoryParams } from "./types";

const categorySelect = {
	id: true,
	name: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.CategorySelect;

type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

function toCategory(record: CategoryRecord): Category {
	return {
		id: record.id,
		name: record.name,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function mapPrismaError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") {
			throw new ConflictError("A category with the same name already exists");
		}

		if (error.code === "P2025") {
			throw new NotFoundError("Category not found");
		}
	}

	throw error;
}

export class CategoryService {
	async list(): Promise<Category[]> {
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
			select: categorySelect,
		});

		return categories.map(toCategory);
	}

	async create(params: CreateCategoryParams): Promise<Category> {
		try {
			const category = await prisma.category.create({
				data: { name: params.name },
				select: categorySelect,
			});

			return toCategory(category);
		} catch (error) {
			mapPrismaError(error);
		}
	}

	async getById(id: string): Promise<Category> {
		const category = await prisma.category.findUnique({
			where: { id },
			select: categorySelect,
		});

		if (!category) {
			throw new NotFoundError("Category not found");
		}

		return toCategory(category);
	}

	async update(id: string, params: UpdateCategoryParams): Promise<Category> {
		try {
			const category = await prisma.category.update({
				where: { id },
				data: params,
				select: categorySelect,
			});

			return toCategory(category);
		} catch (error) {
			mapPrismaError(error);
		}
	}
}
