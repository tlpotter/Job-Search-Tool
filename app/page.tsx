import { JobFeed } from "@/components/job-feed";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 border-b border-base-300 px-6">
        <div className="navbar-start">
          <span className="text-base font-semibold">UX Job Crawler</span>
          <span className="mx-3 text-base-content/20">·</span>
          <span className="text-sm text-base-content/50">Senior & Staff UX / Product Designer</span>
        </div>
        <div className="navbar-end gap-2">
          <a href="/" className="btn btn-ghost btn-sm font-medium">Feed</a>
          <a href="/tracker" className="btn btn-ghost btn-sm text-base-content/60">Tracker</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <JobFeed />
      </div>
    </div>
  );
}
