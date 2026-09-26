/**
 * Canonical client-side route paths.
 * Import this everywhere instead of hardcoding strings.
 *
 * Usage:
 *   import { ROUTES } from "@/constants/routes";
 *   router.push(ROUTES.DASHBOARD);
 */
export const ROUTES = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // ── Core ──────────────────────────────────────────────────────────────────
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",

  // ── Products ──────────────────────────────────────────────────────────────
  PRODUCTS: "/products",
  PRODUCTS_NEW: "/products/new",
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  PRODUCT_EDIT: (id: string) => `/products/${id}/edit`,

  // ── Operations ────────────────────────────────────────────────────────────
  // Receipts
  RECEIPTS: "/operations/receipts",
  RECEIPTS_NEW: "/operations/receipts/new",
  RECEIPT_DETAIL: (id: string) => `/operations/receipts/${id}`,

  // Deliveries
  DELIVERIES: "/operations/deliveries",
  DELIVERIES_NEW: "/operations/deliveries/new",
  DELIVERY_DETAIL: (id: string) => `/operations/deliveries/${id}`,

  // Transfers
  TRANSFERS: "/operations/transfers",
  TRANSFERS_NEW: "/operations/transfers/new",
  TRANSFER_DETAIL: (id: string) => `/operations/transfers/${id}`,

  // Adjustments
  ADJUSTMENTS: "/operations/adjustments",
  ADJUSTMENTS_NEW: "/operations/adjustments/new",
  ADJUSTMENT_DETAIL: (id: string) => `/operations/adjustments/${id}`,

  // Move History (Stock Ledger)
  MOVE_HISTORY: "/move-history",

  // ── Warehouses ────────────────────────────────────────────────────────────
  WAREHOUSES: "/warehouses",
  WAREHOUSES_NEW: "/warehouses/new",
  WAREHOUSE_DETAIL: (id: string) => `/warehouses/${id}`,
} as const;
