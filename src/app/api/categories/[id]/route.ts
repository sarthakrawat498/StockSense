import { NextRequest } from "next/server";
import { z } from "zod";
import { updateCategorySchema } from "@/features/categories/schemas/category-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { CategoryService } from "@/modules/category";

const categoryService = new CategoryService();
const idSchema = z.string().uuid("Invalid category ID");
type RouteContext = { params: Promise<{ id: string }> };

function parseId(id: string) {
	const result = idSchema.safeParse(id);
	return result.success ? result.data : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);
		if (!validId) {
			return apiValidationError("Invalid category ID");
		}

		return apiSuccess(await categoryService.getById(validId));
	} catch (error) {
		return apiErrorFromException(error);
	}
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);
		if (!validId) {
			return apiValidationError("Invalid category ID");
		}

		const result = updateCategorySchema.safeParse(await request.json());
		if (!result.success) {
			return apiValidationError(
				result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				})),
			);
		}

		return apiSuccess(await categoryService.update(validId, result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
