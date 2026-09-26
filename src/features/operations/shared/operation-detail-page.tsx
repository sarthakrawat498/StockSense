"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { AppShell } from "@/components/layouts/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { MOCK_OPERATIONS } from "./mock-data";
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
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1
            ${idx < currentIdx ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : idx === currentIdx ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"}`}
          >
            {idx < currentIdx && <CheckCircle2 className="h-3 w-3" />}
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

  const operation = MOCK_OPERATIONS.find((op) => op.id === id && op.operationType === type)
    ?? MOCK_OPERATIONS.find((op) => op.operationType === type);

  if (!operation) {
    return (
      <AppShell pageTitle={config.singular}>
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Operation not found.
        </div>
      </AppShell>
    );
  }

  const canValidate = operation.status === "READY";
  const canMarkReady = operation.status === "WAITING";
  const canCancel = operation.status === "DRAFT" || operation.status === "WAITING";
  const isAdjustment = type === "ADJUSTMENT";

  return (
    <AppShell pageTitle={operation.reference}>
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
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
            {canMarkReady && (
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Mark as Ready
              </Button>
            )}
            {canValidate && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Validate
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
            <InfoRow label="Warehouse" value={operation.warehouseName} />
            {config.hasFromLocation && (
              <InfoRow label="From Location" value={operation.fromLocationName} />
            )}
            {config.hasToLocation && (
              <InfoRow label="To Location" value={operation.toLocationName} />
            )}
            {config.contactLabel && (
              <InfoRow label={config.contactLabel} value={operation.contactName} />
            )}
            <InfoRow label="Scheduled Date" value={operation.scheduleDate} />
            <InfoRow label="Responsible" value={operation.responsibleUsername} />
            <InfoRow label="Created" value={new Date(operation.createdAt).toLocaleDateString()} />
            {operation.notes && <InfoRow label="Notes" value={operation.notes} />}
          </div>
        </div>

        {/* Line items */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Products — {operation.items.length} item{operation.items.length !== 1 ? "s" : ""}
            </p>
            {(operation.status === "DRAFT" || operation.status === "WAITING") && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
                + Add Product
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Product</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">SKU</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UoM</TableHead>
                {isAdjustment && (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Location</TableHead>
                )}
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
              {operation.items.map((item) => {
                const diff = isAdjustment && item.countedQuantity !== null
                  ? item.countedQuantity - item.quantity
                  : null;
                return (
                  <TableRow key={item.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/30">
                    <TableCell className="py-3 text-sm font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.productSku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.productUom}</TableCell>
                    {isAdjustment && (
                      <TableCell className="text-xs text-muted-foreground">{item.locationName ?? "—"}</TableCell>
                    )}
                    {isAdjustment ? (
                      <>
                        <TableCell className="text-right text-sm tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {item.countedQuantity ?? "—"}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-semibold tabular-nums
                          ${diff === null ? "" : diff < 0 ? "text-destructive" : diff > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {diff === null ? "—" : diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-sm tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {operation.status === "DONE" ? item.quantity : "—"}
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
    </AppShell>
  );
}
