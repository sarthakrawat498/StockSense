// TODO: Add auth check here — redirect to /login if no session
// For now passes through while auth is being wired up

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
