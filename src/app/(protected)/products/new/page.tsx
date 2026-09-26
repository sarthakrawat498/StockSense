"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants/routes";

// ─── Mock options ─────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = ["Raw Materials", "Hardware", "Electrical", "Packaging", "Tools"];
const MOCK_UOM = ["KG", "PCS", "M", "L", "BOX", "SET", "ROLL"];
const MOCK_LOCATIONS = [
  { id: "loc-1", label: "Main Warehouse — Shelf A-1" },
  { id: "loc-2", label: "Main Warehouse — Rack B-3" },
  { id: "loc-3", label: "Warehouse B — Main Store" },
  { id: "loc-4", label: "Main Warehouse — Production Floor" },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:           z.string().min(1, "Product name is required"),
  sku:            z.string().min(1, "SKU is required").toUpperCase(),
  categoryId:     z.string().optional(),
  uom:            z.string().min(1, "Unit of measure is required"),
  unitCost:       z.coerce.number().min(0, "Must be ≥ 0"),
  initialStock:   z.coerce.number().min(0).optional(),
  initialLocationId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", sku: "", categoryId: "", uom: "", unitCost: 0,
      initialStock: undefined, initialLocationId: "",
    },
  });

  const initialStock = form.watch("initialStock");

  function onSubmit(values: FormValues) {
    // TODO: call products API
    console.warn("New product", values);
  }

  return (
    <div className="space-y-5 max-w-[700px]">

      {/* Header */}
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
          <h2 className="text-base font-semibold tracking-tight">New Product</h2>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Product details */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Product Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-xs font-medium">Product Name</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-xs" placeholder="e.g. Steel Rod 12mm" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">SKU / Code</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-xs font-mono uppercase" placeholder="e.g. STL-ROD-12"
                      {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOCK_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="uom" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Unit of Measure</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select UoM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOCK_UOM.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="unitCost" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Unit Cost (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.01} className="h-9 text-xs" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

            </div>
          </div>

          {/* Initial stock */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Stock
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Optional — creates an opening stock entry via an Adjustment operation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <FormField control={form.control} name="initialStock" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} className="h-9 text-xs" placeholder="0" {...field}
                      value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {(initialStock ?? 0) > 0 && (
                <FormField control={form.control} name="initialLocationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_LOCATIONS.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              )}

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={ROUTES.PRODUCTS}>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">Cancel</Button>
            </Link>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={form.formState.isSubmitting}>
              Create Product
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
