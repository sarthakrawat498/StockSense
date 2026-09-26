"use client";

import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layouts/app-shell";import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OPERATION_CONFIG } from "./operation-config";
import type { OperationType } from "@/types/common.types";

// ─── Mock dropdown options ────────────────────────────────────────────────────

const MOCK_WAREHOUSES = [
  { id: "wh-1", name: "Main Warehouse" },
  { id: "wh-2", name: "Warehouse B" },
];

const MOCK_LOCATIONS = [
  { id: "loc-1", name: "Shelf A-1" },
  { id: "loc-2", name: "Rack B-3" },
  { id: "loc-3", name: "Main Store" },
  { id: "loc-4", name: "Production Floor" },
  { id: "loc-5", name: "Rack C-1" },
];

const MOCK_PRODUCTS = [
  { id: "p-1", name: "Steel Rod 12mm",   sku: "STL-ROD-12", uom: "KG" },
  { id: "p-2", name: "Steel Plate 6mm",  sku: "STL-PLT-06", uom: "KG" },
  { id: "p-3", name: "Copper Wire 2.5mm",sku: "COP-WIR-25", uom: "M"  },
  { id: "p-4", name: "Aluminium Sheet",  sku: "ALU-SHT-01", uom: "PCS"},
  { id: "p-5", name: "Bolt M8",          sku: "BLT-M8-001", uom: "PCS"},
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().positive("Must be > 0"),
  countedQuantity: z.coerce.number().min(0).optional(),
  locationId: z.string().optional(),
});

const operationSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  contactName: z.string().optional(),
  scheduleDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Add at least one product"),
});

type OperationFormValues = z.infer<typeof operationSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface NewOperationPageProps {
  type: OperationType;
}

export function NewOperationPage({ type }: NewOperationPageProps) {
  const config = OPERATION_CONFIG[type];
  const Icon = config.icon;
  const isAdjustment = type === "ADJUSTMENT";

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      warehouseId: "",
      fromLocationId: "",
      toLocationId: "",
      contactName: "",
      scheduleDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1, countedQuantity: undefined, locationId: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function onSubmit(values: OperationFormValues) {
    // TODO: call API
    console.warn("New operation", type, values);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_WAREHOUSES.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id} className="text-xs">{wh.name}</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id} className="text-xs">{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}

                {config.hasToLocation && (
                  <FormField
                    control={form.control}
                    name="toLocationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Destination Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id} className="text-xs">{loc.name}</SelectItem>
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
                  name="scheduleDate"
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
                          placeholder="Optional notes…"
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
                  onClick={() => append({ productId: "", quantity: 1, countedQuantity: undefined, locationId: "" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Product
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3 w-[40%]">Product</TableHead>
                    {isAdjustment && (
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[20%]">Location</TableHead>
                    )}
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[20%]">
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
                              <Select onValueChange={f.onChange} value={f.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MOCK_PRODUCTS.map((p) => (
                                    <SelectItem key={p.id} value={p.id} className="text-xs">
                                      {p.name} <span className="text-muted-foreground ml-1">{p.sku}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      {isAdjustment && (
                        <TableCell className="py-2">
                          <FormField
                            control={form.control}
                            name={`items.${idx}.locationId`}
                            render={({ field: f }) => (
                              <FormItem>
                                <Select onValueChange={f.onChange} value={f.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Location" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MOCK_LOCATIONS.map((loc) => (
                                      <SelectItem key={loc.id} value={loc.id} className="text-xs">{loc.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      )}
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
                                  className="h-8 text-xs w-24"
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

              {form.formState.errors.items && typeof form.formState.errors.items === "object" && !Array.isArray(form.formState.errors.items) && (
                <p className="px-5 py-2 text-xs text-destructive">
                  {(form.formState.errors.items as { message?: string }).message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Link href={`/operations/${config.route}`}>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={form.formState.isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={form.formState.isSubmitting}
              >
                Create {config.singular}
              </Button>
            </div>

          </form>
        </Form>
      </div>
  );
}
