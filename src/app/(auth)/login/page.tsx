"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
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
