"use client";

import { use } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants/routes";

const MOCK_CATEGORIES = ["Raw Materials", "Hardware", "Electrical", "Packaging", "Tools"];
const MOCK_UOM = ["KG", "PCS", "M", "L", "BOX", "SET", "ROLL"];

// Prefill with mock data based on id
const MOCK_PREFILL: Record<string, { name: string; sku: string; category: string; uom: string; unitCost: number }> = {
  "p-1": { name: "Steel Rod 12mm", sku: "STL-ROD-12", category: "Raw Materials", uom: "KG", unitCost: 85 },
  "p-2": { name: "Steel Plate 6mm", sku: "STL-PLT-06", category: "Raw Materials", uom: "KG", unitCost: 120 },
};

const schema = z.object({
  name:      z.string().min(1, "Required"),
  sku:       z.string().min(1, "Required"),
  categoryId:z.string().optional(),
  uom:       z.string().min(1, "Required"),
  unitCost:  z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const prefill = MOCK_PREFILL[id] ?? MOCK_PREFILL["p-1"];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prefill.name, sku: prefill.sku,
      categoryId: prefill.category, uom: prefill.uom, unitCost: prefill.unitCost,
    },
  });

  function onSubmit(values: FormValues) {
    // TODO: call products API
    console.warn("Edit product", id, values);
  }

  return (
    <div className="space-y-5 max-w-[700px]">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.PRODUCT_DETAIL(id)}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-1.5 bg-blue-500/10">
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">Edit Product</h2>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-xs font-medium">Product Name</FormLabel>
                  <FormControl><Input className="h-9 text-xs" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">SKU</FormLabel>
                  <FormControl><Input className="h-9 text-xs font-mono uppercase" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="uom" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Unit of Measure</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MOCK_UOM.map((u) => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="unitCost" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Unit Cost (₹)</FormLabel>
                  <FormControl><Input type="number" min={0} step={0.01} className="h-9 text-xs" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link href={ROUTES.PRODUCT_DETAIL(id)}>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">Cancel</Button>
            </Link>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={form.formState.isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
