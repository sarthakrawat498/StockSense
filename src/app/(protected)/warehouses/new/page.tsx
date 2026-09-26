"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Warehouse, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import {
  createWarehouseSchema,
  type CreateWarehouseInput,
} from "@/features/warehouses/schemas/warehouse-schemas";
import { useWarehouseMutations } from "@/features/warehouses/hooks/use-warehouse-mutations";

export default function NewWarehousePage() {
  const router = useRouter();
  const { createWarehouse, createLocation } = useWarehouseMutations();
  const [createDefaultLocation, setCreateDefaultLocation] = useState(true);

  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
    },
  });

  const onSubmit = async (values: CreateWarehouseInput) => {
    try {
      const warehouse = await createWarehouse.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        address: values.address ? values.address.trim() : undefined,
      });

      // Optionally create initial default stock location
      if (createDefaultLocation && warehouse?.id) {
        try {
          await createLocation.mutateAsync({
            warehouseId: warehouse.id,
            input: {
              name: "General Storage",
              code: "STOCK",
            },
          });
        } catch {
          // Non-blocking if location creation fails
        }
      }

      toast.success(`Warehouse "${values.name}" created successfully`);
      router.push(ROUTES.WAREHOUSES);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create warehouse";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 max-w-[700px] mx-auto py-2">
      {/* Back button and page title */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.WAREHOUSES}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New Warehouse</h1>
          <p className="text-xs text-muted-foreground">
            Configure a new storage facility and location zones
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="glass-card rounded-xl p-6 border border-border/60">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-name" className="text-xs font-medium">
                Warehouse Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="wh-name"
                  placeholder="e.g. North Distribution Hub"
                  className="h-9 pl-9 text-xs"
                  {...form.register("name")}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wh-code" className="text-xs font-medium">
                Warehouse Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wh-code"
                placeholder="e.g. WH-NORTH"
                className="h-9 text-xs font-mono uppercase"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-address" className="text-xs font-medium">
              Physical Address
            </Label>
            <Textarea
              id="wh-address"
              placeholder="e.g. 100 Industrial Boulevard, Suite 400, Chicago, IL 60601"
              className="text-xs min-h-[80px]"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          {/* Quick option to provision initial storage location */}
          <div className="rounded-lg p-3.5 bg-muted/30 border border-border/40 flex items-start gap-3">
            <input
              type="checkbox"
              id="default-loc"
              checked={createDefaultLocation}
              onChange={(e) => setCreateDefaultLocation(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <label
                htmlFor="default-loc"
                className="text-xs font-medium text-foreground cursor-pointer block"
              >
                Create default storage location (<span className="font-mono">STOCK</span>)
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automatically provisions a &quot;General Storage&quot; location so you can receive inventory right away.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            <Link href={ROUTES.WAREHOUSES}>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Create Warehouse
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
