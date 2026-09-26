import {
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  ClipboardEdit,
} from "lucide-react";
import type { OperationType } from "@/types/common.types";

export interface OperationConfig {
  type: OperationType;
  title: string;
  singular: string;
  newLabel: string;
  icon: React.ElementType;
  iconColor: string;
  accent: string;
  referencePrefix: string;
  route: string;
  /** Does this operation need a FROM location? */
  hasFromLocation: boolean;
  /** Does this operation need a TO location? */
  hasToLocation: boolean;
  /** Label for the contact field (supplier / customer) */
  contactLabel: string | null;
  /** Label for the quantity column on line items */
  qtyLabel: string;
  emptyMessage: string;
}

export const OPERATION_CONFIG: Record<OperationType, OperationConfig> = {
  RECEIPT: {
    type: "RECEIPT",
    title: "Receipts",
    singular: "Receipt",
    newLabel: "New Receipt",
    icon: PackagePlus,
    iconColor: "text-emerald-500",
    accent: "bg-emerald-500/10",
    referencePrefix: "WH/IN",
    route: "receipts",
    hasFromLocation: false,
    hasToLocation: true,
    contactLabel: "Supplier",
    qtyLabel: "Demand Qty",
    emptyMessage: "No receipts yet. Create one to start receiving goods.",
  },
  DELIVERY: {
    type: "DELIVERY",
    title: "Deliveries",
    singular: "Delivery",
    newLabel: "New Delivery",
    icon: PackageMinus,
    iconColor: "text-orange-500",
    accent: "bg-orange-500/10",
    referencePrefix: "WH/OUT",
    route: "deliveries",
    hasFromLocation: true,
    hasToLocation: false,
    contactLabel: "Customer",
    qtyLabel: "Demand Qty",
    emptyMessage: "No delivery orders yet.",
  },
  TRANSFER: {
    type: "TRANSFER",
    title: "Transfers",
    singular: "Transfer",
    newLabel: "New Transfer",
    icon: ArrowRightLeft,
    iconColor: "text-violet-500",
    accent: "bg-violet-500/10",
    referencePrefix: "WH/TR",
    route: "transfers",
    hasFromLocation: true,
    hasToLocation: true,
    contactLabel: null,
    qtyLabel: "Qty",
    emptyMessage: "No internal transfers yet.",
  },
  ADJUSTMENT: {
    type: "ADJUSTMENT",
    title: "Adjustments",
    singular: "Adjustment",
    newLabel: "New Adjustment",
    icon: ClipboardEdit,
    iconColor: "text-amber-500",
    accent: "bg-amber-500/10",
    referencePrefix: "WH/ADJ",
    route: "adjustments",
    hasFromLocation: false,
    hasToLocation: false,
    contactLabel: null,
    qtyLabel: "Counted Qty",
    emptyMessage: "No stock adjustments yet.",
  },
};
