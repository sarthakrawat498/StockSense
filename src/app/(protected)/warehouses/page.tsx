"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Warehouse, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { useWarehouseLocations } from "@/features/warehouses/hooks/use-warehouse-locations";

function LocationsTable({ warehouseId, warehouseName }: Readonly<{ warehouseId: string; warehouseName: string }>) {
	const { data: locations = [], isLoading, isError, refetch } = useWarehouseLocations(warehouseId);
	if (isLoading) return <div className="flex items-center gap-2 px-5 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading locations…</div>;
	if (isError) return <div className="flex items-center justify-between px-5 py-8 text-xs text-destructive"><span>Unable to load locations.</span><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>;
	return <div className="border-t"><div className="px-5 py-3 flex items-center justify-between bg-muted/20 dark:bg-white/[0.02]"><div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" />Locations in {warehouseName}</div><Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary px-2"><Plus className="h-3 w-3" />Add Location</Button></div>{locations.length === 0 ? <p className="px-5 py-8 text-xs text-muted-foreground">No locations found.</p> : <Table><TableHeader><TableRow className="hover:bg-transparent dark:hover:bg-transparent"><TableHead className="text-[11px] font-semibold uppercase tracking-wider py-2.5 pl-5">Location</TableHead><TableHead className="text-[11px] font-semibold uppercase tracking-wider">Code</TableHead></TableRow></TableHeader><TableBody>{locations.map((location) => <TableRow key={location.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/20"><TableCell className="py-2.5 pl-5 text-sm">{location.name}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{location.code}</TableCell></TableRow>)}</TableBody></Table>}</div>;
}

export default function WarehousesPage() {
	const [search, setSearch] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const { data: warehouses = [], isLoading, isError, refetch } = useWarehouses();
	const filtered = warehouses.filter((warehouse) => !search || warehouse.name.toLowerCase().includes(search.toLowerCase()) || warehouse.code.toLowerCase().includes(search.toLowerCase()));

	return <div className="space-y-5 max-w-[1100px]">
		<div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-lg p-2 bg-violet-500/10"><Warehouse className="h-5 w-5 text-violet-500" /></div><div><h2 className="text-lg font-semibold tracking-tight">Warehouses</h2><p className="text-xs text-muted-foreground">{isLoading ? "Loading…" : `${warehouses.length} warehouses`}</p></div></div><Link href={ROUTES.WAREHOUSES_NEW}><Button size="sm" className="gap-1.5 h-8 text-xs font-medium"><Plus className="h-3.5 w-3.5" />New Warehouse</Button></Link></div>
		<div className="glass-card rounded-xl p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search warehouses…" className="h-8 pl-8 text-xs bg-transparent" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
		{isLoading && <div className="glass-card rounded-xl flex items-center justify-center gap-2 py-16 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading warehouses…</div>}
		{isError && <div className="glass-card rounded-xl flex items-center justify-center gap-3 py-16 text-xs text-destructive"><span>Unable to load warehouses.</span><Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>}
		{!isLoading && !isError && filtered.length === 0 && <div className="glass-card rounded-xl py-16 text-center text-xs text-muted-foreground">No warehouses found.</div>}
		{!isLoading && !isError && filtered.length > 0 && <div className="space-y-4">{filtered.map((warehouse) => { const isOpen = expanded === warehouse.id; return <div key={warehouse.id} className="glass-card rounded-xl overflow-hidden"><div role="button" tabIndex={0} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 dark:hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded(isOpen ? null : warehouse.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setExpanded(isOpen ? null : warehouse.id); }}><div className="flex items-center gap-4"><div className="rounded-lg bg-violet-500/10 p-2"><Warehouse className="h-4 w-4 text-violet-500" /></div><div><div className="flex items-center gap-2"><span className="font-semibold text-sm">{warehouse.name}</span><Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{warehouse.code}</Badge></div><p className="text-xs text-muted-foreground mt-0.5">{warehouse.address ?? "No address provided"}</p></div></div><div className="flex items-center gap-6 text-right"><div><p className="text-xs text-muted-foreground">Locations</p><p className="text-sm font-semibold">{warehouse.locationCount ?? 0}</p></div><div><p className="text-xs text-muted-foreground">Products</p><p className="text-sm font-semibold">—</p></div><div><p className="text-xs text-muted-foreground">Total On Hand</p><p className="text-sm font-semibold tabular-nums">—</p></div><div className={`text-xs text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}>›</div></div></div>{isOpen && <LocationsTable warehouseId={warehouse.id} warehouseName={warehouse.name} />}</div>; })}</div>}
	</div>;
}
