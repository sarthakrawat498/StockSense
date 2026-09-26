"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Warehouse, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MOCK_WAREHOUSES = [
  {
    id: "wh-1",
    name: "Main Warehouse",
    shortCode: "MW-01",
    address: "Plot 14, Industrial Estate, Sector 5, Delhi",
    locationCount: 4,
    productCount: 7,
    totalOnHand: 5649,
  },
  {
    id: "wh-2",
    name: "Warehouse B",
    shortCode: "WH-B",
    address: "Block C, Logistics Park, Noida",
    locationCount: 2,
    productCount: 3,
    totalOnHand: 1022,
  },
];

const MOCK_LOCATIONS: Record<string, { id: string; name: string; shortCode: string; productCount: number }[]> = {
  "wh-1": [
    { id: "loc-1", name: "Shelf A-1",       shortCode: "SHA-1", productCount: 3 },
    { id: "loc-2", name: "Rack B-3",         shortCode: "RKB-3", productCount: 2 },
    { id: "loc-4", name: "Production Floor", shortCode: "PROD",  productCount: 1 },
    { id: "loc-5", name: "Inspection Bay",   shortCode: "INSP",  productCount: 0 },
  ],
  "wh-2": [
    { id: "loc-3", name: "Main Store", shortCode: "MAIN", productCount: 2 },
    { id: "loc-6", name: "Rack C-1",   shortCode: "RKC-1",productCount: 1 },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarehousesPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK_WAREHOUSES.filter(
    (wh) =>
      !search ||
      wh.name.toLowerCase().includes(search.toLowerCase()) ||
      wh.shortCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-violet-500/10">
            <Warehouse className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Warehouses</h2>
            <p className="text-xs text-muted-foreground">{MOCK_WAREHOUSES.length} warehouses</p>
          </div>
        </div>
        <Link href={ROUTES.WAREHOUSES_NEW}>
          <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            New Warehouse
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search warehouses…"
            className="h-8 pl-8 text-xs bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Warehouse cards */}
      <div className="space-y-4">
        {filtered.map((wh) => {
          const isOpen = expanded === wh.id;
          const locations = MOCK_LOCATIONS[wh.id] ?? [];

          return (
            <div key={wh.id} className="glass-card rounded-xl overflow-hidden">
              {/* Warehouse row */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 dark:hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isOpen ? null : wh.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <Warehouse className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{wh.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{wh.shortCode}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{wh.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Locations</p>
                    <p className="text-sm font-semibold">{wh.locationCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="text-sm font-semibold">{wh.productCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total On Hand</p>
                    <p className="text-sm font-semibold tabular-nums">{wh.totalOnHand.toLocaleString()}</p>
                  </div>
                  <div className={`text-xs text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}>
                    ›
                  </div>
                </div>
              </div>

              {/* Locations table (expandable) */}
              {isOpen && (
                <div className="border-t">
                  <div className="px-5 py-3 flex items-center justify-between bg-muted/20 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Locations in {wh.name}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary px-2">
                      <Plus className="h-3 w-3" /> Add Location
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-2.5 pl-5">Location</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Code</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Products</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((loc) => (
                        <TableRow key={loc.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/20">
                          <TableCell className="py-2.5 pl-5 text-sm">{loc.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{loc.shortCode}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{loc.productCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
