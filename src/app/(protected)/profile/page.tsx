"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, Shield, Mail, AtSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/providers/auth-provider";

// ─── Schema ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName:  z.string().min(1, "Last name is required").max(80),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="rounded-md bg-muted p-2 flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName:  user?.lastName  ?? "",
    },
  });

  // Sync form when user data arrives
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName:  user.lastName  ?? "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Update failed");
      await refetchUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[700px]">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username}
          </h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Badge
          className={`ml-2 text-[10px] h-5 px-2 ${
            user.role === "MANAGER"
              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 hover:bg-violet-500/10"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 hover:bg-blue-500/10"
          }`}
        >
          {user.role}
        </Badge>
      </div>

      {/* Account info */}
      <div className="glass-card rounded-xl px-5 divide-y divide-border dark:divide-white/[0.06]">
        <InfoRow icon={AtSign}  label="Username"  value={user.username} />
        <InfoRow icon={Mail}    label="Email"     value={user.email} />
        <InfoRow icon={Shield}  label="Role"      value={user.role === "MANAGER" ? "Inventory Manager" : "Warehouse Staff"} />
      </div>

      {/* Edit name */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Update Name
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">First name</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-xs" placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Last name</FormLabel>
                  <FormControl>
                    <Input className="h-9 text-xs" placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Change password */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use the forgot password flow to reset your password via email OTP
            </p>
          </div>
          <a href="/forgot-password">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Change Password
            </Button>
          </a>
        </div>
      </div>

    </div>
  );
}
