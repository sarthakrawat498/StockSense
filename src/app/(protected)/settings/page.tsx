"use client";

import { useState } from "react";
import {
  Settings,
  Warehouse,
  Tag,
  Ruler,
  Plus,
  Trash2,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Raw Materials" },
  { id: "cat-2", name: "Hardware" },
  { id: "cat-3", name: "Electrical" },
  { id: "cat-4", name: "Packaging" },
  { id: "cat-5", name: "Tools" },
];

const INITIAL_UOM = [
  { id: "u-1", symbol: "KG",   name: "Kilogram" },
  { id: "u-2", symbol: "PCS",  name: "Pieces" },
  { id: "u-3", symbol: "M",    name: "Metre" },
  { id: "u-4", symbol: "L",    name: "Litre" },
  { id: "u-5", symbol: "BOX",  name: "Box" },
  { id: "u-6", symbol: "SET",  name: "Set" },
  { id: "u-7", symbol: "ROLL", name: "Roll" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  iconClass,
  accent,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  accent: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-3">
        <div className={`rounded-lg p-1.5 ${accent}`}>
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Categories
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");

  // UoM
  const [uomList, setUomList] = useState(INITIAL_UOM);
  const [newUomSymbol, setNewUomSymbol] = useState("");
  const [newUomName, setNewUomName] = useState("");

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: trimmed }]);
    setNewCategory("");
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function addUom() {
    const symbol = newUomSymbol.trim().toUpperCase();
    const name = newUomName.trim();
    if (!symbol || !name) return;
    setUomList((prev) => [...prev, { id: `u-${Date.now()}`, symbol, name }]);
    setNewUomSymbol("");
    setNewUomName("");
  }

  function removeUom(id: string) {
    setUomList((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="space-y-6 max-w-[800px]">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-muted">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <p className="text-xs text-muted-foreground">Manage categories, units of measure and warehouse config</p>
        </div>
      </div>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <Section
        icon={Tag}
        iconClass="text-blue-500"
        accent="bg-blue-500/10"
        title="Product Categories"
        description="Organise products into groups for filtering and reporting"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3 pl-5">Category Name</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} className="dark:hover:bg-white/[0.02] group">
                <TableCell className="py-2.5 pl-5 text-sm">{cat.name}</TableCell>
                <TableCell className="pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => removeCategory(cat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {/* Add row */}
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableCell className="pl-5 py-3" colSpan={2}>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name…"
                    className="h-8 text-xs max-w-[280px] bg-transparent"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={addCategory}
                    disabled={!newCategory.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      {/* ── Units of Measure ───────────────────────────────────────────────── */}
      <Section
        icon={Ruler}
        iconClass="text-emerald-500"
        accent="bg-emerald-500/10"
        title="Units of Measure"
        description="Define the units used across products (KG, PCS, M, etc.)"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3 pl-5">Symbol</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {uomList.map((u) => (
              <TableRow key={u.id} className="dark:hover:bg-white/[0.02] group">
                <TableCell className="py-2.5 pl-5 font-mono text-xs font-semibold">{u.symbol}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.name}</TableCell>
                <TableCell className="pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => removeUom(u.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {/* Add row */}
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableCell className="pl-5 py-3" colSpan={3}>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Symbol (e.g. KG)"
                    className="h-8 text-xs w-28 bg-transparent font-mono uppercase"
                    value={newUomSymbol}
                    onChange={(e) => setNewUomSymbol(e.target.value.toUpperCase())}
                  />
                  <Input
                    placeholder="Full name (e.g. Kilogram)"
                    className="h-8 text-xs max-w-[200px] bg-transparent"
                    value={newUomName}
                    onChange={(e) => setNewUomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUom()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={addUom}
                    disabled={!newUomSymbol.trim() || !newUomName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      {/* ── Warehouse defaults ─────────────────────────────────────────────── */}
      <Section
        icon={Warehouse}
        iconClass="text-violet-500"
        accent="bg-violet-500/10"
        title="Warehouse Configuration"
        description="Default settings applied to new inventory operations"
      >
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium mb-1.5">Default Warehouse</p>
              <Input defaultValue="Main Warehouse" className="h-9 text-xs" />
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Low Stock Threshold (units)</p>
              <Input type="number" defaultValue={10} min={0} className="h-9 text-xs" />
            </div>
          </div>
          <Separator className="dark:opacity-20" />
          <div className="flex justify-end">
            <Button size="sm" className="h-8 text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </Section>

    </div>
  );
}
