export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 py-3.5 border-b border-white/[0.04]"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-3.5 bg-slate-800 rounded-full"
              style={{
                flex: j === 0 ? 2 : j === cols - 1 ? 1.5 : 1,
                opacity: 1 - j * 0.1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-[#111827] border border-white/[0.07] p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-800 rounded-full" />
          <div className="h-7 w-16 bg-slate-700 rounded-lg" />
        </div>
        <div className="w-9 h-9 bg-slate-800 rounded-lg" />
      </div>
    </div>
  )
}
