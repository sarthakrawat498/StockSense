"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { OPERATION_CONFIG } from "./operation-config";
import { operationsApi, type OperationDetail } from "../services/operations-api";
import type { OperationType, OperationStatus } from "@/types/common.types";

// ─── Status flow ──────────────────────────────────────────────────────────────

const STATUS_FLOW: OperationStatus[] = ["DRAFT", "WAITING", "READY", "DONE"];

function StatusTimeline({ current }: { current: OperationStatus }) {
  if (current === "CANCELED") {
    return (
      <div className="flex items-center gap-2 text-destructive text-xs font-medium">
        <XCircle className="h-4 w-4" />
        This operation was canceled
      </div>
    );
  }
  const currentIdx = STATUS_FLOW.indexOf(current);
  return (
    <div className="flex items-center gap-2">
      {STATUS_FLOW.map((step, idx) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1
            ${
              idx <= currentIdx
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {idx <= currentIdx && <CheckCircle2 className="h-3 w-3" />}
            {step.charAt(0) + step.slice(1).toLowerCase()}
          </div>
          {idx < STATUS_FLOW.length - 1 && (
            <div className={`h-px w-6 ${idx < currentIdx ? "bg-emerald-500/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? "—"}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OperationDetailPageProps {
  type: OperationType;
  id: string;
}

export function OperationDetailPage({ type, id }: OperationDetailPageProps) {
  const config = OPERATION_CONFIG[type];
  const Icon = config.icon;

  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadOperation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await operationsApi.getById(type, id);
      setOperation(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load operation details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    loadOperation();
  }, [loadOperation]);

  async function handleValidate() {
    setActionLoading(true);
    try {
      const updated = await operationsApi.confirm(type, id);
      setOperation(updated);
      toast.success(`${config.singular} validated successfully! Stock balance updated.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Validation failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const updated = await operationsApi.cancel(type, id);
      setOperation(updated);
      toast.success(`${config.singular} canceled.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Loading {config.singular.toLowerCase()} details…</p>
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="space-y-4 max-w-[800px] mx-auto py-12">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">{config.singular} Not Found</p>
              <p className="text-xs opacity-90">{error || "Could not find the requested operation."}</p>
            </div>
          </div>
          <Link href={`/operations/${config.route}`}>
            <Button variant="outline" size="sm" className="text-xs">
              Back to {config.title}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = operation.status === "DONE" || operation.status === "CANCELED";
  const canValidate = !isClosed;
  const canCancel = !isClosed;
  const isAdjustment = type === "ADJUSTMENT";

  const warehouseName = operation.warehouse?.name || "—";
  const fromLocationName = operation.fromLocation?.name || null;
  const toLocationName = operation.toLocation?.name || null;
  const responsibleName = operation.responsibleUser?.username || "—";

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/operations/${config.route}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className={`rounded-lg p-1.5 ${config.accent}`}>
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{operation.reference}</span>
                <StatusBadge status={operation.status} />
              </div>
              <p className="text-[11px] text-muted-foreground">{config.singular}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Cancel
            </Button>
          )}
          {canValidate && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleValidate}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Validate / Confirm
            </Button>
          )}
          {operation.status === "DONE" && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Validated {operation.validatedAt ? new Date(operation.validatedAt).toLocaleDateString() : ""}
            </div>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="glass-card rounded-xl px-5 py-4">
        <StatusTimeline current={operation.status} />
      </div>

      {/* Info grid */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Operation Details
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoRow label="Warehouse" value={warehouseName} />
          {config.hasFromLocation && <InfoRow label="From Location" value={fromLocationName} />}
          {config.hasToLocation && <InfoRow label="To Location" value={toLocationName} />}
          {config.contactLabel && <InfoRow label={config.contactLabel} value={operation.contactName} />}
          <InfoRow
            label="Scheduled Date"
            value={operation.scheduledDate ? new Date(operation.scheduledDate).toLocaleDateString() : "—"}
          />
          <InfoRow label="Responsible" value={responsibleName} />
          <InfoRow label="Created" value={new Date(operation.createdAt).toLocaleDateString()} />
          {operation.address && <InfoRow label="Address" value={operation.address} />}
          {operation.notes && <InfoRow label="Notes" value={operation.notes} />}
        </div>
      </div>

      {/* Line items */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Products — {(operation.items || []).length} item{(operation.items || []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Product</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UoM</TableHead>
              {isAdjustment ? (
                <>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Recorded Qty</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Counted Qty</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Difference</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Demand Qty</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Done Qty</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(operation.items || []).map((item) => {
              const qtyNum = Number(item.quantity);
              const countedNum =
                item.countedQuantity !== null && item.countedQuantity !== undefined
                  ? Number(item.countedQuantity)
                  : null;
              const diff = isAdjustment && countedNum !== null ? countedNum - qtyNum : null;

              return (
                <TableRow key={item.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/30">
                  <TableCell className="py-3 text-sm font-medium">{item.product?.name || "Product"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.product?.sku || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.product?.uom || "—"}</TableCell>
                  {isAdjustment ? (
                    <>
                      <TableCell className="text-right text-sm tabular-nums">{qtyNum}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{countedNum ?? "—"}</TableCell>
                      <TableCell
                        className={`text-right text-sm font-semibold tabular-nums ${
                          diff === null
                            ? ""
                            : diff < 0
                            ? "text-destructive"
                            : diff > 0
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {diff === null ? "—" : diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right text-sm tabular-nums">{qtyNum}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {operation.status === "DONE" ? qtyNum : "—"}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
