"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, ShieldCheck, UserRound, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

interface TeamMember {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "MANAGER" | "STAFF";
  warehouseId: string | null;
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Redirect non-managers
  useEffect(() => {
    if (user && user.role !== "MANAGER") {
      window.location.href = ROUTES.DASHBOARD;
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMembers(json.data);
      })
      .catch(() => toast.error("Failed to load team"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(member: TeamMember) {
    const newRole = member.role === "MANAGER" ? "STAFF" : "MANAGER";
    setUpdating(member.id);
    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
      toast.success(`${member.username} is now ${newRole === "MANAGER" ? "a Manager" : "Staff"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  const managers = members.filter((m) => m.role === "MANAGER");
  const staff    = members.filter((m) => m.role === "STAFF");

  function displayName(m: TeamMember) {
    return m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.username;
  }

  return (
    <div className="space-y-5 max-w-[1000px]">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-violet-500/10">
          <Users className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Team</h2>
          <p className="text-xs text-muted-foreground">
            {managers.length} manager{managers.length !== 1 ? "s" : ""} · {staff.length} staff member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Managers</p>
            <p className="text-2xl font-bold">{managers.length}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <UserRound className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Staff</p>
            <p className="text-2xl font-bold">{staff.length}</p>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider py-3">Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Username</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Joined</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} className="dark:hover:bg-white/[0.02] hover:bg-muted/30">
                  <TableCell className="py-3 font-medium text-sm">{displayName(m)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] h-5 px-2 border-0 ${
                      m.role === "MANAGER"
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    }`}>
                      {m.role === "MANAGER" ? "Manager" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Can't demote yourself */}
                    {m.id !== user?.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-xs gap-1.5 ${
                          m.role === "MANAGER"
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-muted-foreground hover:text-violet-500"
                        }`}
                        onClick={() => toggleRole(m)}
                        disabled={updating === m.id}
                      >
                        {updating === m.id ? (
                          "Updating…"
                        ) : m.role === "MANAGER" ? (
                          <><ArrowDownCircle className="h-3.5 w-3.5" />Demote to Staff</>
                        ) : (
                          <><ArrowUpCircle className="h-3.5 w-3.5" />Promote to Manager</>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">You</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
}
