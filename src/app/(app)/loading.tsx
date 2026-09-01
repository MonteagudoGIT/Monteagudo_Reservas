export default function Loading() {
  return (
    <div className="flex h-full flex-col p-5">
      <div className="h-6 w-44 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
