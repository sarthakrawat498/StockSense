"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { getLowStockAlerts } from "../services/alerts.service";

export function useLowStockAlerts() {
	return useQuery({ queryKey: QUERY_KEYS.alerts.lowStock(), queryFn: getLowStockAlerts });
}
