import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import type { ReorderRule } from "@/modules/product";
import type { CreateReorderRuleParams, ReorderRuleFilters, ReorderRuleList, UpdateReorderRuleParams } from "./types";

const ruleSelect = {
	id: true,
	productId: true,
	minQty: true,
	maxQty: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	product: { select: { id: true, name: true, sku: true, uom: true } },
} satisfies Prisma.ReorderRuleSelect;

type RuleRecord = Prisma.ReorderRuleGetPayload<{ select: typeof ruleSelect }>;

function toRule(record: RuleRecord): ReorderRule {
	return {
		id: record.id,
		productId: record.productId,
		product: record.product,
		minQty: record.minQty.toString(),
		maxQty: record.maxQty.toString(),
		isActive: record.isActive,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

function mapError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") throw new ConflictError("A reorder rule already exists for this product");
		if (error.code === "P2025") throw new NotFoundError("Reorder rule not found");
	}
	throw error;
}

export class ReorderRuleService {
	async create(params: CreateReorderRuleParams): Promise<ReorderRule> {
		try {
			const product = await prisma.product.findUnique({ where: { id: params.productId }, select: { id: true } });
			if (!product) throw new NotFoundError("Product not found");
			const rule = await prisma.reorderRule.create({
				data: { productId: params.productId, minQty: params.minQty, maxQty: params.maxQty, isActive: params.isActive ?? true },
				select: ruleSelect,
			});
			return toRule(rule);
		} catch (error) { mapError(error); }
	}

	async list(filters: ReorderRuleFilters = {}): Promise<ReorderRuleList> {
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 20;
		const where: Prisma.ReorderRuleWhereInput = filters.isActive === undefined ? {} : { isActive: filters.isActive };
		const [total, rules] = await prisma.$transaction([
			prisma.reorderRule.count({ where }),
			prisma.reorderRule.findMany({ where, orderBy: [{ product: { name: "asc" } }, { product: { sku: "asc" } }], skip: (page - 1) * pageSize, take: pageSize, select: ruleSelect }),
		]);
		return { items: rules.map(toRule), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
	}

	async getById(id: string): Promise<ReorderRule> {
		const rule = await prisma.reorderRule.findUnique({ where: { id }, select: ruleSelect });
		if (!rule) throw new NotFoundError("Reorder rule not found");
		return toRule(rule);
	}

	async update(id: string, params: UpdateReorderRuleParams): Promise<ReorderRule> {
		try {
			const current = await prisma.reorderRule.findUnique({ where: { id }, select: { minQty: true, maxQty: true } });
			if (!current) throw new NotFoundError("Reorder rule not found");
			const minQty = params.minQty ?? current.minQty.toString();
			const maxQty = params.maxQty ?? current.maxQty.toString();
			if (Number(maxQty) < Number(minQty)) throw new ValidationError("maxQty must be greater than or equal to minQty");
			return toRule(await prisma.reorderRule.update({ where: { id }, data: params, select: ruleSelect }));
		} catch (error) { mapError(error); }
	}

	async delete(id: string): Promise<void> {
		try { await prisma.reorderRule.delete({ where: { id }, select: { id: true } }); }
		catch (error) { mapError(error); }
	}
}
