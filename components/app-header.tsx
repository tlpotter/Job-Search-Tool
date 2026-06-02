"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "./session-provider";

export function AppHeader() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isDemo = session?.role === "demo";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinkClass = (active: boolean) =>
    [
      "text-[13px] sm:text-[15px] font-medium tracking-[0.06em] transition-colors duration-300 whitespace-nowrap",
      active ? "text-white" : "text-white/40 hover:text-[rgba(251,146,60,.95)]",
    ].join(" ");

  return (
    <>
      {isDemo && (
        <div
          className="sticky top-0 z-50 bg-[rgba(251,146,60,.12)] border-b border-[rgba(251,146,60,.25)] text-[rgba(251,180,100,.95)] px-6 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-center backdrop-blur-md"
        >
          Demo mode · Read only
        </div>
      )}
      <nav
        className={[
          "sticky top-0 z-40 transition-opacity duration-[400ms] ease-out",
          "px-4 sm:px-6 md:px-10 py-3.5 sm:py-5",
          "bg-[linear-gradient(to_bottom,rgba(6,10,15,.92),transparent)]",
          "backdrop-blur-md",
          scrolled ? "opacity-[0.55] hover:opacity-100" : "opacity-100",
        ].join(" ")}
      >
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
          <Link
            href="/"
            className="font-serif text-[17px] sm:text-[20px] font-semibold italic tracking-tight shrink-0"
            style={{
              background:
                "linear-gradient(90deg, #fb923c 0%, #38bdf8 40%, #ffffff 40%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            UX Job Crawler
          </Link>

          <ul className="flex items-center gap-4 sm:gap-8 list-none">
            <li>
              <Link href="/" className={navLinkClass(pathname === "/")}>
                Feed
              </Link>
            </li>
            <li>
              <Link href="/tracker" className={navLinkClass(pathname === "/tracker")}>
                Tracker
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-3 shrink-0">
            {session && (
              <>
                <span className="hidden lg:inline text-xs text-white/30 tracking-[0.04em]">
                  {session.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] sm:text-[12px] font-semibold tracking-[0.12em] uppercase text-white/40 hover:text-[rgba(251,146,60,.95)] transition-colors duration-300"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
