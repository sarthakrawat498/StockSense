"use client";

import { useState } from "react";
import { Search, History } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { OperationType } from "@/types/common.types";
import { useMoveHistory } from "@/features/move-history/hooks/use-move-history";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface StockMove {
  id: string;
  reference: string;
  operationType: OperationType;
  product: string;
  sku: string;
  uom: string;
  fromLocation: string | null;
  toLocation: string | null;
  quantity: number;
  movedBy: string;
  movedAt: string;
}

const MOCK_MOVES: StockMove[] = [
  {
    id: "m-1", reference: "WH/IN/0003",  operationType: "RECEIPT",
    product: "Bolt M8",           sku: "BLT-M8-001", uom: "PCS",
    fromLocation: null,           toLocation: "Main Store",
    quantity: 5000, movedBy: "staff01",   movedAt: "2026-09-24 14:22",
  },
  {
    id: "m-2", reference: "WH/OUT/0001", operationType: "DELIVERY",
    product: "Steel Rod 12mm",    sku: "STL-ROD-12", uom: "KG",
    fromLocation: "Shelf A-1",    toLocation: null,
    quantity: 200,  movedBy: "vasusingh", movedAt: "2026-09-25 16:10",
  },
  {
    id: "m-3", reference: "WH/TR/0001",  operationType: "TRANSFER",
    product: "Steel Rod 12mm",    sku: "STL-ROD-12", uom: "KG",
    fromLocation: "Shelf A-1",    toLocation: "Production Floor",
    quantity: 100,  movedBy: "vasusingh", movedAt: "2026-09-26 08:05",
  },
  {
    id: "m-4", reference: "WH/ADJ/0001", operationType: "ADJUSTMENT",
    product: "Steel Rod 12mm",    sku: "STL-ROD-12", uom: "KG",
    fromLocation: "Shelf A-1",    toLocation: null,
    quantity: -3,   movedBy: "vasusingh", movedAt: "2026-09-26 09:15",
  },
  {
    id: "m-5", reference: "WH/ADJ/0001", operationType: "ADJUSTMENT",
    product: "Copper Wire 2.5mm", sku: "COP-WIR-25", uom: "M",
    fromLocation: "Shelf A-1",    toLocation: null,
    quantity: -8,   movedBy: "vasusingh", movedAt: "2026-09-26 09:15",
  },
  {
    id: "m-6", reference: "WH/IN/0001",  operationType: "RECEIPT",
    product: "Steel Rod 12mm",    sku: "STL-ROD-12", uom: "KG",
    fromLocation: null,           toLocation: "Shelf A-1",
    quantity: 500,  movedBy: "vasusingh", movedAt: "2026-09-26 11:00",
  },
  {
    id: "m-7", reference: "WH/IN/0001",  operationType: "RECEIPT",
    product: "Steel Plate 6mm",   sku: "STL-PLT-06", uom: "KG",
    fromLocation: null,           toLocation: "Shelf A-1",
    quantity: 200,  movedBy: "vasusingh", movedAt: "2026-09-26 11:00",
  },
];

const TYPE_STYLES: Record<OperationType, { label: string; className: string }> = {
  RECEIPT:    { label: "Receipt",    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DELIVERY:   { label: "Delivery",   className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  TRANSFER:   { label: "Transfer",   className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ADJUSTMENT: { label: "Adjustment", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoveHistoryPage() {
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState("all");
  const { data, isLoading, isError } = useMoveHistory(
    typeFilter === "all" ? {} : { operationType: typeFilter as OperationType },
  );

  const moves: StockMove[] = (data?.items ?? []).map((move) => {
    const isOutbound = move.type === "DELIVERY" || move.type === "ADJUSTMENT_OUT";
    return {
      id: move.id,
      reference: move.reference,
      operationType: move.operationType,
      product: move.productName ?? "Unknown product",
      sku: move.productSku ?? "—",
      uom: "",
      fromLocation: move.fromLocationName ?? null,
      toLocation: move.toLocationName ?? null,
      quantity: isOutbound ? -move.quantity : move.quantity,
      movedBy: "—",
      movedAt: move.movedAt,
    };
  });

  const filtered = moves.filter((m) => {
    const matchSearch =
      !search ||
      m.reference.toLowerCase().includes(search.toLowerCase()) ||
      m.product.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.operationType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-slate-500/10">
          <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Move History</h2>
          <p className="text-xs text-muted-foreground">Complete stock ledger — all validated movements</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by reference, product or SKU…"
            className="h-8 pl-8 text-xs bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setType}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            <SelectItem value="RECEIPT"    className="text-xs">Receipt</SelectItem>
            <SelectItem value="DELIVERY"   className="text-xs">Delivery</SelectItem>
            <SelectItem value="TRANSFER"   className="text-xs">Transfer</SelectItem>
            <SelectItem value="ADJUSTMENT" className="text-xs">Adjustment</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">
          {data?.total ?? filtered.length} record{(data?.total ?? filtered.length) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Ledger table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Reference</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Product</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">From</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">To</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Qty</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Moved By</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="py-16 text-center text-sm text-muted-foreground">Loading ledger…</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={9} className="py-16 text-center text-sm text-destructive">Unable to load move history.</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                  No records match your filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const { label, className } = TYPE_STYLES[m.operationType];
                return (
                  <TableRow key={m.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-mono text-xs font-semibold">{m.reference}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${className}`}>
                        {label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{m.product}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.sku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.fromLocation ?? <span className="opacity-40">—</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.toLocation ?? <span className="opacity-40">—</span>}</TableCell>
                    <TableCell className={`text-right text-sm font-bold tabular-nums ${
                      m.quantity < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity.toLocaleString()} {m.uom}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.movedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.movedAt}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
