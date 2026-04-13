import { JobListing } from "./types";
import { searchConfig } from "../config";

function detectCompanySize(desc: string): JobListing["companySize"] {
  const lower = desc.toLowerCase();
  if (searchConfig.companySizeSignals.startup.some((k) => lower.includes(k))) return "startup";
  if (searchConfig.companySizeSignals.enterprise.some((k) => lower.includes(k))) return "enterprise";
  if (lower.includes("midsize") || lower.includes("mid-size") || lower.includes("mid size")) return "midsize";
  return "unknown";
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const posted = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
}

export function classifyListing(job: JobListing): JobListing {
  const desc = ((job.description ?? "") + " " + job.title).toLowerCase();

  const companyLower = job.company.toLowerCase();
  const urlLower = (job.url ?? "").toLowerCase();
  const agencyCompanyTerms = ["recruiting", "staffing", "talent", "search group", "search firm", "placement", "headhunt", "executive search"];
  const agencyDomains = ["recruiterflow.com", "loxo.co", "crelate.com", "bullhorn.com", "workable.com/jobs/r/"];
  job.isAgency =
    searchConfig.agencyKeywords.some((k) => desc.includes(k)) ||
    agencyCompanyTerms.some((k) => companyLower.includes(k)) ||
    agencyDomains.some((d) => urlLower.includes(d));
  job.hasEquity = searchConfig.equityKeywords.some((k) => desc.includes(k));
  job.hasBenefitsInfo = searchConfig.benefitsKeywords.some((k) => desc.includes(k));
  job.mentionsDesignSystems = searchConfig.designSystemsKeywords.some((k) => desc.includes(k));
  job.mentionsAI = searchConfig.aiKeywords.some((k) => desc.includes(k));
  job.hasSalaryInfo = /\$[\d,]+/.test(desc) || /salary/i.test(desc);

  if (desc.includes("manage") || desc.includes("direct reports") || desc.includes("people manager")) {
    job.roleType = "management";
  } else if (desc.includes("individual contributor") || desc.includes(" ic ") || desc.includes("no direct reports")) {
    job.roleType = "ic";
  } else {
    job.roleType = "unknown";
  }

  job.companySize = detectCompanySize(desc);
  job.daysOld = daysSince(job.postedDate);

  if (job.hasBenefitsInfo) {
    job.benefits = searchConfig.benefitsKeywords.filter((k) => desc.includes(k));
  }

  return job;
}
