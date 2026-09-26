import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { LowStockAlert } from "@/modules/alerts";

export function getLowStockAlerts() {
	return httpClient.get<LowStockAlert[]>(API.ALERTS.LOW_STOCK);
}
