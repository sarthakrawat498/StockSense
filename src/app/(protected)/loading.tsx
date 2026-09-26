export default function Loading() {
  return (
    <div className="space-y-5 max-w-[1200px] animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-14 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
