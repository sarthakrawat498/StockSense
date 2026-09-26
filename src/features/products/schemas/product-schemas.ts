import { z } from "zod";

const uuid = z.string().uuid("Must be a valid UUID");
const quantity = z.number().finite().nonnegative("Must be zero or greater");
const decimal = z.union([z.string(), z.number()]).transform(String).refine((value) => /^\d+(\.\d{1,6})?$/.test(value), "Must be a non-negative decimal with up to 6 decimal places");

export const createProductSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(160),
	sku: z.string().trim().min(1, "SKU is required").max(80),
	categoryId: uuid,
	uom: z.string().trim().min(1, "UOM is required").max(20),
	unitCost: decimal,
	reorderPoint: quantity.optional().default(0),
	initialStock: quantity.optional().default(0),
	initialLocationId: uuid.optional(),
}).strict().superRefine((value, context) => {
	if (value.initialStock > 0 && !value.initialLocationId) {
		context.addIssue({ code: z.ZodIssueCode.custom, path: ["initialLocationId"], message: "Initial location is required when initial stock is greater than zero" });
	}
});

export const updateProductSchema = z.object({
	name: z.string().trim().min(1, "Name cannot be empty").max(160).optional(),
	sku: z.string().trim().min(1, "SKU cannot be empty").max(80).optional(),
	categoryId: uuid.optional(),
	uom: z.string().trim().min(1, "UOM cannot be empty").max(20).optional(),
	unitCost: decimal.optional(),
	reorderPoint: quantity.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const productQuerySchema = z.object({
	search: z.string().trim().min(1).optional(),
	categoryId: uuid.optional(),
	warehouseId: uuid.optional(),
	locationId: uuid.optional(),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
}).strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;