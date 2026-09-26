import { NextRequest } from "next/server";
import { z } from "zod";
import { updateLocationSchema } from "@/features/warehouses/schemas/warehouse-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";
import { WarehouseService } from "@/modules/warehouse";

const warehouseService = new WarehouseService();
const idSchema = z.string().uuid("Invalid location ID");
type RouteContext = { params: Promise<{ id: string }> };

function parseId(id: string) {
	const result = idSchema.safeParse(id);
	return result.success ? result.data : null;
}

function validationDetails(error: z.ZodError) {
	return error.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}));
}

export async function GET(_request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);
		if (!validId) {
			return apiValidationError("Invalid location ID");
		}

		return apiSuccess(await warehouseService.getLocationById(validId));
	} catch (error) {
		return apiErrorFromException(error);
	}
}

export async function PATCH(request: NextRequest, context: RouteContext) {
	try {
		const { id } = await context.params;
		const validId = parseId(id);
		if (!validId) {
			return apiValidationError("Invalid location ID");
		}

		const result = updateLocationSchema.safeParse(await request.json());
		if (!result.success) {
			return apiValidationError(validationDetails(result.error));
		}

		return apiSuccess(await warehouseService.updateLocation(validId, result.data));
	} catch (error) {
		return apiErrorFromException(error);
	}
}
