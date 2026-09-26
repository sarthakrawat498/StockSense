"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { useWarehouseLocations } from "@/features/warehouses/hooks/use-warehouse-locations";
import { useProductMutations } from "@/features/products/hooks/use-product-mutations";

const UOM_OPTIONS = ["KG", "PCS", "M", "L", "BOX", "SET", "ROLL", "BAG", "PALLET"];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required").toUpperCase(),
  categoryId: z.string().uuid("Please select a valid category"),
  uom: z.string().trim().min(1, "Unit of measure is required"),
  unitCost: z.coerce.number().min(0, "Must be ≥ 0"),
  initialStock: z.coerce.number().min(0).optional(),
  initialLocationId: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.initialStock && val.initialStock > 0 && !val.initialLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["initialLocationId"],
      message: "Please select an initial storage location for the opening stock",
    });
  }
});

type FormValues = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: locations = [], isLoading: locationsLoading } = useWarehouseLocations(
    selectedWarehouseId || null
  );

  const { createProduct } = useProductMutations();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      uom: "PCS",
      unitCost: 0,
      initialStock: undefined,
      initialLocationId: "",
    },
  });

  const initialStock = form.watch("initialStock");

  async function onSubmit(values: FormValues) {
    try {
      await createProduct.mutateAsync({
        name: values.name.trim(),
        sku: values.sku.trim().toUpperCase(),
        categoryId: values.categoryId,
        uom: values.uom.trim(),
        unitCost: String(values.unitCost),
        initialStock: values.initialStock ? Number(values.initialStock) : undefined,
        initialLocationId: values.initialStock && values.initialStock > 0 ? values.initialLocationId : undefined,
      });

      toast.success("Product created successfully");
      router.push(ROUTES.PRODUCTS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product";
      toast.error(msg);
    }
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-medium">Product Name</FormLabel>
                    <FormControl>
                      <Input className="h-9 text-xs" placeholder="e.g. Steel Rod 12mm" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">SKU / Code</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9 text-xs font-mono uppercase"
                        placeholder="e.g. STL-ROD-12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={categoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={categoriesLoading ? "Loading categories…" : "Select category"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Unit of Measure</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select UoM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UOM_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u} className="text-xs">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Unit Cost (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-9 text-xs"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Initial stock */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Stock
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Optional — creates an opening stock entry via an inventory Adjustment.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="initialStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="h-9 text-xs"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {(initialStock ?? 0) > 0 && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium block">Target Warehouse</label>
                    <Select
                      value={selectedWarehouseId}
                      onValueChange={(val) => {
                        setSelectedWarehouseId(val);
                        form.setValue("initialLocationId", "");
                      }}
                      disabled={warehousesLoading}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue
                          placeholder={
                            warehousesLoading ? "Loading warehouses…" : "Select warehouse"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id} className="text-xs">
                            {w.name} ({w.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="initialLocationId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs font-medium">Storage Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                          disabled={!selectedWarehouseId || locationsLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue
                                placeholder={
                                  !selectedWarehouseId
                                    ? "Select a warehouse first"
                                    : locationsLoading
                                    ? "Loading locations…"
                                    : locations.length === 0
                                    ? "No locations in this warehouse"
                                    : "Select storage location"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((l) => (
                              <SelectItem key={l.id} value={l.id} className="text-xs">
                                {l.name} ({l.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={ROUTES.PRODUCTS}>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={form.formState.isSubmitting || createProduct.isPending}
            >
              {(form.formState.isSubmitting || createProduct.isPending) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Create Product
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
