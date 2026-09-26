import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";

export interface LowStockAlert {
  productId: string;
  productName: string;
  sku: string;
  effectiveThreshold: number;
  currentStock: number;
  isOutOfStock: boolean;
  suggestedQuantity: number;
}

export function useLowStockAlerts() {
  return useQuery<LowStockAlert[]>({
    queryKey: QUERY_KEYS.dashboard.alerts(),
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      const json = await res.json();
      if (!res.ok || !json.success) {
        // Endpoint may not exist yet — return empty array gracefully
        return [];
      }
      return json.data ?? [];
    },
    staleTime: 1000 * 60,
  });
}
