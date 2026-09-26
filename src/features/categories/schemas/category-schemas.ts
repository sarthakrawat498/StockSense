import { z } from "zod";

export const createCategorySchema = z
	.object({
		name: z.string().trim().min(1, "Name is required").max(100),
	})
	.strict();

export const updateCategorySchema = z
	.object({
		name: z.string().trim().min(1, "Name cannot be empty").max(100),
	})
	.strict()
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
