import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Fixed background depth orbs (dark mode only) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden" aria-hidden>
        <div className="absolute -top-32 left-20 h-[420px] w-[420px] rounded-full bg-blue-600/[0.18] blur-[110px]" />
        <div className="absolute bottom-0 right-10 h-[380px] w-[380px] rounded-full bg-violet-600/[0.14] blur-[110px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-500/[0.06] blur-[90px]" />
      </div>

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
