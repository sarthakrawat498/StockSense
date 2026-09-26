import { useQuery } from "@tanstack/react-query";

import { API } from "@/constants/api-endpoints";
import { QUERY_KEYS } from "@/constants/query-keys";

export interface DashboardData {
  totalProductsInStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  lowStockItems: number;
  scheduledTransfers: number;
  recentOperations: {
    id: string;
    reference: string;
    type: string;
    warehouseName: string;
    responsibleUserName: string;
    status: string;
    createdAt: string;
  }[];
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: QUERY_KEYS.dashboard.kpis(),
    queryFn: async () => {
      const res = await fetch(API.DASHBOARD.KPIS);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message ?? "Failed to load dashboard");
      return json.data;
    },
    staleTime: 1000 * 30, // refresh every 30s
  });
}
