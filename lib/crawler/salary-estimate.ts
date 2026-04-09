import { JobListing } from "./types";
import { salaryEstimates } from "../config";

function detectSeniority(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("staff")) return "staff";
  if (lower.includes("lead")) return "lead";
  if (lower.includes("senior") || lower.includes("sr.") || lower.includes("sr ")) return "senior";
  return "default";
}

export function parseSalaryMax(salaryStr?: string): number {
  if (!salaryStr) return 0;
  const matches = salaryStr.match(/\$?([\d,]+)/g);
  if (!matches || matches.length === 0) return 0;
  const values = matches.map((m) => parseInt(m.replace(/[$,]/g, ""), 10)).filter((n) => !isNaN(n));
  if (values.length === 0) return 0;
  // If values look like thousands (e.g. 160 instead of 160000)
  const max = Math.max(...values);
  return max < 1000 ? max * 1000 : max;
}

export function estimateSalary(job: JobListing): JobListing {
  const SALARY_FLOOR = 140_000;

  if (job.hasSalaryInfo && job.salary) {
    job.salarySource = "listed";
    job.salaryBelowFloor = parseSalaryMax(job.salary) < SALARY_FLOOR;
    return job;
  }

  const seniority = detectSeniority(job.title);
  const size = job.companySize ?? "unknown";
  job.estimatedSalary = salaryEstimates[seniority]?.[size] ?? salaryEstimates["default"][size];
  job.salarySource = "estimated";
  job.salaryBelowFloor = parseSalaryMax(job.estimatedSalary) < SALARY_FLOOR;

  return job;
}
