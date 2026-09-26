import type { OperationType, OperationStatus } from "@/types/common.types";

// ─── UI-layer mock types (mirrors canonical schema) ───────────────────────────

export interface MockOperationItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productUom: string;
  quantity: number;
  countedQuantity: number | null;
  locationName?: string;
}

export interface MockOperation {
  id: string;
  reference: string;
  operationType: OperationType;
  status: OperationStatus;
  warehouseId: string;
  warehouseName: string;
  fromLocationId: string | null;
  fromLocationName: string | null;
  toLocationId: string | null;
  toLocationName: string | null;
  contactName: string | null;
  scheduleDate: string | null;
  responsibleUserId: string;
  responsibleUsername: string;
  notes: string | null;
  createdAt: string;
  validatedAt: string | null;
  canceledAt: string | null;
  items: MockOperationItem[];
}

// ─── Mock dataset ─────────────────────────────────────────────────────────────

export const MOCK_OPERATIONS: MockOperation[] = [
  {
    id: "op-001",
    reference: "WH/IN/0001",
    operationType: "RECEIPT",
    status: "READY",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: null,
    fromLocationName: null,
    toLocationId: "loc-1",
    toLocationName: "Shelf A-1",
    contactName: "Steel Corp Ltd.",
    scheduleDate: "2026-09-28",
    responsibleUserId: "u-1",
    responsibleUsername: "vasusingh",
    notes: "Urgent delivery, handle with care.",
    createdAt: "2026-09-26T08:00:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-1", productId: "p-1", productName: "Steel Rod 12mm", productSku: "STL-ROD-12", productUom: "KG", quantity: 500, countedQuantity: null },
      { id: "i-2", productId: "p-2", productName: "Steel Plate 6mm", productSku: "STL-PLT-06", productUom: "KG", quantity: 200, countedQuantity: null },
      { id: "i-3", productId: "p-3", productName: "Copper Wire 2.5mm", productSku: "COP-WIR-25", productUom: "M",  quantity: 1000, countedQuantity: null },
    ],
  },
  {
    id: "op-002",
    reference: "WH/IN/0002",
    operationType: "RECEIPT",
    status: "WAITING",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: null,
    fromLocationName: null,
    toLocationId: "loc-2",
    toLocationName: "Rack B-3",
    contactName: "Metals Direct",
    scheduleDate: "2026-09-30",
    responsibleUserId: "u-1",
    responsibleUsername: "vasusingh",
    notes: null,
    createdAt: "2026-09-26T09:30:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-4", productId: "p-4", productName: "Aluminium Sheet", productSku: "ALU-SHT-01", productUom: "PCS", quantity: 50, countedQuantity: null },
    ],
  },
  {
    id: "op-003",
    reference: "WH/IN/0003",
    operationType: "RECEIPT",
    status: "DONE",
    warehouseId: "wh-2",
    warehouseName: "Warehouse B",
    fromLocationId: null,
    fromLocationName: null,
    toLocationId: "loc-3",
    toLocationName: "Main Store",
    contactName: "FastParts Inc.",
    scheduleDate: "2026-09-24",
    responsibleUserId: "u-2",
    responsibleUsername: "staff01",
    notes: null,
    createdAt: "2026-09-23T10:00:00Z",
    validatedAt: "2026-09-24T14:22:00Z",
    canceledAt: null,
    items: [
      { id: "i-5", productId: "p-5", productName: "Bolt M8", productSku: "BLT-M8-001", productUom: "PCS", quantity: 5000, countedQuantity: null },
    ],
  },
  {
    id: "op-004",
    reference: "WH/OUT/0001",
    operationType: "DELIVERY",
    status: "READY",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: "loc-1",
    fromLocationName: "Shelf A-1",
    toLocationId: null,
    toLocationName: null,
    contactName: "BuildRight Pvt. Ltd.",
    scheduleDate: "2026-09-27",
    responsibleUserId: "u-1",
    responsibleUsername: "vasusingh",
    notes: "Priority shipment.",
    createdAt: "2026-09-25T11:00:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-6", productId: "p-1", productName: "Steel Rod 12mm", productSku: "STL-ROD-12", productUom: "KG", quantity: 200, countedQuantity: null },
    ],
  },
  {
    id: "op-005",
    reference: "WH/OUT/0002",
    operationType: "DELIVERY",
    status: "DRAFT",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: "loc-2",
    fromLocationName: "Rack B-3",
    toLocationId: null,
    toLocationName: null,
    contactName: "ConstructCo",
    scheduleDate: "2026-10-01",
    responsibleUserId: "u-2",
    responsibleUsername: "staff01",
    notes: null,
    createdAt: "2026-09-26T12:00:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-7", productId: "p-4", productName: "Aluminium Sheet", productSku: "ALU-SHT-01", productUom: "PCS", quantity: 20, countedQuantity: null },
      { id: "i-8", productId: "p-5", productName: "Bolt M8", productSku: "BLT-M8-001", productUom: "PCS", quantity: 1000, countedQuantity: null },
    ],
  },
  {
    id: "op-006",
    reference: "WH/TR/0001",
    operationType: "TRANSFER",
    status: "READY",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: "loc-1",
    fromLocationName: "Shelf A-1",
    toLocationId: "loc-4",
    toLocationName: "Production Floor",
    contactName: null,
    scheduleDate: "2026-09-27",
    responsibleUserId: "u-1",
    responsibleUsername: "vasusingh",
    notes: "Move to production for morning shift.",
    createdAt: "2026-09-26T07:00:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-9", productId: "p-1", productName: "Steel Rod 12mm", productSku: "STL-ROD-12", productUom: "KG", quantity: 100, countedQuantity: null },
    ],
  },
  {
    id: "op-007",
    reference: "WH/TR/0002",
    operationType: "TRANSFER",
    status: "WAITING",
    warehouseId: "wh-2",
    warehouseName: "Warehouse B",
    fromLocationId: "loc-3",
    fromLocationName: "Main Store",
    toLocationId: "loc-5",
    toLocationName: "Rack C-1",
    contactName: null,
    scheduleDate: "2026-09-29",
    responsibleUserId: "u-2",
    responsibleUsername: "staff01",
    notes: null,
    createdAt: "2026-09-26T10:00:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-10", productId: "p-2", productName: "Steel Plate 6mm", productSku: "STL-PLT-06", productUom: "KG", quantity: 80, countedQuantity: null },
    ],
  },
  {
    id: "op-008",
    reference: "WH/ADJ/0001",
    operationType: "ADJUSTMENT",
    status: "DRAFT",
    warehouseId: "wh-1",
    warehouseName: "Main Warehouse",
    fromLocationId: null,
    fromLocationName: null,
    toLocationId: null,
    toLocationName: null,
    contactName: null,
    scheduleDate: null,
    responsibleUserId: "u-1",
    responsibleUsername: "vasusingh",
    notes: "Weekly physical count reconciliation.",
    createdAt: "2026-09-26T08:30:00Z",
    validatedAt: null,
    canceledAt: null,
    items: [
      { id: "i-11", productId: "p-1", productName: "Steel Rod 12mm", productSku: "STL-ROD-12", productUom: "KG", quantity: 480, countedQuantity: 477, locationName: "Shelf A-1" },
      { id: "i-12", productId: "p-3", productName: "Copper Wire 2.5mm", productSku: "COP-WIR-25", productUom: "M",  quantity: 950, countedQuantity: 942, locationName: "Shelf A-1" },
    ],
  },
];
