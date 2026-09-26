"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Edit, MapPin, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useProductStock } from "@/features/products/hooks/use-product-stock";
import { useProduct } from "@/features/products/hooks/use-product";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const { data: selectedProduct, isLoading: productLoading, isError: productError } = useProduct(productId);
  const { data: stock, isLoading: stockLoading } = useProductStock(productId);
  const totalOnHand = stock?.totalOnHand ?? selectedProduct?.totalStock ?? 0;
  const totalReserved = stock?.totalReserved ?? 0;
  const freeToUse = stock?.totalFree ?? totalOnHand - totalReserved;
  const isLowStock = Boolean(selectedProduct?.isLowStock);
  const isOutOfStock  = totalOnHand === 0;

  if (productLoading || stockLoading) return <div className="p-8 text-sm text-muted-foreground">Loading product…</div>;
  if (productError || !selectedProduct) return <div className="p-8 text-sm text-destructive">Product not found.</div>;

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
                <span className="font-semibold text-sm">{selectedProduct.name}</span>
                {isOutOfStock && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 rounded-sm">Out of stock</Badge>}
                {isLowStock && !isOutOfStock && (
                  <Badge className="text-[10px] h-5 px-1.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 hover:bg-amber-500/10">Low stock</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">{selectedProduct.sku}</p>
            </div>
          </div>
        </div>
        <Link href={ROUTES.PRODUCT_EDIT(selectedProduct.id)}>
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
          <InfoRow label="Name"       value={selectedProduct.name} />
          <InfoRow label="SKU"        value={selectedProduct.sku} />
          <InfoRow label="Category"   value={selectedProduct.category?.name ?? "—"} />
          <InfoRow label="Unit of Measure" value={selectedProduct.uom} />
          <InfoRow label="Unit Cost"  value={`₹${Number(selectedProduct.unitCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} />
          <InfoRow label="Created"    value={selectedProduct.createdAt.slice(0, 10)} />
        </div>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total On Hand",  value: `${totalOnHand} ${selectedProduct.uom}`,   color: isOutOfStock ? "text-destructive" : "" },
          { label: "Reserved",       value: `${totalReserved} ${selectedProduct.uom}`, color: "" },
          { label: "Free to Use",    value: `${freeToUse} ${selectedProduct.uom}`,     color: "" },
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

        {!stock?.balances.length ? (
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
              {stock?.balances.map((level) => (
                <TableRow key={level.id} className="dark:hover:bg-white/[0.02]">
                  <TableCell className="text-sm font-medium py-3">{level.warehouseName ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{level.locationName ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">{level.onHandQty} {selectedProduct.uom}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{level.reservedQty} {selectedProduct.uom}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {level.freeQty} {selectedProduct.uom}
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
