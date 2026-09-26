import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ReorderRuleService } from "@/modules/reorder-rule";
import { updateReorderRuleSchema } from "@/features/reorder-rules/schemas/reorder-rule-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const service = new ReorderRuleService();
type Context = { params: Promise<{ id: string }> };

function validationResponse(result: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string; code: string }> } }) {
	return apiValidationError(result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message, code: issue.code })));
}

async function ruleId(context: Context) {
	return z.string().uuid("Reorder rule ID must be a valid UUID").safeParse((await context.params).id);
}

export async function GET(_request: NextRequest, context: Context) {
	try {
		const id = await ruleId(context);
		if (!id.success) return validationResponse(id);
		return apiSuccess(await service.getById(id.data));
	} catch (error) { return apiErrorFromException(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
	try {
		const id = await ruleId(context);
		if (!id.success) return validationResponse(id);
		const result = updateReorderRuleSchema.safeParse(await request.json());
		if (!result.success) return validationResponse(result);
		return apiSuccess(await service.update(id.data, result.data));
	} catch (error) { return apiErrorFromException(error); }
}

export async function DELETE(_request: NextRequest, context: Context) {
	try {
		const id = await ruleId(context);
		if (!id.success) return validationResponse(id);
		await service.delete(id.data);
		return new NextResponse(null, { status: 204 });
	} catch (error) { return apiErrorFromException(error); }
}
