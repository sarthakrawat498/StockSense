"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas/auth.schema";
import { authClient } from "@/features/auth/services/auth.service";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      const message = await authClient.forgotPassword(values);
      setSentMessage(message);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (sent) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-background" />
          </div>
          <span className="font-semibold text-base tracking-tight">StockSense</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Check your email</h1>
          </div>
          <p className="text-sm text-muted-foreground">{sentMessage}</p>
          <p className="text-xs text-muted-foreground">Enter your email, OTP code, and new password on the next page.</p>
        </div>
        <Link href={ROUTES.RESET_PASSWORD}>
          <Button className="w-full h-10">Continue to Reset Password</Button>
        </Link>
        <Link href={ROUTES.LOGIN} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to sign in
        </Link>
      </div>
    );
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
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset code</p>
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

          <Button type="submit" className="w-full h-10 font-medium" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending…" : "Send Reset Code"}
          </Button>
        </form>
      </Form>

      <Link href={ROUTES.LOGIN} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to sign in
      </Link>
    </div>
  );
}
