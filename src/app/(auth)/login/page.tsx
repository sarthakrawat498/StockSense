"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BarChart3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isManagerLogin, setIsManagerLogin] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values);

      // Role guard — if manager toggle is checked, ensure the account is MANAGER
      if (isManagerLogin && user.role !== "MANAGER") {
        toast.error("Access denied. This account does not have manager privileges.");
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        return;
      }

      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
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
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" autoComplete="username" className="h-10" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="current-password" className="h-10" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />

          {/* Manager toggle */}
          <div
            className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors ${
              isManagerLogin
                ? "border-violet-500/40 bg-violet-500/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
            onClick={() => setIsManagerLogin((v) => !v)}
          >
            <Checkbox
              id="manager-login"
              checked={isManagerLogin}
              onCheckedChange={(v) => setIsManagerLogin(!!v)}
              className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
            />
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${isManagerLogin ? "text-violet-500" : "text-muted-foreground"}`} />
              <Label htmlFor="manager-login" className="text-sm cursor-pointer select-none">
                Sign in as Manager
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full h-10 font-medium" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">or</span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGNUP} className="font-medium text-foreground underline-offset-4 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
