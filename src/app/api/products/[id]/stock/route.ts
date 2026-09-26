import { NextRequest } from "next/server";
import { z } from "zod";
import { ProductService } from "@/modules/product";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const productService = new ProductService();
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
	try {
		const id = z.string().uuid("Product ID must be a valid UUID").safeParse((await context.params).id);
		if (!id.success) return apiValidationError(id.error.issues.map((issue) => ({ field: "id", message: issue.message, code: issue.code })));
		return apiSuccess(await productService.getStock(id.data));
	} catch (error) { return apiErrorFromException(error); }
}