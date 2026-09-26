import { NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { StockReadService } from "@/modules/stock-ledger";

const stockReadService = new StockReadService();
type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid("Location ID must be a valid UUID");

export async function GET(_request: NextRequest, context: RouteContext) {
	try {
		const result = idSchema.safeParse((await context.params).id);
		if (!result.success) {
			return apiValidationError(result.error.issues.map((issue) => ({ field: "id", message: issue.message, code: issue.code })));
		}

		return apiSuccess(await stockReadService.getByLocation(result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
