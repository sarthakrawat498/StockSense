"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createLocationSchema,
  type CreateLocationInput,
} from "../schemas/warehouse-schemas";
import { useWarehouseMutations } from "../hooks/use-warehouse-mutations";

interface AddLocationDialogProps {
  warehouseId: string;
  warehouseName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddLocationDialog({
  warehouseId,
  warehouseName,
  trigger,
  onSuccess,
}: Readonly<AddLocationDialogProps>) {
  const [open, setOpen] = useState(false);
  const { createLocation } = useWarehouseMutations();

  const form = useForm<CreateLocationInput>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const onSubmit = async (values: CreateLocationInput) => {
    try {
      await createLocation.mutateAsync({
        warehouseId,
        input: {
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
        },
      });
      toast.success(`Location "${values.name}" created in ${warehouseName}`);
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create location";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] gap-1 text-primary px-2"
          >
            <Plus className="h-3 w-3" />
            Add Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Location</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new storage shelf, rack, or zone to {warehouseName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="loc-name" className="text-xs font-medium">
                Location Name
              </Label>
              <Input
                id="loc-name"
                placeholder="e.g. Shelf A-1, Bulk Storage"
                className="h-8 text-xs"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-code" className="text-xs font-medium">
                Location Code
              </Label>
              <Input
                id="loc-code"
                placeholder="e.g. SH-A1, RACK-01"
                className="h-8 text-xs font-mono uppercase"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Create Location
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
