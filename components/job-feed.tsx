"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { JobCard } from "./job-card";
import { JobCardSkeleton } from "./job-card-skeleton";
import { FilterSidebar, Filters, DEFAULT_FILTERS, activeFilterCount } from "./filter-sidebar";
import { useIsDemo } from "./session-provider";
import { Select } from "@/components/ui/input";

const FILTERS_STORAGE_KEY = "job-crawler:filters:v1";

function loadStoredFilters(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    // Merge with defaults so new filter fields work for users with old saved state
    return { ...DEFAULT_FILTERS, ...parsed };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function JobFeed() {
  const isDemo = useIsDemo();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  // Restore filters from localStorage on first client render
  useEffect(() => {
    setFilters(loadStoredFilters());
    setFiltersHydrated(true);
  }, []);

  // Persist filters whenever they change (after hydration)
  useEffect(() => {
    if (!filtersHydrated) return;
    try {
      window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // localStorage can throw in private-mode/quota situations; ignore
    }
  }, [filters, filtersHydrated]);

  function buildParams(f: Filters, off: number) {
    const params = new URLSearchParams({
      minScore: String(f.minScore),
      sortBy: f.sortBy,
      offset: String(off),
    });
    if (f.remote) params.set("remote", "true");
    if (f.localPhoenix) params.set("localPhoenix", "true");
    if (f.hybrid) params.set("hybrid", "true");
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

  // Refetch on filter change — but wait until localStorage has been read
  // so we don't fire one request with defaults and another with stored filters
  useEffect(() => {
    if (!filtersHydrated) return;
    fetchInitial(filters);
  }, [filters, fetchInitial, filtersHydrated]);

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
    if (isDemo) return;
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
    } else if (status === "hidden" || status === "not_interested" || status === "passed" || status === "zombie_listing") {
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
    if (isDemo) return;
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

  // Unambiguous Phoenix terms — match anywhere in location
  const PHOENIX_UNAMBIGUOUS = ["phoenix", "scottsdale", "tempe", "arizona", ", az", "(az)", " az "];
  // Ambiguous city names shared with other states — only match if AZ context also present
  const PHOENIX_AMBIGUOUS = ["mesa", "chandler", "gilbert", "glendale", "peoria", "surprise"];
  const HIDDEN_STATUSES = new Set(["not_interested", "applied", "hidden", "passed", "zombie_listing"]);

  const visibleJobs = (jobs as Record<string, unknown>[]).filter((j) => {
    const ua = j.user_actions;
    const status = Array.isArray(ua)
      ? (ua[0] as Record<string, unknown> | undefined)?.status
      : (ua as Record<string, unknown> | null)?.status;
    if (HIDDEN_STATUSES.has(status as string)) return false;
    const loc = ((j.location as string) ?? "").toLowerCase();
    const desc = ((j.description as string) ?? "").toLowerCase();
    if (filters.localPhoenix) {
      const hasAZContext = PHOENIX_UNAMBIGUOUS.some(t => loc.includes(t));
      const hasAmbiguousWithAZ = PHOENIX_AMBIGUOUS.some(t => loc.includes(t)) && (loc.includes("az") || loc.includes("arizona"));
      if (!hasAZContext && !hasAmbiguousWithAZ) return false;
    }
    if (filters.hybrid) {
      const isHybrid = loc.includes("hybrid") || desc.includes("hybrid");
      if (!isHybrid) return false;
    }
    return true;
  });
  const topMatches = visibleJobs.filter((j) => (j.relevance_score as number ?? 0) >= 70);
  const goodMatches = visibleJobs.filter((j) => {
    const s = j.relevance_score as number ?? 0;
    return s >= 40 && s < 70;
  });

  const activeCount = activeFilterCount(filters);

  return (
    <div className="flex lg:gap-8">
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />

      <main className="flex-1 min-w-0">
        {/* Mobile filter toggle (only visible <lg) */}
        <div className="lg:hidden mb-5 flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] text-white/85 text-[13px] font-semibold tracking-[0.04em] transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-[rgba(251,146,60,.85)] text-white">
                {activeCount}
              </span>
            )}
          </button>
          {activeCount > 0 && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/45 hover:text-[rgba(251,146,60,.95)] transition-colors px-2"
            >
              Reset
            </button>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="glass rounded-xl border-[rgba(255,80,80,.3)] bg-[rgba(255,80,80,.08)] text-[rgba(255,180,180,.95)] px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="glass rounded-2xl text-center py-16 px-6">
            <p className="font-serif text-[24px] text-white/85 mb-2">No listings found</p>
            <p className="text-sm text-white/45">Run the crawler to fetch listings, or adjust your filters.</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="space-y-8">

            {/* Results bar with sort */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-[13px] text-white/55">
                <span className="text-white/85 font-semibold">{visibleJobs.length.toLocaleString()}</span> listings
                {dbTotal > 0 && total !== dbTotal && (
                  <span className="text-white/35"> · filtered from {dbTotal.toLocaleString()} total in database</span>
                )}
                {visibleJobs.length < (jobs as unknown[]).length && (
                  <span className="text-white/35"> · from {(jobs as unknown[]).length.toLocaleString()} loaded</span>
                )}
              </p>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/40">Sort</span>
                <Select
                  value={filters.sortBy}
                  size="xs"
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <option value="relevance_score">Highest Score</option>
                  <option value="ai_fit_score">AI Fit</option>
                  <option value="posted_date">Date posted</option>
                </Select>
              </div>
            </div>

            {topMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="eyebrow !text-[rgba(56,189,248,.85)] !text-[12px]">
                    <span style={{ background: "rgba(56,189,248,.5)", width: 18, height: 1, display: "inline-block" }} />
                    Top Matches
                  </span>
                  <span className="text-[12px] font-semibold text-white/40 tabular-nums">
                    {topMatches.length}
                  </span>
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
                <div className="flex items-center gap-3 mb-5 mt-10">
                  <span className="eyebrow !text-[12px]">Good Matches</span>
                  <span className="text-[12px] font-semibold text-white/40 tabular-nums">
                    {goodMatches.length}
                  </span>
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
            <div ref={sentinelRef} className="py-6 text-center">
              {loadingMore && (
                <span className="inline-block w-5 h-5 rounded-full border-2 border-white/15 border-t-[rgba(56,189,248,.7)] animate-spin" />
              )}
              {!hasMore && jobs.length > 0 && (
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/25">
                  All {total.toLocaleString()} listings loaded
                </p>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
