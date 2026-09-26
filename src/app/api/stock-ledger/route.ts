import { NextRequest } from "next/server";
import { stockLedgerQuerySchema } from "@/features/stock-ledger/schemas/stock-ledger-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { StockLedgerService } from "@/modules/stock-ledger";

const service = new StockLedgerService();

export async function GET(request: NextRequest) {
	try {
		const result = stockLedgerQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
		if (!result.success) return apiValidationError(result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code })));
		return apiSuccess(await service.list({ ...result.data, fromDate: result.data.fromDate?.toISOString(), toDate: result.data.toDate?.toISOString() }));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
