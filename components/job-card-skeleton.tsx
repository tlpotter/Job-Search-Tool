export function JobCardSkeleton() {
  return (
    <div className="card card-bordered bg-base-100 shadow-sm overflow-hidden">
      {/* Shimmer overlay */}
      <div className="card-body p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title — two lines like a real long title */}
            <div className="space-y-2">
              <div className="h-4 shimmer rounded w-3/4" />
              <div className="h-4 shimmer rounded w-1/2" />
            </div>
            {/* Company row */}
            <div className="flex items-center gap-3">
              <div className="h-3 shimmer rounded w-1/4" />
              <div className="h-3 shimmer rounded w-16" />
              <div className="h-3 shimmer rounded w-12" />
            </div>
            {/* Meta row */}
            <div className="flex gap-4">
              <div className="h-3 shimmer rounded w-16" />
              <div className="h-3 shimmer rounded w-28" />
              <div className="h-3 shimmer rounded w-14" />
            </div>
            {/* Chips */}
            <div className="flex gap-2 pt-1">
              <div className="h-5 shimmer rounded-full w-20" />
              <div className="h-5 shimmer rounded-full w-24" />
              <div className="h-5 shimmer rounded-full w-16" />
            </div>
            {/* AI summary line */}
            <div className="h-3 shimmer rounded w-full mt-1" />
            <div className="h-3 shimmer rounded w-4/5" />
          </div>

          {/* Right column — score badges */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="h-6 shimmer rounded w-12" />
            <div className="h-6 shimmer rounded w-12" />
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-base-content/10">
          <div className="h-7 shimmer rounded w-[50%]" />
          <div className="flex gap-2">
            <div className="h-7 shimmer rounded w-28" />
            <div className="h-7 shimmer rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
