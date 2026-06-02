import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { Resend } from "resend";
import { searchConfig } from "../lib/config";

const DATA_DIR = path.join(process.cwd(), "lib", "crawler", "sources", "data");
const UPSTREAM_BASE =
  "https://raw.githubusercontent.com/Feashliaa/job-board-aggregator/main/data";

interface CompanyEntry {
  slug: string;
  name: string;
}

interface WorkdayEntry extends CompanyEntry {
  instance: string;
  site: string;
}

interface SyncResult {
  platform: string;
  added: number;
  totalAfter: number;
  error?: string;
}

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function fetchUpstream(filename: string): Promise<string[]> {
  const url = `${UPSTREAM_BASE}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error(`Upstream ${filename} not an array`);
  return json.map(String);
}

function loadLocal<T extends CompanyEntry>(filename: string): T[] {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T[];
  } catch {
    return [];
  }
}

function saveLocal(filename: string, data: unknown[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = path.join(DATA_DIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/**
 * Sync a simple slug-array source.
 * Merges upstream slugs into local file, preserving existing names.
 */
async function syncSlugSource(filename: string, platform: string): Promise<SyncResult> {
  try {
    const upstream = await fetchUpstream(filename);
    const local = loadLocal<CompanyEntry>(filename);
    const existingSlugs = new Set(local.map((c) => c.slug.toLowerCase()));

    const additions: CompanyEntry[] = [];
    for (const slug of upstream) {
      const norm = slug.toLowerCase().trim();
      if (!norm || existingSlugs.has(norm)) continue;
      additions.push({ slug: norm, name: titleCase(norm) });
      existingSlugs.add(norm);
    }

    const merged = [...local, ...additions].sort((a, b) =>
      a.slug.localeCompare(b.slug)
    );
    saveLocal(filename, merged);

    return { platform, added: additions.length, totalAfter: merged.length };
  } catch (err) {
    return {
      platform,
      added: 0,
      totalAfter: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Workday upstream is pipe-delimited: `org|instance|site`.
 * Local format is { slug, name, instance, site }.
 */
async function syncWorkday(): Promise<SyncResult> {
  try {
    const upstream = await fetchUpstream("workday_companies.json");
    const local = loadLocal<WorkdayEntry>("workday_companies.json");
    // Dedup key combines all three since a single org can have multiple sites
    const existingKeys = new Set(
      local.map((c) => `${c.slug}|${c.instance}|${c.site}`.toLowerCase())
    );

    const additions: WorkdayEntry[] = [];
    for (const line of upstream) {
      const parts = line.split("|");
      if (parts.length !== 3) continue;
      const [slug, instance, site] = parts.map((p) => p.trim().toLowerCase());
      if (!slug || !instance || !site) continue;
      const key = `${slug}|${instance}|${site}`;
      if (existingKeys.has(key)) continue;
      additions.push({ slug, name: titleCase(slug), instance, site });
      existingKeys.add(key);
    }

    const merged = [...local, ...additions].sort((a, b) => a.slug.localeCompare(b.slug));
    saveLocal("workday_companies.json", merged);

    return { platform: "workday", added: additions.length, totalAfter: merged.length };
  } catch (err) {
    return {
      platform: "workday",
      added: 0,
      totalAfter: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendReport(results: SyncResult[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = searchConfig.emailTo || process.env.EMAIL_TO;
  if (!apiKey || !to) {
    console.warn("Skipping email: RESEND_API_KEY or EMAIL_TO not set");
    return;
  }

  const anyErrors = results.some((r) => r.error);
  const lines = results.map((r) => {
    if (r.error) return `  ${r.platform.padEnd(12)} FAILED — ${r.error}`;
    if (r.added === 0) return `  ${r.platform.padEnd(12)} No new companies (${r.totalAfter} total)`;
    return `  ${r.platform.padEnd(12)} +${r.added} new (${r.totalAfter} total)`;
  });

  const subject = anyErrors
    ? "[Job Crawler] Weekly Company Sync — errors"
    : "[Job Crawler] Weekly Company Sync Complete";

  const body = `Weekly company-list sync ran at ${new Date().toISOString()}.\n\n${lines.join("\n")}\n`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Job Crawler <onboarding@resend.dev>",
    to,
    subject,
    text: body,
  });
  if (error) {
    console.error("Resend failed:", error);
  } else {
    console.log(`Email sent to ${to}`);
  }
}

async function main(): Promise<void> {
  console.log("=== Weekly Company Sync ===");
  console.log(new Date().toISOString());

  const results: SyncResult[] = [];
  results.push(await syncSlugSource("ashby_companies.json", "ashby"));
  results.push(await syncSlugSource("greenhouse_companies.json", "greenhouse"));
  results.push(await syncSlugSource("lever_companies.json", "lever"));
  results.push(await syncSlugSource("bamboohr_companies.json", "bamboohr"));
  results.push(await syncSlugSource("icims_companies.json", "icims"));
  results.push(await syncWorkday());

  console.log("\nResults:");
  for (const r of results) {
    if (r.error) console.log(`  ${r.platform}: FAILED — ${r.error}`);
    else console.log(`  ${r.platform}: +${r.added} (total ${r.totalAfter})`);
  }

  await sendReport(results);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
