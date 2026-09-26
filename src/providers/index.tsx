"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";

/**
 * Composes all global providers.
 * ThemeProvider must be outermost to avoid flash of unstyled content.
 */
export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>{children}</QueryProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
