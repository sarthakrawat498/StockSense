"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OPERATION_CONFIG } from "./operation-config";
import {
  operationsApi,
  type WarehouseOption,
  type LocationOption,
  type ProductOption,
} from "../services/operations-api";
import type { OperationType } from "@/types/common.types";

// ─── Schema Definition ─────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().min(0.000001, "Quantity must be > 0").default(1),
  countedQuantity: z.coerce.number().min(0, "Counted qty cannot be negative").optional(),
});

const operationSchema = z
  .object({
    warehouseId: z.string().min(1, "Warehouse is required"),
    fromLocationId: z.string().optional(),
    toLocationId: z.string().optional(),
    contactName: z.string().optional(),
    address: z.string().optional(),
    scheduledDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(lineItemSchema).min(1, "Add at least one product"),
  });

type OperationFormValues = z.infer<typeof operationSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface NewOperationPageProps {
  type: OperationType;
}

export function NewOperationPage({ type }: NewOperationPageProps) {
  const router = useRouter();
  const config = OPERATION_CONFIG[type];
  const Icon = config.icon;
  const isAdjustment = type === "ADJUSTMENT";

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      warehouseId: "",
      fromLocationId: "",
      toLocationId: "",
      contactName: "",
      address: "",
      scheduledDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1, countedQuantity: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedWarehouseId = form.watch("warehouseId");

  // Load initial warehouses and products
  useEffect(() => {
    async function loadInitial() {
      setLoadingData(true);
      try {
        const [whs, prods] = await Promise.all([
          operationsApi.fetchWarehouses(),
          operationsApi.fetchProducts(),
        ]);
        setWarehouses(whs || []);
        setProducts(prods || []);
      } catch (err: unknown) {
        toast.error("Failed to load options");
      } finally {
        setLoadingData(false);
      }
    }
    loadInitial();
  }, []);

  // When warehouse changes, fetch locations
  useEffect(() => {
    if (!selectedWarehouseId) {
      setLocations([]);
      return;
    }

    async function loadWarehouseLocations(whId: string) {
      try {
        const locs = await operationsApi.fetchLocations(whId);
        setLocations(locs || []);
      } catch (err) {
        setLocations([]);
      }
    }

    loadWarehouseLocations(selectedWarehouseId);
  }, [selectedWarehouseId]);

  async function handleCreate(values: OperationFormValues, validateImmediately = false) {
    // Validate required locations according to operation type
    if (config.hasFromLocation && !values.fromLocationId) {
      form.setError("fromLocationId", { message: "Source location is required" });
      return;
    }
    if ((config.hasToLocation || isAdjustment) && !values.toLocationId) {
      form.setError("toLocationId", { message: "Destination location is required" });
      return;
    }
    if (type === "TRANSFER" && values.fromLocationId === values.toLocationId) {
      form.setError("toLocationId", { message: "Source and destination locations must be different" });
      return;
    }

    setSubmitting(true);
    try {
      const created = await operationsApi.create(type, {
        warehouseId: values.warehouseId,
        fromLocationId: values.fromLocationId || undefined,
        toLocationId: values.toLocationId || undefined,
        contactName: values.contactName || undefined,
        address: values.address || undefined,
        scheduledDate: values.scheduledDate || undefined,
        notes: values.notes || undefined,
        items: values.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          countedQuantity: isAdjustment ? i.countedQuantity ?? i.quantity : undefined,
        })),
      });

      if (validateImmediately) {
        try {
          await operationsApi.confirm(type, created.id);
          toast.success(`${config.singular} created and validated! Stock updated.`);
        } catch (confirmErr: unknown) {
          const msg = confirmErr instanceof Error ? confirmErr.message : "Validation error";
          toast.warning(`${config.singular} saved as draft, but validation failed: ${msg}`);
          router.push(`/operations/${config.route}/${created.id}`);
          return;
        }
      } else {
        toast.success(`${config.singular} saved as draft.`);
      }

      router.push(`/operations/${config.route}/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create operation";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[860px]">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href={`/operations/${config.route}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className={`rounded-lg p-1.5 ${config.accent}`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </div>
          <h2 className="text-base font-semibold tracking-tight">{config.newLabel}</h2>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-5">
          {/* Operation details */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Operation Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Warehouse</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("fromLocationId", "");
                        form.setValue("toLocationId", "");
                      }}
                      value={field.value}
                      disabled={loadingData}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={loadingData ? "Loading warehouses..." : "Select warehouse"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id} className="text-xs">
                            {wh.name} ({wh.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {config.hasFromLocation && (
                <FormField
                  control={form.control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Source Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={!selectedWarehouseId || locations.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue
                              placeholder={
                                !selectedWarehouseId
                                  ? "Select warehouse first"
                                  : locations.length === 0
                                  ? "No locations in this warehouse"
                                  : "Select source location"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                              {loc.name} ({loc.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {(config.hasToLocation || isAdjustment) && (
                <FormField
                  control={form.control}
                  name="toLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        {isAdjustment ? "Location to Adjust" : "Destination Location"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={!selectedWarehouseId || locations.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue
                              placeholder={
                                !selectedWarehouseId
                                  ? "Select warehouse first"
                                  : locations.length === 0
                                  ? "No locations in this warehouse"
                                  : "Select destination location"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                              {loc.name} ({loc.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {config.contactLabel && (
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">{config.contactLabel}</FormLabel>
                      <FormControl>
                        <Input className="h-9 text-xs" placeholder={`${config.contactLabel} name`} {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Scheduled Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-medium">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        className="text-xs resize-none"
                        rows={2}
                        placeholder="Optional notes or instructions…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Products */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-primary"
                onClick={() => append({ productId: "", quantity: 1, countedQuantity: undefined })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3 w-[50%]">
                    Product
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[25%]">
                    {isAdjustment ? "Counted Qty" : "Quantity"}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, idx) => (
                  <TableRow key={field.id} className="dark:hover:bg-white/[0.02]">
                    <TableCell className="py-2">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.productId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <Select onValueChange={f.onChange} value={f.value} disabled={loadingData}>
                              <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs">
                                    {p.name} <span className="text-muted-foreground ml-1 font-mono">({p.sku})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <FormField
                        control={form.control}
                        name={isAdjustment ? `items.${idx}.countedQuantity` : `items.${idx}.quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                className="h-8 text-xs w-28"
                                {...f}
                                value={f.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {form.formState.errors.items &&
              typeof form.formState.errors.items === "object" &&
              !Array.isArray(form.formState.errors.items) && (
                <p className="px-5 py-2 text-xs text-destructive">
                  {(form.formState.errors.items as { message?: string }).message}
                </p>
              )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Link href={`/operations/${config.route}`}>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={submitting}
              onClick={form.handleSubmit((values) => handleCreate(values, false))}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save as Draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={submitting}
              onClick={form.handleSubmit((values) => handleCreate(values, true))}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Create & Validate
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
