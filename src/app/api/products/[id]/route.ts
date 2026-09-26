import { NextRequest } from "next/server";
import { z } from "zod";
import { ProductService } from "@/modules/product";
import { updateProductSchema } from "@/features/products/schemas/product-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const productService = new ProductService();
type Context = { params: Promise<{ id: string }> };

function validationResponse(result: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string; code: string }> } }) {
	return apiValidationError(result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code })));
}

async function productId(context: Context) {
	const id = (await context.params).id;
	return z.string().uuid("Product ID must be a valid UUID").safeParse(id);
}

export async function GET(_request: NextRequest, context: Context) {
	try {
		const result = await productId(context);
		if (!result.success) return validationResponse(result);
		return apiSuccess(await productService.getById(result.data));
	} catch (error) { return apiErrorFromException(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
	try {
		const id = await productId(context);
		if (!id.success) return validationResponse(id);
		const result = updateProductSchema.safeParse(await request.json());
		if (!result.success) return validationResponse(result);
		return apiSuccess(await productService.update(id.data, result.data));
	} catch (error) { return apiErrorFromException(error); }
}
