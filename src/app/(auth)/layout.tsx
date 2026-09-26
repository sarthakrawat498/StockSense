import {
  Package,
  Warehouse,
  ClipboardList,
  ArrowRightLeft,
  BarChart3,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Product Management",
    description: "Track every SKU across categories and units of measure",
  },
  {
    icon: Warehouse,
    title: "Multi-Warehouse Support",
    description: "Manage stock across locations and sub-locations",
  },
  {
    icon: ClipboardList,
    title: "Receipts & Deliveries",
    description: "Process incoming and outgoing goods with full validation",
  },
  {
    icon: ArrowRightLeft,
    title: "Internal Transfers",
    description: "Move stock between warehouses with a complete audit trail",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left — Form panel ── */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* ── Right — Brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 px-14 py-14 relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top — wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-950" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">StockSense</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            A centralized, real-time inventory management system built to replace manual registers
            and scattered tracking.
          </p>
        </div>

        {/* Middle — features */}
        <div className="relative z-10 space-y-6">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            What you get
          </p>
          <ul className="space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — badge */}
        <div className="relative z-10 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-slate-500" />
          <p className="text-xs text-slate-500">Odoo Hackathon 2026</p>
        </div>
      </div>
    </div>
  );
}
