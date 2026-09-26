import { NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { StockLedgerService } from "@/modules/stock-ledger";

const service = new StockLedgerService();
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
	try {
		const result = z.string().uuid("Ledger entry ID must be a valid UUID").safeParse((await context.params).id);
		if (!result.success) return apiValidationError(result.error.issues.map((issue) => ({ field: "id", message: issue.message, code: issue.code })));
		return apiSuccess(await service.getById(result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}