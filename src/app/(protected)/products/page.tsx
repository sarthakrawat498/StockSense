"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { ROUTES } from "@/constants/routes";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Raw Materials" },
  { id: "cat-2", name: "Hardware" },
  { id: "cat-3", name: "Electrical" },
];

const MOCK_PRODUCTS = [
  { id: "p-1", name: "Steel Rod 12mm",    sku: "STL-ROD-12", category: "Raw Materials", uom: "KG",  unitCost: 85.00,  onHand: 477, lowStock: false },
  { id: "p-2", name: "Steel Plate 6mm",   sku: "STL-PLT-06", category: "Raw Materials", uom: "KG",  unitCost: 120.00, onHand: 200, lowStock: false },
  { id: "p-3", name: "Copper Wire 2.5mm", sku: "COP-WIR-25", category: "Electrical",   uom: "M",   unitCost: 45.50,  onHand: 942, lowStock: false },
  { id: "p-4", name: "Aluminium Sheet",   sku: "ALU-SHT-01", category: "Raw Materials", uom: "PCS", unitCost: 350.00, onHand: 30,  lowStock: true  },
  { id: "p-5", name: "Bolt M8",           sku: "BLT-M8-001", category: "Hardware",     uom: "PCS", unitCost: 2.50,   onHand: 4000,lowStock: false },
  { id: "p-6", name: "Nut M8",            sku: "NUT-M8-001", category: "Hardware",     uom: "PCS", unitCost: 1.80,   onHand: 0,   lowStock: true  },
  { id: "p-7", name: "Cable Duct 40mm",   sku: "CDT-40-001", category: "Electrical",   uom: "M",   unitCost: 28.00,  onHand: 8,   lowStock: true  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchStock =
      stockFilter === "all" ||
      (stockFilter === "low" && p.lowStock) ||
      (stockFilter === "out" && p.onHand === 0);
    return matchSearch && matchCategory && matchStock;
  });

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-500/10">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Products</h2>
            <p className="text-xs text-muted-foreground">{MOCK_PRODUCTS.length} products</p>
          </div>
        </div>
        <Link href={ROUTES.PRODUCTS_NEW}>
          <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            className="h-8 pl-8 text-xs bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {MOCK_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="All stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All stock</SelectItem>
            <SelectItem value="low" className="text-xs">Low stock</SelectItem>
            <SelectItem value="out" className="text-xs">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="mb-4 rounded-xl bg-muted/50 p-4">
              <Package className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">No products match your filters</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Product</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">SKU</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UoM</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Unit Cost</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">On Hand</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Stock Value</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer dark:hover:bg-white/[0.025] hover:bg-muted/40 transition-colors"
                  onClick={() => { window.location.href = ROUTES.PRODUCT_DETAIL(p.id); }}
                >
                  <TableCell className="py-3 font-medium text-sm">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.uom}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    ₹{p.unitCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-semibold tabular-nums ${
                    p.onHand === 0 ? "text-destructive" : p.lowStock ? "text-amber-500" : ""
                  }`}>
                    {p.onHand.toLocaleString()} {p.uom}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    ₹{(p.unitCost * p.onHand).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    {p.onHand === 0 ? (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 rounded-sm">Out of stock</Badge>
                    ) : p.lowStock ? (
                      <Badge className="text-[10px] h-5 px-1.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-0">Low stock</Badge>
                    ) : (
                      <Badge className="text-[10px] h-5 px-1.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-0">In stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
}
