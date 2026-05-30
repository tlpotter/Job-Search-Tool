export function JobCardSkeleton() {
  return (
    <div className="glass rounded-[18px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Source eyebrow */}
          <div className="h-3 shimmer rounded w-20" />
          {/* Title — two lines like a real long title */}
          <div className="space-y-2 pt-1">
            <div className="h-5 shimmer rounded w-3/4" />
            <div className="h-5 shimmer rounded w-1/2" />
          </div>
          {/* Company row */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-4 shimmer rounded w-1/4" />
            <div className="h-3 shimmer rounded w-16" />
          </div>
          {/* Meta row */}
          <div className="flex gap-4">
            <div className="h-3 shimmer rounded w-16" />
            <div className="h-3 shimmer rounded w-28" />
          </div>
          {/* Chips */}
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 shimmer rounded-md w-20" />
            <div className="h-5 shimmer rounded-md w-24" />
            <div className="h-5 shimmer rounded-md w-16" />
          </div>
          {/* AI summary line */}
          <div className="h-3 shimmer rounded w-full mt-1" />
          <div className="h-3 shimmer rounded w-4/5" />
        </div>

        {/* Right column — score badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 shimmer rounded w-16" />
          <div className="h-6 shimmer rounded w-16" />
        </div>
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-end gap-2 mt-5 pt-5 border-t border-white/[0.05]">
        <div className="h-7 shimmer rounded w-[40%] mr-auto" />
        <div className="h-7 shimmer rounded w-20" />
        <div className="h-7 shimmer rounded w-24" />
        <div className="h-7 shimmer rounded w-20" />
      </div>
    </div>
  );
}
