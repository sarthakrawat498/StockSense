import { AlertService } from "@/modules/alerts";
import { apiErrorFromException, apiSuccess } from "@/lib/api/response";

const alertService = new AlertService();

export async function GET() {
	try {
		return apiSuccess(await alertService.getLowStockAlerts());
	} catch (error) {
		return apiErrorFromException(error);
	}
}
