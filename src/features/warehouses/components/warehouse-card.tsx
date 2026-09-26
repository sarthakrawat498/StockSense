"use client";

import Link from "next/link";
import { useState, Fragment } from "react";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Loader2,
  Package,
  Layers,
  ExternalLink,
  ChevronRight,
  Boxes,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import type { Warehouse } from "@/modules/warehouse";
import { useWarehouseLocations } from "../hooks/use-warehouse-locations";
import { useStock } from "@/features/stock/hooks/use-stock";
import { AddLocationDialog } from "./add-location-dialog";

interface WarehouseCardProps {
  warehouse: Warehouse;
  isOpen: boolean;
  onToggle: () => void;
}

export function WarehouseCard({
  warehouse,
  isOpen,
  onToggle,
}: Readonly<WarehouseCardProps>) {
  // Fetch real-time stock balances across this warehouse
  const { data: stockData, isLoading: stockLoading } = useStock({
    warehouseId: warehouse.id,
    pageSize: 100,
  });

  const {
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsError,
    refetch: refetchLocations,
  } = useWarehouseLocations(warehouse.id);

  const stockItems = stockData?.items ?? [];
  const uniqueProductsCount = new Set(stockItems.map((item) => item.productId)).size;
  const totalOnHand = stockItems.reduce((acc, item) => acc + item.onHandQty, 0);

  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border/60 transition-all hover:border-border">
      {/* Header Row */}
      <div
        role="button"
        tabIndex={0}
        className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-5 md:py-4 cursor-pointer hover:bg-muted/20 dark:hover:bg-white/[0.02] transition-colors gap-3"
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onToggle();
        }}
      >
        {/* Left: Icon & Details */}
        <div className="flex items-center gap-3.5">
          <div className="rounded-lg bg-violet-500/10 p-2.5 shrink-0">
            <WarehouseIcon className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{warehouse.name}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                {warehouse.code}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 inline shrink-0" />
              {warehouse.address ?? "No address specified"}
            </p>
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6 text-right">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Locations
            </p>
            <p className="text-sm font-semibold">
              {warehouse.locationCount ?? locations.length ?? 0}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Products
            </p>
            <p className="text-sm font-semibold">
              {stockLoading ? (
                <span className="text-muted-foreground animate-pulse">…</span>
              ) : (
                uniqueProductsCount
              )}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Total On Hand
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {stockLoading ? (
                <span className="text-muted-foreground animate-pulse">…</span>
              ) : (
                totalOnHand.toLocaleString()
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 pl-2">
            <Link
              href={ROUTES.WAREHOUSE_DETAIL(warehouse.id)}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="View Warehouse Details"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>

            <div
              className={`text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Locations View */}
      {isOpen && (
        <div className="border-t border-border/50 bg-muted/10 dark:bg-black/10">
          <div className="px-5 py-3 flex items-center justify-between bg-muted/20 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Locations & Stored Inventory ({locations.length})
            </div>
            <AddLocationDialog
              warehouseId={warehouse.id}
              warehouseName={warehouse.name}
              onSuccess={() => refetchLocations()}
            />
          </div>

          {locationsLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading locations and stock…
            </div>
          )}

          {locationsError && (
            <div className="flex items-center justify-between px-5 py-8 text-xs text-destructive">
              <span>Unable to load warehouse locations.</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => refetchLocations()}
              >
                Retry
              </Button>
            </div>
          )}

          {!locationsLoading && !locationsError && locations.length === 0 && (
            <div className="px-5 py-8 text-center">
              <Boxes className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No storage locations defined in this warehouse yet.
              </p>
              <div className="mt-3">
                <AddLocationDialog
                  warehouseId={warehouse.id}
                  warehouseName={warehouse.name}
                  onSuccess={() => refetchLocations()}
                  trigger={
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Create First Location
                    </Button>
                  }
                />
              </div>
            </div>
          )}

          {!locationsLoading && !locationsError && locations.length > 0 && (
            <div className="divide-y divide-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider py-2 pl-5">
                      Location
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider py-2">
                      Code
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider py-2">
                      Stored Products
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider py-2 text-right pr-5">
                      On Hand / Free
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => {
                    const locProducts = stockItems.filter(
                      (item) => item.locationId === location.id
                    );
                    const locOnHand = locProducts.reduce(
                      (acc, item) => acc + item.onHandQty,
                      0
                    );
                    const locFree = locProducts.reduce(
                      (acc, item) => acc + item.freeQty,
                      0
                    );
                    const isLocExpanded = expandedLocationId === location.id;

                    return (
                      <Fragment key={location.id}>
                        <TableRow
                          className="dark:hover:bg-white/[0.02] hover:bg-muted/20 border-border/40 cursor-pointer"
                          onClick={() =>
                            setExpandedLocationId(isLocExpanded ? null : location.id)
                          }
                        >
                          <TableCell className="py-2.5 pl-5 font-medium text-xs flex items-center gap-2">
                            <span
                              className={`text-muted-foreground transition-transform text-[10px] ${
                                isLocExpanded ? "rotate-90" : ""
                              }`}
                            >
                              ›
                            </span>
                            {location.name}
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">
                            {location.code}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground">
                            {locProducts.length === 0 ? (
                              <span className="text-muted-foreground/60 italic">
                                Empty location
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 font-medium text-foreground">
                                <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                                {locProducts.length} product
                                {locProducts.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-right pr-5 tabular-nums font-medium">
                            {locOnHand.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({locFree.toLocaleString()} free)
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expand Location to show products */}
                        {isLocExpanded && (
                          <TableRow className="bg-muted/30 dark:bg-white/[0.01] hover:bg-muted/30 border-border/40">
                            <TableCell colSpan={4} className="py-3 px-8">
                              {locProducts.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground italic">
                                  No product balances recorded at this location yet. Receive
                                  goods or transfer stock here.
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                    Inventory at {location.name}:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {locProducts.map((p) => (
                                      <div
                                        key={p.id}
                                        className="p-2 rounded-md bg-background/80 border border-border/60 text-xs flex items-center justify-between"
                                      >
                                        <div className="truncate mr-2">
                                          <Link
                                            href={ROUTES.PRODUCT_DETAIL(p.productId)}
                                            className="font-medium hover:underline text-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {p.productName}
                                          </Link>
                                          <p className="text-[10px] text-muted-foreground font-mono">
                                            {p.sku}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-semibold tabular-nums">
                                            {p.onHandQty}
                                          </span>
                                          {p.reservedQty > 0 && (
                                            <span className="text-[10px] text-amber-500 block">
                                              {p.reservedQty} res.
                                            </span>
                                          )}
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
        </div>
      )}
    </div>
  );
}
