import { NextRequest } from "next/server";
import { ReorderRuleService } from "@/modules/reorder-rule";
import { createReorderRuleSchema, reorderRuleQuerySchema } from "@/features/reorder-rules/schemas/reorder-rule-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const service = new ReorderRuleService();

function validationResponse(result: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string; code: string }> } }) {
	return apiValidationError(result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code })));
}

export async function GET(request: NextRequest) {
	try {
		const result = reorderRuleQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
		if (!result.success) return validationResponse(result);
		return apiSuccess(await service.list(result.data));
	} catch (error) { return apiErrorFromException(error); }
}

export async function POST(request: NextRequest) {
	try {
		const result = createReorderRuleSchema.safeParse(await request.json());
		if (!result.success) return validationResponse(result);
		return apiSuccess(await service.create(result.data), 201);
	} catch (error) { return apiErrorFromException(error); }
}
