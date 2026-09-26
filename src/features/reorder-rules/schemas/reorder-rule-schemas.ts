import { z } from "zod";

const uuid = z.string().uuid("Must be a valid UUID");
const decimal = z.union([z.string(), z.number()])
	.transform(String)
	.refine((value) => /^\d+(\.\d{1,6})?$/.test(value), "Must be a non-negative decimal with up to 6 decimal places");

export const createReorderRuleSchema = z.object({
	productId: uuid,
	minQty: decimal,
	maxQty: decimal,
	isActive: z.boolean().optional().default(true),
}).strict().superRefine((value, context) => {
	if (Number(value.maxQty) < Number(value.minQty)) {
		context.addIssue({ code: z.ZodIssueCode.custom, path: ["maxQty"], message: "maxQty must be greater than or equal to minQty" });
	}
});

export const updateReorderRuleSchema = z.object({
	minQty: decimal.optional(),
	maxQty: decimal.optional(),
	isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" }).superRefine((value, context) => {
	if (value.minQty !== undefined && value.maxQty !== undefined && Number(value.maxQty) < Number(value.minQty)) {
		context.addIssue({ code: z.ZodIssueCode.custom, path: ["maxQty"], message: "maxQty must be greater than or equal to minQty" });
	}
});

export const reorderRuleQuerySchema = z.object({
	isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
}).strict();

export type CreateReorderRuleInput = z.infer<typeof createReorderRuleSchema>;
export type UpdateReorderRuleInput = z.infer<typeof updateReorderRuleSchema>;