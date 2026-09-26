"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  History,
  Settings,
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  ClipboardEdit,
  BarChart3,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const NAV = [
    {
      items: [
        { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      ],
    },
    {
      section: "Operations",
      items: [
        { label: "Receipts",    href: ROUTES.RECEIPTS,    icon: PackagePlus },
        { label: "Deliveries",  href: ROUTES.DELIVERIES,  icon: PackageMinus },
        { label: "Transfers",   href: ROUTES.TRANSFERS,   icon: ArrowRightLeft },
        { label: "Adjustments", href: ROUTES.ADJUSTMENTS, icon: ClipboardEdit },
      ],
    },
    {
      section: "Inventory",
      items: [
        { label: "Products",     href: ROUTES.PRODUCTS,     icon: Package },
        { label: "Warehouses",   href: ROUTES.WAREHOUSES,   icon: Warehouse },
        { label: "Move History", href: ROUTES.MOVE_HISTORY, icon: History },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
        // Team tab — MANAGER only
        ...(isManager ? [{ label: "Team", href: ROUTES.TEAM, icon: Users }] : []),
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-[220px] flex-shrink-0 flex-col border-r bg-background dark:border-white/[0.07] dark:[background:rgba(10,10,10,0.75)] dark:[backdrop-filter:blur(16px)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
          <BarChart3 className="h-3.5 w-3.5 text-background" />
        </div>
        <span className="text-sm font-semibold tracking-tight">StockSense</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.section && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </p>
            )}
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3">
        <Separator className="mb-3" />
        <div className="px-2 flex items-center gap-2">
          {isManager && (
            <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5">
              Manager
            </span>
          )}
          <p className="text-[11px] text-muted-foreground">Odoo Hackathon 2026</p>
        </div>
      </div>
    </aside>
  );
}
