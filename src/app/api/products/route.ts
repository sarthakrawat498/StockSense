import { NextRequest } from "next/server";
import { ProductService } from "@/modules/product";
import { createProductSchema, productQuerySchema } from "@/features/products/schemas/product-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const productService = new ProductService();

function validationResponse(result: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string; code: string }> } }) {
	return apiValidationError(result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code })));
}

export async function GET(request: NextRequest) {
	try {
		const query = Object.fromEntries(request.nextUrl.searchParams.entries());
		const result = productQuerySchema.safeParse(query);
		if (!result.success) return validationResponse(result);
		return apiSuccess(await productService.list(result.data));
	} catch (error) { return apiErrorFromException(error); }
}

export async function POST(request: NextRequest) {
	try {
		const result = createProductSchema.safeParse(await request.json());
		if (!result.success) return validationResponse(result);
		return apiSuccess(await productService.create(result.data), 201);
	} catch (error) { return apiErrorFromException(error); }
}
