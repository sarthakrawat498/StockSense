"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { getDashboard } from "../services/dashboard.service";

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.kpis(),
    queryFn: () => getDashboard(),
  });
}
