"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { JobCard } from "./job-card";
import { JobCardSkeleton } from "./job-card-skeleton";
import { FilterSidebar, Filters, DEFAULT_FILTERS } from "./filter-sidebar";

export function JobFeed() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [jobs, setJobs] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [dbTotal, setDbTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function buildParams(f: Filters, off: number) {
    const params = new URLSearchParams({
      minScore: String(f.minScore),
      sortBy: f.sortBy,
      offset: String(off),
    });
    if (f.remote) params.set("remote", "true");
    if (f.remoteOrLocal) params.set("remoteOrLocal", "true");
    if (f.hasEquity) params.set("hasEquity", "true");
    if (f.hasBenefits) params.set("hasBenefits", "true");
    if (f.hasSalary) params.set("hasSalary", "true");
    if (f.designSystems) params.set("designSystems", "true");
    if (f.mentionsAI) params.set("mentionsAI", "true");
    if (f.hideAgencies) params.set("agency", "false");
    if (f.aiScoredOnly) params.set("aiScoredOnly", "true");
    if (f.goodReputationOnly) params.set("goodReputation", "true");
    if (f.minAiScore > 0) params.set("minAiScore", String(f.minAiScore));
    if (f.postedWithin) params.set("postedWithin", f.postedWithin);
    if (f.companySize) params.set("companySize", f.companySize);
    if (f.roleType) params.set("roleType", f.roleType);
    if (f.source) params.set("source", f.source);
    return params;
  }

  // Initial load / filter change — reset everything
  const fetchInitial = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    setJobs([]);
    setOffset(0);
    setHasMore(true);
    try {
      const res = await fetch(`/api/listings?${buildParams(f, 0)}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      const json = await res.json();
      setJobs(json.data);
      setTotal(json.total);
      setDbTotal(json.dbTotal);
      setOffset(json.pageSize);
      setHasMore(json.data.length === json.pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load next page
  const fetchMore = useCallback(async (f: Filters, off: number) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/listings?${buildParams(f, off)}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      const json = await res.json();
      setJobs((prev) => [...prev, ...json.data]);
      setOffset(off + json.pageSize);
      setHasMore(json.data.length === json.pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  // Refetch on filter change
  useEffect(() => {
    fetchInitial(filters);
  }, [filters, fetchInitial]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMore(filters, offset);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, filters, offset, fetchMore]);

  async function handleStatusChange(id: string, status: string) {
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, status }),
    });
    if (status === "applied") {
      // Delay removal so the applied animation can play
      setTimeout(() => {
        setJobs((prev) => (prev as Record<string, unknown>[]).filter((j) => j.id !== id));
      }, 700);
    } else if (status === "hidden" || status === "not_interested" || status === "passed") {
      const el = cardRefs.current.get(id);
      const remove = () => setJobs((prev) => (prev as Record<string, unknown>[]).filter((j) => j.id !== id));
      if (el) {
        el.animate([
          { opacity: 1, transform: "scale(1)", maxHeight: `${el.offsetHeight}px` },
          { opacity: 0, transform: "scale(0.92)", maxHeight: `${el.offsetHeight}px`, offset: 0.4 },
          { opacity: 0, transform: "scale(0.92)", maxHeight: "0px", marginBottom: "0px" },
        ], { duration: 350, easing: "ease-in", fill: "forwards" }).onfinish = remove;
      } else {
        remove();
      }
    } else {
      setJobs((prev) =>
        prev.map((j) => {
          const job = j as Record<string, unknown>;
          if (job.id !== id) return j;
          const userActions = (job.user_actions as Record<string, unknown>) ?? {};
          return { ...job, user_actions: { ...userActions, status } };
        })
      );
    }
  }

  async function handleBookmark(id: string, bookmarked: boolean) {
    await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, bookmarked }),
    });
    setJobs((prev) =>
      prev.map((j) => {
        const job = j as Record<string, unknown>;
        if (job.id !== id) return j;
        const userActions = (job.user_actions as Record<string, unknown>) ?? {};
        return { ...job, user_actions: { ...userActions, bookmarked } };
      })
    );
  }

  const PHOENIX_TERMS = ["phoenix", "scottsdale", "tempe", "mesa", "chandler", "gilbert", "glendale", "peoria", "surprise", "arizona", ", az", "(az)"];
  const HIDDEN_STATUSES = new Set(["not_interested", "applied", "hidden", "passed"]);

  const visibleJobs = (jobs as Record<string, unknown>[]).filter((j) => {
    if (HIDDEN_STATUSES.has((j.user_actions as Record<string, unknown> | null)?.status as string)) return false;
    if (filters.remoteOrLocal) {
      const loc = ((j.location as string) ?? "").toLowerCase();
      const isRemote = j.remote === true || loc.includes("remote");
      const isLocal = PHOENIX_TERMS.some(t => loc.includes(t));
      if (!isRemote && !isLocal) return false;
    }
    return true;
  });
  const topMatches = visibleJobs.filter((j) => (j.relevance_score as number ?? 0) >= 70);
  const goodMatches = visibleJobs.filter((j) => {
    const s = j.relevance_score as number ?? 0;
    return s >= 40 && s < 70;
  });

  return (
    <div className="flex gap-6">
      <FilterSidebar filters={filters} onChange={setFilters} />

      <main className="flex-1 min-w-0">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-12 text-base-content/50">
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm mt-1">Run the crawler to fetch listings, or adjust your filters.</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="space-y-6">

            {/* Results bar with sort */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-base-content/60">
                {total.toLocaleString()} listings
                {dbTotal > 0 && total !== dbTotal && (
                  <span className="text-base-content/40"> · filtered from {dbTotal.toLocaleString()} total in database</span>
                )}
                {jobs.length < total && (
                  <span className="text-base-content/40"> · showing {jobs.length.toLocaleString()}</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/50">Sort:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="select select-bordered select-xs border-base-300"
                >
                  <option value="relevance_score">Highest Score</option>
                  <option value="ai_fit_score">AI Fit</option>
                  <option value="posted_date">Date posted</option>
                </select>
              </div>
            </div>

            {topMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-semibold text-base-content">Top Matches</h2>
                  <span className="badge badge-sm badge-ghost text-base-content/60">{topMatches.length}</span>
                </div>
                <div className="space-y-3">
                  {topMatches.map((job) => (
                    <div key={job.id as string} ref={(el) => { if (el) cardRefs.current.set(job.id as string, el); else cardRefs.current.delete(job.id as string); }}>
                      <JobCard
                        job={job as Parameters<typeof JobCard>[0]["job"]}
                        onStatusChange={handleStatusChange}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {goodMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4 mt-8">
                  <h2 className="text-sm font-semibold text-base-content">Good Matches</h2>
                  <span className="badge badge-sm badge-ghost text-base-content/60">{goodMatches.length}</span>
                </div>
                <div className="space-y-3">
                  {goodMatches.map((job) => (
                    <div key={job.id as string} ref={(el) => { if (el) cardRefs.current.set(job.id as string, el); else cardRefs.current.delete(job.id as string); }}>
                      <JobCard
                        job={job as Parameters<typeof JobCard>[0]["job"]}
                        onStatusChange={handleStatusChange}
                        onBookmark={handleBookmark}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}


            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-4 text-center">
              {loadingMore && <span className="loading loading-spinner loading-sm text-base-content/40" />}
              {!hasMore && jobs.length > 0 && (
                <p className="text-xs text-base-content/30">All {total.toLocaleString()} listings loaded</p>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
