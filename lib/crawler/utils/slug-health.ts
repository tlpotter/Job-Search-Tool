import { supabase } from "../../supabase";

export type FetchOutcome = "success" | "not_found" | "transient";

interface HealthRecord {
  platform: string;
  slug: string;
  consecutive_404s: number;
  last_attempted_at: string | null;
  next_attempt_at: string | null;
  status: "active" | "cooldown" | "dormant";
}

const DAY_MS = 86_400_000;
const COOLDOWN_DAYS = 7;
const DORMANT_DAYS = 30;
const COOLDOWN_AFTER_HITS = 3;

/**
 * Per-source health tracker. One instance per ATS source per crawl run.
 *
 * Usage:
 *   const health = new SlugHealth("ashby");
 *   await health.load();
 *   const active = companies.filter((c) => health.shouldAttempt(c.slug));
 *   // ... fetch each one ...
 *   health.record(slug, "success" | "not_found" | "transient");
 *   await health.flush();
 *   console.log(health.summary(companies.length, active.length));
 */
export class SlugHealth {
  private platform: string;
  private records: Map<string, HealthRecord> = new Map();
  private pending: Array<{ slug: string; outcome: FetchOutcome }> = [];
  private tableAvailable = true;

  constructor(platform: string) {
    this.platform = platform;
  }

  async load(): Promise<void> {
    const { data, error } = await supabase
      .from("ats_slug_health")
      .select("*")
      .eq("platform", this.platform);
    if (error) {
      console.warn(
        `  ${this.platform} health: table unavailable (${error.message}) — treating all slugs as active`
      );
      this.tableAvailable = false;
      return;
    }
    for (const r of data ?? []) {
      this.records.set(r.slug, r as HealthRecord);
    }
  }

  /** Should we crawl this slug on this run? */
  shouldAttempt(slug: string): boolean {
    const r = this.records.get(slug);
    if (!r) return true; // never tried
    if (!r.next_attempt_at) return true;
    return new Date(r.next_attempt_at).getTime() <= Date.now();
  }

  record(slug: string, outcome: FetchOutcome): void {
    this.pending.push({ slug, outcome });
  }

  async flush(): Promise<void> {
    if (!this.tableAvailable || this.pending.length === 0) return;
    const now = new Date();
    const updates: HealthRecord[] = [];

    for (const { slug, outcome } of this.pending) {
      if (outcome === "transient") continue; // network blip — don't change state
      const existing = this.records.get(slug);
      let counter = existing?.consecutive_404s ?? 0;
      let status: HealthRecord["status"] = "active";
      let next: Date;

      if (outcome === "success") {
        counter = 0;
        status = "active";
        next = new Date(now.getTime() + DAY_MS); // try again tomorrow
      } else {
        counter += 1;
        if (existing?.status === "dormant" || existing?.status === "cooldown") {
          // We just retested after a cooldown or dormant window and it 404'd again
          status = "dormant";
          next = new Date(now.getTime() + DORMANT_DAYS * DAY_MS);
        } else if (counter >= COOLDOWN_AFTER_HITS) {
          status = "cooldown";
          next = new Date(now.getTime() + COOLDOWN_DAYS * DAY_MS);
        } else {
          status = "active";
          next = new Date(now.getTime() + DAY_MS);
        }
      }

      updates.push({
        platform: this.platform,
        slug,
        consecutive_404s: counter,
        last_attempted_at: now.toISOString(),
        next_attempt_at: next.toISOString(),
        status,
      });
    }

    for (let i = 0; i < updates.length; i += 500) {
      const chunk = updates.slice(i, i + 500);
      const { error } = await supabase
        .from("ats_slug_health")
        .upsert(chunk, { onConflict: "platform,slug" });
      if (error) {
        console.warn(`  ${this.platform} health: upsert failed: ${error.message}`);
        return;
      }
    }
    this.pending = [];
  }

  /** Counts for a summary log line at the end of a source run. */
  summary(totalCompanies: number, attempted: number, listings: number): string {
    let cooldown = 0;
    let dormant = 0;
    for (const r of this.records.values()) {
      if (r.status === "cooldown") cooldown++;
      else if (r.status === "dormant") dormant++;
    }
    const skipped = totalCompanies - attempted;
    return `${this.platform}: ${listings} listings (${attempted}/${totalCompanies} attempted, ${skipped} skipped: ${cooldown} cooldown + ${dormant} dormant)`;
  }
}
