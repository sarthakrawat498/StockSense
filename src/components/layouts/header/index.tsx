"use client";

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

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm dark:border-white/[0.07] dark:[background:rgba(10,10,10,0.65)] dark:[backdrop-filter:blur(20px)] px-6">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                  U
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="gap-2 text-sm">
              <User className="h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
