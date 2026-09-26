"use client";

import React from "react";

import { Toaster } from "sonner";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryProvider>
  );
}

export * from "./query-provider";
export * from "./auth-provider";
