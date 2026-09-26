"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, Fragment } from "react";
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  Layers,
  Search,
  Loader2,
  Boxes,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { useWarehouse } from "@/features/warehouses/hooks/use-warehouses";
import { useWarehouseLocations } from "@/features/warehouses/hooks/use-warehouse-locations";
import { useStock } from "@/features/stock/hooks/use-stock";
import { AddLocationDialog } from "@/features/warehouses/components/add-location-dialog";

export default function WarehouseDetailPage() {
  const params = useParams<{ id: string }>();
  const warehouseId = params.id;

  const [productSearch, setProductSearch] = useState("");
  const [expandedLocId, setExpandedLocId] = useState<string | null>(null);

  const {
    data: warehouse,
    isLoading: warehouseLoading,
    isError: warehouseError,
  } = useWarehouse(warehouseId);

  const {
    data: locations = [],
    isLoading: locationsLoading,
    refetch: refetchLocations,
  } = useWarehouseLocations(warehouseId);

  const {
    data: stockData,
    isLoading: stockLoading,
  } = useStock({ warehouseId, pageSize: 100 });

  const stockItems = stockData?.items ?? [];
  const uniqueProductsCount = new Set(stockItems.map((item) => item.productId)).size;
  const totalOnHand = stockItems.reduce((acc, item) => acc + item.onHandQty, 0);
  const totalReserved = stockItems.reduce((acc, item) => acc + item.reservedQty, 0);
  const totalFree = stockItems.reduce((acc, item) => acc + item.freeQty, 0);

  const filteredProducts = stockItems.filter(
    (item) =>
      !productSearch ||
      item.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.locationName.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (warehouseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Loading warehouse details…</span>
      </div>
    );
  }

  if (warehouseError || !warehouse) {
    return (
      <div className="space-y-4 max-w-[800px]">
        <Link href={ROUTES.WAREHOUSES}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Warehouses
          </Button>
        </Link>
        <div className="glass-card rounded-xl p-8 text-center text-xs text-destructive">
          Warehouse not found or could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.WAREHOUSES}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="rounded-lg p-2.5 bg-violet-500/10">
            <WarehouseIcon className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{warehouse.name}</h1>
              <Badge variant="outline" className="font-mono text-[11px] px-2">
                {warehouse.code}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 inline shrink-0" />
              {warehouse.address ?? "No physical address provided"}
            </p>
          </div>
        </div>

        <AddLocationDialog
          warehouseId={warehouse.id}
          warehouseName={warehouse.name}
          onSuccess={() => refetchLocations()}
          trigger={
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              Add Location
            </Button>
          }
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Locations
          </p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {locations.length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Storage zones</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unique Products
          </p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {stockLoading ? "…" : uniqueProductsCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Stored SKUs</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            On Hand Units
          </p>
          <p className="text-2xl font-bold mt-1 text-foreground tabular-nums">
            {stockLoading ? "…" : totalOnHand.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Physical count</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reserved Units
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-500 tabular-nums">
            {stockLoading ? "…" : totalReserved.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Committed orders</p>
        </div>

        <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Free to Use
          </p>
          <p className="text-2xl font-bold mt-1 text-emerald-500 tabular-nums">
            {stockLoading ? "…" : totalFree.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Available for sale</p>
        </div>
      </div>

      {/* Tabs: Locations vs Stored Inventory */}
      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="locations" className="gap-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Storage Locations ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2 text-xs">
            <Package className="h-3.5 w-3.5" />
            Warehouse Inventory ({stockItems.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Locations Tab ──────────────────────────────────────────────── */}
        <TabsContent value="locations" className="space-y-4">
          {locationsLoading ? (
            <div className="glass-card rounded-xl py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading locations…
            </div>
          ) : locations.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No storage locations defined for this warehouse.
              </p>
              <div className="mt-3">
                <AddLocationDialog
                  warehouseId={warehouse.id}
                  warehouseName={warehouse.name}
                  onSuccess={() => refetchLocations()}
                />
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider pl-5">
                      Location Name
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">
                      Code
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider">
                      Inventory Stored
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-right pr-5">
                      On Hand / Free
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => {
                    const locProducts = stockItems.filter(
                      (item) => item.locationId === loc.id
                    );
                    const onHand = locProducts.reduce(
                      (acc, item) => acc + item.onHandQty,
                      0
                    );
                    const free = locProducts.reduce(
                      (acc, item) => acc + item.freeQty,
                      0
                    );
                    const isExpanded = expandedLocId === loc.id;

                    return (
                      <Fragment key={loc.id}>
                        <TableRow
                          className="hover:bg-muted/20 cursor-pointer"
                          onClick={() => setExpandedLocId(isExpanded ? null : loc.id)}
                        >
                          <TableCell className="pl-5 py-3 font-medium text-xs flex items-center gap-2">
                            <span
                              className={`text-muted-foreground transition-transform text-[10px] ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            >
                              ›
                            </span>
                            {loc.name}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                            {loc.code}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {locProducts.length === 0 ? (
                              <span className="italic text-muted-foreground/60">
                                0 items
                              </span>
                            ) : (
                              <span className="font-medium text-foreground">
                                {locProducts.length} product
                                {locProducts.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right pr-5 text-xs font-medium tabular-nums">
                            {onHand.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({free.toLocaleString()} free)
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expanded details of products in this location */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={4} className="py-3.5 px-8">
                              {locProducts.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                  No product items currently in this location.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Stored Products at {loc.name}:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {locProducts.map((p) => (
                                      <div
                                        key={p.id}
                                        className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs flex items-center justify-between"
                                      >
                                        <div className="truncate mr-2">
                                          <Link
                                            href={ROUTES.PRODUCT_DETAIL(p.productId)}
                                            className="font-medium hover:underline text-foreground block truncate"
                                          >
                                            {p.productName}
                                          </Link>
                                          <span className="text-[10px] text-muted-foreground font-mono">
                                            {p.sku}
                                          </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-semibold tabular-nums block">
                                            {p.onHandQty} on hand
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {p.freeQty} free
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── Inventory Tab ──────────────────────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="glass-card rounded-xl p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or location…"
                className="h-8 pl-8 text-xs bg-transparent"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider pl-5">
                    Product
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">
                    SKU
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">
                    Location
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">
                    On Hand
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">
                    Reserved
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right pr-5">
                    Free to Use
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-xs text-muted-foreground"
                    >
                      {productSearch
                        ? "No products match your filter criteria in this warehouse."
                        : "No inventory balances recorded in this warehouse yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20">
                      <TableCell className="pl-5 py-3 font-medium text-xs">
                        <Link
                          href={ROUTES.PRODUCT_DETAIL(item.productId)}
                          className="hover:underline text-foreground"
                        >
                          {item.productName}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="py-3 text-xs">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {item.locationName}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right font-medium tabular-nums text-xs">
                        {item.onHandQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-xs text-amber-500">
                        {item.reservedQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-5 font-semibold tabular-nums text-xs text-emerald-500">
                        {item.freeQty.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
