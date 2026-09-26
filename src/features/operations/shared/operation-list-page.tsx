"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";

import { AppShell } from "@/components/layouts/app-shell";
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
import { MOCK_OPERATIONS } from "./mock-data";
import type { OperationType, OperationStatus } from "@/types/common.types";

interface OperationListPageProps {
  type: OperationType;
}

export function OperationListPage({ type }: OperationListPageProps) {
  const config = OPERATION_CONFIG[type];
  const Icon = config.icon;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const operations = MOCK_OPERATIONS.filter((op) => op.operationType === type);

  const filtered = operations.filter((op) => {
    const matchesSearch =
      !search ||
      op.reference.toLowerCase().includes(search.toLowerCase()) ||
      op.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      op.warehouseName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || op.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell pageTitle={config.title}>
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
                {operations.length} operation{operations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link href={`/operations/${config.route}/new`}>
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              {config.newLabel}
            </Button>
          </Link>
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

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
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
                {filtered.map((op) => (
                  <TableRow
                    key={op.id}
                    className="cursor-pointer dark:hover:bg-white/[0.025] hover:bg-muted/40 transition-colors"
                    onClick={() => {
                      window.location.href = `/operations/${config.route}/${op.id}`;
                    }}
                  >
                    <TableCell className="py-3 font-mono text-xs font-semibold">{op.reference}</TableCell>
                    {config.contactLabel && (
                      <TableCell className="text-xs text-muted-foreground">{op.contactName ?? "—"}</TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">{op.warehouseName}</TableCell>
                    {config.hasFromLocation && (
                      <TableCell className="text-xs text-muted-foreground">{op.fromLocationName ?? "—"}</TableCell>
                    )}
                    {config.hasToLocation && (
                      <TableCell className="text-xs text-muted-foreground">{op.toLocationName ?? "—"}</TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">
                      {op.scheduleDate ?? "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={op.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{op.items.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{op.responsibleUsername}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

      </div>
    </AppShell>
  );
}
