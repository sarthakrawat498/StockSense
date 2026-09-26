"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, User, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";

// ─── Pathname → title mapping ─────────────────────────────────────────────────

const STATIC_TITLES: Record<string, string> = {
  "/dashboard":                      "Dashboard",
  "/products":                       "Products",
  "/operations/receipts":            "Receipts",
  "/operations/receipts/new":        "New Receipt",
  "/operations/deliveries":          "Deliveries",
  "/operations/deliveries/new":      "New Delivery",
  "/operations/transfers":           "Transfers",
  "/operations/transfers/new":       "New Transfer",
  "/operations/adjustments":         "Adjustments",
  "/operations/adjustments/new":     "New Adjustment",
  "/warehouses":                     "Warehouses",
  "/warehouses/new":                 "New Warehouse",
  "/move-history":                   "Move History",
  "/settings":                       "Settings",
  "/profile":                        "Profile",
};

function getTitle(pathname: string): string {
  if (STATIC_TITLES[pathname]) return STATIC_TITLES[pathname];
  if (/^\/operations\/receipts\/.+/.test(pathname))    return "Receipt";
  if (/^\/operations\/deliveries\/.+/.test(pathname))  return "Delivery";
  if (/^\/operations\/transfers\/.+/.test(pathname))   return "Transfer";
  if (/^\/operations\/adjustments\/.+/.test(pathname)) return "Adjustment";
  if (/^\/products\/.+/.test(pathname))                return "Product";
  if (/^\/warehouses\/.+/.test(pathname))              return "Warehouse";
  return "StockSense";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Prefer firstName, fall back to username
  const displayName = user?.firstName ?? user?.username ?? "";
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : displayName.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b px-6 bg-background/80 backdrop-blur-sm dark:border-white/[0.07] dark:[background:rgba(10,10,10,0.65)] dark:[backdrop-filter:blur(20px)]">
      <h1 className="text-sm font-semibold">{getTitle(pathname)}</h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium hidden sm:block">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="gap-2 text-sm cursor-pointer">
                <User className="h-3.5 w-3.5" />Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="h-3.5 w-3.5" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
