export default function DashboardPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        StockSense
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Inventory Management System</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Products", value: "—" },
          { label: "Low Stock Items", value: "—" },
          { label: "Pending Receipts", value: "—" },
          { label: "Pending Deliveries", value: "—" },
          { label: "Internal Transfers", value: "—" },
          { label: "Out of Stock", value: "—" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.25rem",
              background: "#fff",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.5rem" }}>{kpi.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.25rem", background: "#fff" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Operations</h2>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No operations yet.</p>
      </div>
    </div>
  );
}
