import { NextRequest } from "next/server";
import { createCategorySchema } from "@/features/categories/schemas/category-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { CategoryService } from "@/modules/category";

const categoryService = new CategoryService();

export async function GET() {
	try {
		return apiSuccess(await categoryService.list());
	} catch (error) {
		return apiErrorFromException(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const result = createCategorySchema.safeParse(await request.json());
		if (!result.success) {
			return apiValidationError(
				result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				})),
			);
		}

		return apiSuccess(await categoryService.create(result.data), 201);
	} catch (error) {
		return apiErrorFromException(error);
	}
}
