"use client";

import { useRouter } from "next/navigation";
import { useSession } from "./session-provider";

export function AppHeader() {
  const session = useSession();
  const router = useRouter();
  const isDemo = session?.role === "demo";

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {isDemo && (
        <div className="bg-warning/20 border-b border-warning/30 text-warning-content px-6 py-2 text-xs text-center font-medium">
          Demo mode — read only. Status changes, bookmarks, and notes are disabled.
        </div>
      )}
      <div className="navbar bg-base-100 border-b border-base-300 px-6">
        <div className="navbar-start">
          <span className="text-base font-semibold">UX Job Crawler</span>
          <span className="mx-3 text-base-content/20">·</span>
          <span className="text-sm text-base-content/50">Senior &amp; Staff UX / Product Designer</span>
        </div>
        <div className="navbar-end gap-2">
          <a href="/" className="btn btn-ghost btn-sm font-medium">Feed</a>
          <a href="/tracker" className="btn btn-ghost btn-sm text-base-content/60">Tracker</a>
          {session && (
            <>
              <span className="text-xs text-base-content/40 mx-2 hidden sm:inline">{session.email}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm text-base-content/60">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
