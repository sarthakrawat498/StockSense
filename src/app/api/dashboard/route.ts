import { apiErrorFromException, apiSuccess } from "@/lib/api/response";
import { DashboardService } from "@/modules/dashboard";
import { OperationStatus, OperationType } from "@prisma/client";
import { z } from "zod";

const service = new DashboardService();

const querySchema = z.object({
	warehouseId: z.string().uuid().optional(),
	categoryId: z.string().uuid().optional(),
	operationType: z.nativeEnum(OperationType).optional(),
	status: z.nativeEnum(OperationStatus).optional(),
});

export async function GET(request: Request) {
	try {
		const query = Object.fromEntries(new URL(request.url).searchParams.entries());
		return apiSuccess(await service.getDashboard(querySchema.parse(query)));
	}
	catch (error) { return apiErrorFromException(error); }
}
