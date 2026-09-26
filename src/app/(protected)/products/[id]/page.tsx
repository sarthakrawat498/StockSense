import Link from "next/link";
import { ArrowLeft, Package, Edit, MapPin, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Record<string, {
  id: string; name: string; sku: string; category: string;
  uom: string; unitCost: number; createdAt: string;
  stockLevels: { location: string; warehouse: string; onHand: number; reserved: number }[];
}> = {
  "p-1": {
    id: "p-1", name: "Steel Rod 12mm", sku: "STL-ROD-12",
    category: "Raw Materials", uom: "KG", unitCost: 85.00,
    createdAt: "2026-09-01",
    stockLevels: [
      { location: "Shelf A-1",      warehouse: "Main Warehouse", onHand: 400, reserved: 200 },
      { location: "Production Floor", warehouse: "Main Warehouse", onHand: 77,  reserved: 0   },
    ],
  },
  "p-2": {
    id: "p-2", name: "Steel Plate 6mm", sku: "STL-PLT-06",
    category: "Raw Materials", uom: "KG", unitCost: 120.00,
    createdAt: "2026-09-01",
    stockLevels: [
      { location: "Rack B-3", warehouse: "Main Warehouse", onHand: 120, reserved: 0  },
      { location: "Rack C-1", warehouse: "Warehouse B",    onHand: 80,  reserved: 0  },
    ],
  },
  "p-4": {
    id: "p-4", name: "Aluminium Sheet", sku: "ALU-SHT-01",
    category: "Raw Materials", uom: "PCS", unitCost: 350.00,
    createdAt: "2026-09-05",
    stockLevels: [
      { location: "Rack B-3", warehouse: "Main Warehouse", onHand: 30, reserved: 20 },
    ],
  },
  "p-6": {
    id: "p-6", name: "Nut M8", sku: "NUT-M8-001",
    category: "Hardware", uom: "PCS", unitCost: 1.80,
    createdAt: "2026-09-10",
    stockLevels: [],
  },
};

function getProduct(id: string) {
  return MOCK_PRODUCTS[id] ?? MOCK_PRODUCTS["p-1"];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id);
  const totalOnHand   = product.stockLevels.reduce((s, l) => s + l.onHand, 0);
  const totalReserved = product.stockLevels.reduce((s, l) => s + l.reserved, 0);
  const freeToUse     = totalOnHand - totalReserved;
  const isLowStock    = totalOnHand > 0 && totalOnHand < 50;
  const isOutOfStock  = totalOnHand === 0;

  return (
    <div className="space-y-5 max-w-[1000px]">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.PRODUCTS}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg p-1.5 bg-blue-500/10">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{product.name}</span>
                {isOutOfStock && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 rounded-sm">Out of stock</Badge>}
                {isLowStock && !isOutOfStock && (
                  <Badge className="text-[10px] h-5 px-1.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 hover:bg-amber-500/10">Low stock</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">{product.sku}</p>
            </div>
          </div>
        </div>
        <Link href={ROUTES.PRODUCT_EDIT(product.id)}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Product info */}
      <div className="glass-card rounded-xl p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Product Details
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <InfoRow label="Name"       value={product.name} />
          <InfoRow label="SKU"        value={product.sku} />
          <InfoRow label="Category"   value={product.category} />
          <InfoRow label="Unit of Measure" value={product.uom} />
          <InfoRow label="Unit Cost"  value={`₹${product.unitCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <InfoRow label="Created"    value={product.createdAt} />
        </div>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total On Hand",  value: `${totalOnHand} ${product.uom}`,   color: isOutOfStock ? "text-destructive" : isLowStock ? "text-amber-500" : "" },
          { label: "Reserved",       value: `${totalReserved} ${product.uom}`, color: "" },
          { label: "Free to Use",    value: `${freeToUse} ${product.uom}`,     color: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-1.5 text-xl font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stock levels per location */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Stock by Location
          </p>
        </div>

        {product.stockLevels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="mb-3 h-6 w-6 opacity-30 text-amber-500" />
            <p className="text-sm font-medium">No stock on hand</p>
            <p className="text-xs mt-1 opacity-70">Create a receipt to add stock for this product</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Warehouse</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Location</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">On Hand</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Reserved</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Free to Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stockLevels.map((level, idx) => (
                <TableRow key={idx} className="dark:hover:bg-white/[0.02]">
                  <TableCell className="text-sm font-medium py-3">{level.warehouse}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{level.location}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">{level.onHand} {product.uom}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{level.reserved} {product.uom}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {level.onHand - level.reserved} {product.uom}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
}
