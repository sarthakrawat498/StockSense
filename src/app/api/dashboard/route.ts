import { apiErrorFromException, apiSuccess } from "@/lib/api/response";
import { DashboardService } from "@/modules/dashboard";

const service = new DashboardService();

export async function GET() {
	try { return apiSuccess(await service.getDashboard()); }
	catch (error) { return apiErrorFromException(error); }
}
