export interface JobListing {
  // Core fields
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  salary?: string;
  postedDate?: string;
  description?: string;
  relevanceScore?: number;
  firstSeen: string;

  // Classification fields
  benefits?: string[];
  hasEquity?: boolean;
  companySize?: "startup" | "midsize" | "enterprise" | "unknown";
  isAgency?: boolean;
  roleType?: "ic" | "management" | "hybrid" | "unknown";
  mentionsAI?: boolean;
  mentionsDesignSystems?: boolean;
  hasSalaryInfo?: boolean;
  hasBenefitsInfo?: boolean;
  daysOld?: number;

  // Salary estimation
  estimatedSalary?: string;
  salarySource?: "listed" | "estimated" | "unknown";
  salaryBelowFloor?: boolean;

  // Company reputation
  companyRating?: number;
  companyWorkLifeBalance?: number;
  companyGrowthTrend?: "growing" | "stable" | "shrinking" | "unknown";
  companyHeadcount?: number;
  companyRedFlags?: string[];
  companyReputationSource?: string;
  companyReputationAvailable?: boolean;

  // AI ranking
  aiFitScore?: number;
  aiFitSummary?: string;
  aiSkillGaps?: string[];
  aiHighlights?: string[];
  aiDescriptionSummary?: string;
}

export interface JobSource {
  name: string;
  fetch(config: import("../config").SearchConfig): Promise<JobListing[]>;
}

export interface CompanyReputation {
  rating?: number;
  workLifeBalance?: number;
  growthTrend: "growing" | "stable" | "shrinking" | "unknown";
  headcount?: number;
  redFlags: string[];
  source: string;
}
