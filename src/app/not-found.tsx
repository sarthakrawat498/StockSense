import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>404 — Page Not Found</h1>
      <Link href="/dashboard">Back to Dashboard</Link>
    </div>
  );
}
