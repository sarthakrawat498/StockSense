"use client";

import { AlertTriangle, ArrowRightLeft, FileText, Package, PackageMinus, PackagePlus, TrendingUp } from "lucide-react";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useLowStockAlerts } from "@/features/dashboard/hooks/use-low-stock-alerts";
import { Separator } from "@/components/ui/separator";

const KPI_DEFINITIONS = [
	{ label: "Total Products", sub: "across all categories", icon: Package, accent: "bg-blue-500/10", iconColor: "text-blue-500" },
	{ label: "Pending Receipts", sub: "awaiting validation", icon: PackagePlus, accent: "bg-emerald-500/10", iconColor: "text-emerald-500" },
	{ label: "Pending Deliveries", sub: "ready to dispatch", icon: PackageMinus, accent: "bg-orange-500/10", iconColor: "text-orange-500" },
	{ label: "Low Stock Items", sub: "below threshold", icon: AlertTriangle, accent: "bg-amber-500/10", iconColor: "text-amber-500" },
	{ label: "Transfers Scheduled", sub: "internal movements", icon: ArrowRightLeft, accent: "bg-violet-500/10", iconColor: "text-violet-500" },
] as const;

function KpiCard({ label, value, sub, icon: Icon, accent, iconColor }: Readonly<{ label: string; value: string | number; sub: string; icon: React.ElementType; accent: string; iconColor: string }>) {
	return <div className="glass-card rounded-xl p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p></div><div className={`rounded-lg p-2.5 ${accent}`}><Icon className={`h-4 w-4 ${iconColor}`} /></div></div></div>;
}

function OperationCard({ title, icon: Icon, iconColor, value, label }: Readonly<{ title: string; icon: React.ElementType; iconColor: string; value: string | number; label: string }>) {
	return <div className="glass-card rounded-xl p-5"><div className="mb-5 flex items-center gap-2.5"><Icon className={`h-4 w-4 ${iconColor}`} /><span className="text-sm font-semibold">{title}</span></div><div className="mb-5"><span className="text-4xl font-bold tracking-tight">{value}</span><span className="ml-2 text-sm text-muted-foreground">{label}</span></div><Separator className="dark:opacity-20" /></div>;
}

export default function DashboardPage() {
	const { data, isLoading, isError, refetch } = useDashboard();
	const { data: alerts = [], isLoading: alertsLoading, isError: alertsError, refetch: refetchAlerts } = useLowStockAlerts();
	const kpis = data;
	const values: Record<string, number | string> = {
		"Total Products": kpis?.totalProductsInStock ?? "—",
		"Pending Receipts": kpis?.pendingReceipts ?? "—",
		"Pending Deliveries": kpis?.pendingDeliveries ?? "—",
		"Low Stock Items": kpis?.lowStockItems ?? "—",
		"Transfers Scheduled": kpis?.scheduledTransfers ?? "—",
	};

	return <div className="max-w-[1200px] space-y-7">
		<div className="glass-card flex items-center justify-between rounded-xl px-6 py-5"><div><h2 className="text-lg font-semibold tracking-tight">Welcome back</h2><p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s a snapshot of your inventory operations today.</p></div><div className="hidden items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2 sm:flex"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-primary">Live</span></div></div>
		<section><p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Overview</p><div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">{KPI_DEFINITIONS.map((definition) => <KpiCard key={definition.label} {...definition} value={isLoading ? "—" : values[definition.label]} />)}</div>{isError && <div className="mt-3 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"><span>Dashboard data is unavailable.</span><button type="button" className="font-semibold underline" onClick={() => refetch()}>Retry</button></div>}</section>
		<section><p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Operations</p><div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"><OperationCard title="Receipts" icon={PackagePlus} iconColor="text-emerald-500" value={kpis?.pendingReceipts ?? "—"} label="pending" /><OperationCard title="Deliveries" icon={PackageMinus} iconColor="text-orange-500" value={kpis?.pendingDeliveries ?? "—"} label="pending" /><OperationCard title="Transfers" icon={ArrowRightLeft} iconColor="text-violet-500" value={kpis?.scheduledTransfers ?? "—"} label="scheduled" /></div></section>
		<section><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Low Stock Alerts</p><span className="text-xs text-muted-foreground">{alerts.length} item{alerts.length === 1 ? "" : "s"}</span></div><div className="glass-card rounded-xl overflow-hidden">{alertsLoading ? <div className="p-5 text-sm text-muted-foreground">Loading stock alerts…</div> : alertsError ? <div className="flex items-center justify-between p-5 text-sm text-destructive"><span>Unable to load stock alerts.</span><button type="button" className="font-semibold underline" onClick={() => refetchAlerts()}>Retry</button></div> : alerts.length === 0 ? <div className="p-5 text-sm text-muted-foreground">No low-stock products.</div> : <div className="divide-y">{alerts.map((alert) => <div key={alert.productId} className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-medium">{alert.productName}</p><p className="text-xs text-muted-foreground">{alert.sku} · threshold {alert.effectiveThreshold}</p></div><div className="text-right"><p className={`text-sm font-semibold ${alert.isOutOfStock ? "text-destructive" : "text-amber-500"}`}>{alert.currentStock} remaining</p><p className="text-xs text-muted-foreground">Suggested refill: {alert.suggestedQuantity}</p></div></div>)}</div>}</div></section>
		<section><p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent Operations</p><div className="glass-card flex flex-col items-center justify-center rounded-xl py-16 text-muted-foreground"><FileText className="mb-4 h-6 w-6 opacity-40" /><p className="text-sm font-medium">No operations yet</p><p className="mt-1 text-xs">Create a receipt or delivery order to get started</p></div></section>
	</div>;
}
