import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabase } from "../lib/supabase";
import { scoreListing } from "../lib/crawler/score";
import { classifyListing } from "../lib/crawler/classify";
import { JobListing } from "../lib/crawler/types";

const MIN_SCORE = 40; // only rescore listings worth reviewing

async function main() {
  const sb = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allData: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from("listings")
      .select("*")
      .gte("relevance_score", MIN_SCORE)
      .order("relevance_score", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); return; }
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`Rescoring ${allData.length} listings...\n`);
  const data = allData;

  let updated = 0;
  const BATCH = 20;

  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH);

    await Promise.all(batch.map(async (row: Record<string, unknown>) => {
      const job: JobListing = {
        id: row.id as string,
        source: row.source as string,
        title: row.title as string,
        company: row.company as string,
        location: row.location as string,
        remote: row.remote as boolean,
        url: row.url as string,
        description: row.description as string,
        salary: row.salary as string | undefined,
        estimatedSalary: row.estimated_salary as string | undefined,
        salarySource: row.salary_source as "listed" | "estimated" | "unknown" | undefined,
        salaryBelowFloor: row.salary_below_floor as boolean | undefined,
        hasSalaryInfo: !!row.salary,
        mentionsDesignSystems: row.mentions_design_systems as boolean | undefined,
        hasBenefitsInfo: row.has_benefits_info as boolean | undefined,
        hasEquity: row.has_equity as boolean | undefined,
        mentionsAI: row.mentions_ai as boolean | undefined,
        isAgency: row.is_agency as boolean | undefined,
        roleType: row.role_type as "unknown" | "ic" | "management" | "hybrid" | undefined,
        companyRating: row.company_rating as number | undefined,
        companyWorkLifeBalance: row.company_wlb as number | undefined,
        companyGrowthTrend: row.company_growth_trend as "unknown" | "growing" | "stable" | "shrinking" | undefined,
        companyRedFlags: row.company_red_flags as string[] | undefined,
        daysOld: row.posted_date
          ? Math.floor((Date.now() - new Date(row.posted_date as string).getTime()) / 86400000)
          : undefined,
        firstSeen: row.first_seen as string,
      };

      const scored = scoreListing(job);
      const newScore = scored.relevanceScore ?? 0;

      if (newScore !== row.relevance_score) {
        await sb.from("listings").update({ relevance_score: newScore }).eq("id", row.id);
        updated++;
      }
    }));

    process.stdout.write(`\r  ${Math.min(i + BATCH, data.length)}/${data.length} processed, ${updated} updated`);
  }

  console.log(`\n\nDone. ${updated} scores changed.`);
}

main();
