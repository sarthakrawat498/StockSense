/**
 * Application-wide constants.
 */
export const APP = {
  NAME: "StockSense",
  VERSION: "0.1.0",

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  },

  STOCK: {
    /** Products below this qty are considered "low stock" if no reorder rule set */
    DEFAULT_LOW_STOCK_THRESHOLD: 10,
  },

  DATE_FORMAT: {
    DISPLAY: "dd MMM yyyy",
    DISPLAY_WITH_TIME: "dd MMM yyyy, HH:mm",
    ISO: "yyyy-MM-dd",
  },

  /** Used as infix in operation references: {warehouseCode}/{prefix}/{seq} */
  OPERATION_REFERENCE_PREFIXES: {
    RECEIPT: "IN",
    DELIVERY: "OUT",
    TRANSFER: "TR",
    ADJUSTMENT: "ADJ",
  },
} as const;
