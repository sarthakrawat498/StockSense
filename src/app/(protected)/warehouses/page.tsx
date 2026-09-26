"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Warehouse as WarehouseIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { WarehouseCard } from "@/features/warehouses/components/warehouse-card";

export default function WarehousesPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const {
    data: warehouses = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useWarehouses();

  const filtered = warehouses.filter(
    (warehouse) =>
      !search ||
      warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(search.toLowerCase()) ||
      (warehouse.address && warehouse.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2.5 bg-violet-500/10">
            <WarehouseIcon className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Warehouses</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading storage hubs…"
                : `${warehouses.length} warehouse${warehouses.length !== 1 ? "s" : ""} registered`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh warehouses"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link href={ROUTES.WAREHOUSES_NEW}>
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              New Warehouse
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="glass-card rounded-xl p-3 sm:p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by warehouse name, code, or address…"
            className="h-8 pl-8 text-xs bg-transparent"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Fetching warehouses and locations…</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-xs text-destructive">
          <span>Failed to load warehouses. Please check your connection.</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="glass-card rounded-xl py-16 text-center text-xs text-muted-foreground">
          <WarehouseIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-medium text-foreground">No warehouses match your criteria</p>
          <p className="mt-1 text-muted-foreground">
            {search
              ? "Try adjusting your search query."
              : "Get started by adding your first warehouse storage facility."}
          </p>
          {!search && (
            <div className="mt-4">
              <Link href={ROUTES.WAREHOUSES_NEW}>
                <Button size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create First Warehouse
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* List of Warehouses */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3.5">
          {filtered.map((warehouse) => {
            const isOpen = expanded === warehouse.id;
            return (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                isOpen={isOpen}
                onToggle={() => setExpanded(isOpen ? null : warehouse.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
