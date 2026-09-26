import { NextRequest } from "next/server";
import { stockQuerySchema } from "@/features/products/schemas/stock-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { StockReadService } from "@/modules/stock-ledger";

const stockReadService = new StockReadService();

function validationDetails(error: { issues: Array<{ path: (string | number)[]; message: string; code: string }> }) {
	return error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code }));
}

export async function GET(request: NextRequest) {
	try {
		const query = Object.fromEntries(request.nextUrl.searchParams.entries());
		const result = stockQuerySchema.safeParse(query);
		if (!result.success) return apiValidationError(validationDetails(result.error));
		return apiSuccess(await stockReadService.list(result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
