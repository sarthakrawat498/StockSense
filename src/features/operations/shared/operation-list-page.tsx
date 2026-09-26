"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, FileText, RefreshCw, Loader2, AlertCircle } from "lucide-react";

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
import { StatusBadge, STATUS_OPTIONS } from "./status-badge";
import { OPERATION_CONFIG } from "./operation-config";
import { operationsApi, type OperationListItem } from "../services/operations-api";
import type { OperationType } from "@/types/common.types";

interface OperationListPageProps {
  type: OperationType;
}

export function OperationListPage({ type }: OperationListPageProps) {
  const router = useRouter();
  const config = OPERATION_CONFIG[type];
  const Icon = config.icon;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [operations, setOperations] = useState<OperationListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOperations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await operationsApi.list(type, {
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        pageSize: 50,
      });
      setOperations(res.items || []);
      setTotalCount(res.total ?? (res.items || []).length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load operations";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [type, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOperations();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadOperations]);

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${config.accent}`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{config.title}</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${totalCount} operation${totalCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => loadOperations()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Link href={`/operations/${config.route}/new`}>
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              {config.newLabel}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by reference, contact, warehouse…"
            className="h-8 pl-8 text-xs bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUS_OPTIONS.map(({ label, value }) => (
              <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadOperations()}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading && operations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
            <p className="text-xs font-medium">Loading {config.title.toLowerCase()}...</p>
          </div>
        ) : operations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="mb-4 rounded-xl bg-muted/50 p-4">
              <FileText className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">
              {search || statusFilter !== "all" ? "No results match your filters" : config.emptyMessage}
            </p>
            {!search && statusFilter === "all" && (
              <Link href={`/operations/${config.route}/new`}>
                <Button variant="link" className="mt-2 h-auto p-0 text-xs text-primary">
                  Create your first {config.singular.toLowerCase()}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent border-b">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Reference</TableHead>
                {config.contactLabel && (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">{config.contactLabel}</TableHead>
                )}
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Warehouse</TableHead>
                {config.hasFromLocation && (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">From</TableHead>
                )}
                {config.hasToLocation && (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">To</TableHead>
                )}
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Scheduled</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Items</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Responsible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => {
                const warehouseName = op.warehouse?.name || "—";
                const fromLocationName = op.fromLocation?.name || "—";
                const toLocationName = op.toLocation?.name || "—";
                const itemCount = op._count?.items ?? op.items?.length ?? 0;
                const responsibleName = op.responsibleUser?.username || "—";
                const formattedDate = op.scheduledDate
                  ? new Date(op.scheduledDate).toLocaleDateString()
                  : "—";

                return (
                  <TableRow
                    key={op.id}
                    className="cursor-pointer dark:hover:bg-white/[0.025] hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      router.push(`/operations/${config.route}/${op.id}`);
                    }}
                  >
                    <TableCell className="py-3 font-mono text-xs font-semibold">{op.reference}</TableCell>
                    {config.contactLabel && (
                      <TableCell className="text-xs text-muted-foreground">{op.contactName ?? "—"}</TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">{warehouseName}</TableCell>
                    {config.hasFromLocation && (
                      <TableCell className="text-xs text-muted-foreground">{fromLocationName}</TableCell>
                    )}
                    {config.hasToLocation && (
                      <TableCell className="text-xs text-muted-foreground">{toLocationName}</TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">{formattedDate}</TableCell>
                    <TableCell><StatusBadge status={op.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{itemCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{responsibleName}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
