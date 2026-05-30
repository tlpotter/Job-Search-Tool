"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Login failed");
      }
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient gradient blobs (echoes portfolio's space vibe) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.15] blur-[100px]"
        style={{ background: "radial-gradient(circle, #fb923c, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[120px]"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }}
      />

      <GlassCard radius="xl" className="relative z-10 w-full max-w-md p-10">
        <div className="eyebrow mb-3">Sign in</div>
        <h1 className="serif-heading text-[32px] mb-2">
          UX Job <em>Crawler</em>
        </h1>
        <p className="text-white/55 text-[15px] mb-8 leading-relaxed">
          Senior &amp; Staff UX / Product Designer roles
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-bold tracking-[0.12em] uppercase text-white/50 mb-2"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold tracking-[0.12em] uppercase text-white/50 mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-[rgba(255,80,80,.08)] border border-[rgba(255,80,80,.25)] text-[rgba(255,180,180,.95)] rounded-[10px] px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in…" : "Sign in →"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-white/40 text-center leading-relaxed">
            Demo access available on request — read-only view of the live data.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
