import {
  Package,
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;   // tailwind color class for the icon bg
  iconColor: string;
}

interface OperationCardProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  toAction: number;
  actionLabel: string;
  stats: { label: string; value: number; variant: "default" | "destructive" | "secondary" | "outline" }[];
}

interface RecentOperation {
  reference: string;
  type: string;
  warehouse: string;
  status: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";
  scheduledDate: string;
  responsible: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const KPI_DATA: KpiCardProps[] = [
  {
    label: "Total Products",
    value: "—",
    sub: "across all categories",
    icon: Package,
    accent: "bg-blue-500/10 dark:bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    label: "Pending Receipts",
    value: "—",
    sub: "awaiting validation",
    icon: PackagePlus,
    accent: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    label: "Pending Deliveries",
    value: "—",
    sub: "ready to dispatch",
    icon: PackageMinus,
    accent: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  {
    label: "Low Stock Items",
    value: "—",
    sub: "below threshold",
    icon: AlertTriangle,
    accent: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    label: "Transfers Scheduled",
    value: "—",
    sub: "internal movements",
    icon: ArrowRightLeft,
    accent: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
];

const OPERATION_CARDS: OperationCardProps[] = [
  {
    title: "Receipts",
    icon: PackagePlus,
    iconColor: "text-emerald-500",
    toAction: 0,
    actionLabel: "to receive",
    stats: [
      { label: "Ready",   value: 0, variant: "default" },
      { label: "Waiting", value: 0, variant: "secondary" },
      { label: "Late",    value: 0, variant: "destructive" },
    ],
  },
  {
    title: "Deliveries",
    icon: PackageMinus,
    iconColor: "text-orange-500",
    toAction: 0,
    actionLabel: "to deliver",
    stats: [
      { label: "Ready",   value: 0, variant: "default" },
      { label: "Waiting", value: 0, variant: "secondary" },
      { label: "Late",    value: 0, variant: "destructive" },
    ],
  },
  {
    title: "Transfers",
    icon: ArrowRightLeft,
    iconColor: "text-violet-500",
    toAction: 0,
    actionLabel: "to validate",
    stats: [
      { label: "Ready",   value: 0, variant: "default" },
      { label: "Waiting", value: 0, variant: "secondary" },
    ],
  },
];

const RECENT_OPERATIONS: RecentOperation[] = [];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RecentOperation["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  DRAFT:    { label: "Draft",    icon: FileText,     className: "text-muted-foreground" },
  WAITING:  { label: "Waiting",  icon: Clock,        className: "text-amber-500" },
  READY:    { label: "Ready",    icon: Loader2,      className: "text-blue-500" },
  DONE:     { label: "Done",     icon: CheckCircle2, className: "text-emerald-500" },
  CANCELED: { label: "Canceled", icon: XCircle,      className: "text-destructive" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent, iconColor }: KpiCardProps) {
  return (
    <div className="glass-card rounded-xl p-5">      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {sub && (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{sub}</p>
          )}
        </div>
        <div className={`flex-shrink-0 rounded-lg p-2.5 ${accent}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function OperationCard({ title, icon: Icon, iconColor, toAction, actionLabel, stats }: OperationCardProps) {
  return (
    <div className="glass-card rounded-xl p-5">      <div className="flex items-center gap-2.5 mb-5">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-sm font-semibold">{title}</span>
      </div>

      <div className="mb-5">
        <span className="text-4xl font-bold tracking-tight">{toAction}</span>
        <span className="ml-2 text-sm text-muted-foreground">{actionLabel}</span>
      </div>

      <Separator className="mb-4 dark:opacity-20" />

      <div className="flex items-center gap-3 flex-wrap">
        {stats.map(({ label, value, variant }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Badge
              variant={variant}
              className="h-5 rounded-sm text-[10px] px-1.5 font-semibold"
            >
              {value}
            </Badge>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: RecentOperation["status"] }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-7 max-w-[1200px]">

        {/* Welcome banner */}
        <div className="glass-card rounded-xl px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Here&apos;s a snapshot of your inventory operations today.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Live</span>
          </div>
        </div>

        {/* KPI row */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
            {KPI_DATA.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </section>

        {/* Operations overview */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Operations
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {OPERATION_CARDS.map((card) => (
              <OperationCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        {/* Recent operations */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Operations
          </p>
          <div className="glass-card rounded-xl overflow-hidden">
            {RECENT_OPERATIONS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="mb-4 rounded-xl bg-muted/50 p-4">
                  <FileText className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">No operations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a receipt or delivery order to get started
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 dark:bg-white/[0.02]">
                    {["Reference", "Type", "Warehouse", "Status", "Scheduled", "Responsible"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_OPERATIONS.map((op) => (
                    <tr
                      key={op.reference}
                      className="border-b last:border-0 transition-colors hover:bg-muted/20 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{op.reference}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{op.type.toLowerCase()}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{op.warehouse}</td>
                      <td className="px-4 py-3"><StatusCell status={op.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{op.scheduledDate}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{op.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
  );
}
