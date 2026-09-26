/**
 * Backend API endpoint paths (used by frontend services).
 * Always build URLs relative to these constants — never hardcode strings.
 */
export const API = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    RESET_PASSWORD_REQUEST: "/api/auth/reset-password/request",
    RESET_PASSWORD_CONFIRM: "/api/auth/reset-password/confirm",
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  USERS: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    ME: "/api/users/me",
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  DASHBOARD: {
    KPIS: "/api/dashboard",
  },

  // ── Products ──────────────────────────────────────────────────────────────
  PRODUCTS: {
    BASE: "/api/products",
    BY_ID: (id: string) => `/api/products/${id}`,
    STOCK: (id: string) => `/api/products/${id}/stock`,
    CATEGORIES: "/api/products/categories",
    UNITS: "/api/products/units",
  },

  REORDER_RULES: {
    BASE: "/api/reorder-rules",
    BY_ID: (id: string) => `/api/reorder-rules/${id}`,
  },

  // ── Categories ───────────────────────────────────────────────────────────
  CATEGORIES: {
    BASE: "/api/categories",
    BY_ID: (id: string) => `/api/categories/${id}`,
  },

  // ── Operations ────────────────────────────────────────────────────────────
  RECEIPTS: {
    BASE: "/api/operations/receipts",
    BY_ID: (id: string) => `/api/operations/receipts/${id}`,
    VALIDATE: (id: string) => `/api/operations/receipts/${id}/validate`,
  },

  DELIVERIES: {
    BASE: "/api/operations/deliveries",
    BY_ID: (id: string) => `/api/operations/deliveries/${id}`,
    VALIDATE: (id: string) => `/api/operations/deliveries/${id}/validate`,
  },

  TRANSFERS: {
    BASE: "/api/operations/transfers",
    BY_ID: (id: string) => `/api/operations/transfers/${id}`,
    VALIDATE: (id: string) => `/api/operations/transfers/${id}/validate`,
  },

  ADJUSTMENTS: {
    BASE: "/api/operations/adjustments",
    BY_ID: (id: string) => `/api/operations/adjustments/${id}`,
    VALIDATE: (id: string) => `/api/operations/adjustments/${id}/validate`,
  },

  // ── Warehouses ────────────────────────────────────────────────────────────
  WAREHOUSES: {
    BASE: "/api/warehouses",
    BY_ID: (id: string) => `/api/warehouses/${id}`,
    LOCATIONS: (id: string) => `/api/warehouses/${id}/locations`,
  },

  LOCATIONS: {
    BY_ID: (id: string) => `/api/locations/${id}`,
  },

  // ── Stock Ledger ─────────────────────────────────────────────────────────
  STOCK: {
    BASE: "/api/stock",
  },
  STOCK_LEDGER: {
    BASE: "/api/stock-ledger",
  },
} as const;
