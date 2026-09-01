export default function Loading() {
  return (
    <main className="flex h-full flex-col">
      <header className="shrink-0 px-5 pb-3 pt-6">
        <div className="h-6 w-40 animate-pulse rounded-md bg-surface-2" />
      </header>
      <div className="scroll-area min-h-0 flex-1 space-y-3.5 px-5 pb-6 pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </main>
  );
}
