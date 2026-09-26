import { API } from "@/constants/api-endpoints";
import { httpClient } from "@/lib/http/client";
import type { DashboardFilters, DashboardKPIs } from "@/modules/dashboard";

export function getDashboard(filters: DashboardFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return httpClient.get<DashboardKPIs>(`${API.DASHBOARD.KPIS}${query ? `?${query}` : ""}`);
}
