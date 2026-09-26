import { z } from "zod";

const uuid = z.string().uuid("Must be a valid UUID");

export const stockQuerySchema = z
	.object({
		productId: uuid.optional(),
		warehouseId: uuid.optional(),
		locationId: uuid.optional(),
		categoryId: uuid.optional(),
		search: z.string().trim().min(1, "Search cannot be empty").optional(),
		lowStock: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
		page: z.coerce.number().int().positive().default(1),
		pageSize: z.coerce.number().int().positive().max(100).default(20),
	})
	.strict();

export type StockQueryInput = z.infer<typeof stockQuerySchema>;
