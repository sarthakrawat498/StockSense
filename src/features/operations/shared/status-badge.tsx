import type { OperationStatus } from "@/types/common.types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OperationStatus, { label: string; className: string }> = {
  DRAFT:    { label: "Draft",    className: "bg-zinc-500/10 text-zinc-500 dark:bg-zinc-400/10 dark:text-zinc-400" },
  WAITING:  { label: "Waiting",  className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  READY:    { label: "Ready",    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  DONE:     { label: "Done",     className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  CANCELED: { label: "Canceled", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

interface StatusBadgeProps {
  status: OperationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: styleClass } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        styleClass,
        className
      )}
    >
      {label}
    </span>
  );
}

export const STATUS_OPTIONS: { label: string; value: OperationStatus }[] = [
  { label: "Draft",    value: "DRAFT" },
  { label: "Waiting",  value: "WAITING" },
  { label: "Ready",    value: "READY" },
  { label: "Done",     value: "DONE" },
  { label: "Canceled", value: "CANCELED" },
];
