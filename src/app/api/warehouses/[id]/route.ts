import { NextRequest } from "next/server";
import { z } from "zod";
import { WarehouseService } from "@/modules/warehouse";
import { updateWarehouseSchema } from "@/features/warehouses/schemas/warehouse-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const warehouseService = new WarehouseService();
const idSchema = z.string().uuid("Invalid warehouse ID");

type RouteContext = { params: Promise<{ id: string }> };

function parseId(id: string) {
	const result = idSchema.safeParse(id);
	return result.success ? result.data : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);

		if (!validId) {
			return apiValidationError("Invalid warehouse ID");
		}

		return apiSuccess(await warehouseService.getById(validId));
	} catch (error) {
		return apiErrorFromException(error);
	}
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);

		if (!validId) {
			return apiValidationError("Invalid warehouse ID");
		}

		const result = updateWarehouseSchema.safeParse(await request.json());

		if (!result.success) {
			return apiValidationError(
				result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				})),
			);
		}

		return apiSuccess(await warehouseService.update(validId, result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
