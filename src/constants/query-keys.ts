/**
 * TanStack Query cache keys — single source of truth.
 *
 * Using nested arrays allows precise invalidation:
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all() })
 *   queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.detail(id) })
 */
export const QUERY_KEYS = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    kpis: () => ["dashboard", "kpis"] as const,
    alerts: () => ["dashboard", "alerts"] as const,
  },

  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    all: (filters?: Record<string, unknown>) => ["products", "list", filters] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    categories: () => ["products", "categories"] as const,
    units: () => ["products", "units"] as const,
  },

  // ── Operations: Receipts ──────────────────────────────────────────────────
  receipts: {
    all: (filters?: Record<string, unknown>) => ["receipts", "list", filters] as const,
    detail: (id: string) => ["receipts", "detail", id] as const,
  },

  // ── Operations: Deliveries ────────────────────────────────────────────────
  deliveries: {
    all: (filters?: Record<string, unknown>) => ["deliveries", "list", filters] as const,
    detail: (id: string) => ["deliveries", "detail", id] as const,
  },

  // ── Operations: Transfers ─────────────────────────────────────────────────
  transfers: {
    all: (filters?: Record<string, unknown>) => ["transfers", "list", filters] as const,
    detail: (id: string) => ["transfers", "detail", id] as const,
  },

  // ── Operations: Adjustments ───────────────────────────────────────────────
  adjustments: {
    all: (filters?: Record<string, unknown>) => ["adjustments", "list", filters] as const,
    detail: (id: string) => ["adjustments", "detail", id] as const,
  },

  // ── Warehouses ────────────────────────────────────────────────────────────
  warehouses: {
    all: () => ["warehouses", "list"] as const,
    detail: (id: string) => ["warehouses", "detail", id] as const,
    locations: (warehouseId: string) => ["warehouses", "locations", warehouseId] as const,
  },

  // ── Move History / Stock Ledger ───────────────────────────────────────────
  stockMoves: {
    all: (filters?: Record<string, unknown>) => ["stockMoves", "list", filters] as const,
  },

  // ── Auth / User ───────────────────────────────────────────────────────────
  user: {
    me: () => ["user", "me"] as const,
  },
} as const;
