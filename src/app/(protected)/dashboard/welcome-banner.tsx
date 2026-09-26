"use client";

import { TrendingUp } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function WelcomeBanner() {
  const { user } = useAuth();
  const name = user?.firstName ?? user?.username ?? "";

  return (
    <div className="glass-card rounded-xl px-6 py-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Welcome back{name ? `, ${name}` : ""}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here&apos;s a snapshot of your inventory operations today.
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary">Live</span>
      </div>
    </div>
  );
}
