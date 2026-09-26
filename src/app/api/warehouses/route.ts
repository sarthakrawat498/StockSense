import { NextRequest } from "next/server";
import { WarehouseService } from "@/modules/warehouse";
import { createWarehouseSchema } from "@/features/warehouses/schemas/warehouse-schemas";
import { apiErrorFromException, apiSuccess, apiValidationError } from "@/lib/api/response";

const warehouseService = new WarehouseService();

export async function GET() {
	try {
		return apiSuccess(await warehouseService.list());
	} catch (error) {
		return apiErrorFromException(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const result = createWarehouseSchema.safeParse(await request.json());

		if (!result.success) {
			return apiValidationError(
				result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				})),
			);
		}

		return apiSuccess(await warehouseService.create(result.data), 201);
	} catch (error) {
		return apiErrorFromException(error);
	}
}
