"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/schemas/auth.schema";
import { authClient } from "@/features/auth/services/auth.service";
import { ROUTES } from "@/constants/routes";

export default function ResetPasswordPage() {
  const router = useRouter();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      const message = await authClient.resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.password,
      });
      toast.success(message);
      router.push(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-background" />
        </div>
        <span className="font-semibold text-base tracking-tight">StockSense</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">Enter the code from your email and choose a new password</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Email address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" autoComplete="email" className="h-10" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="otp" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Verification code</FormLabel>
              <FormControl>
                <Input
                  placeholder="6-digit code from email"
                  maxLength={6}
                  className="h-10 font-mono tracking-[0.3em]"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">New password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Min. 8 chars, uppercase, lowercase, special" autoComplete="new-password" className="h-10" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="new-password" className="h-10" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <Button type="submit" className="w-full h-10 font-medium" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Form>

      <Link href={ROUTES.LOGIN} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to sign in
      </Link>
    </div>
  );
}
