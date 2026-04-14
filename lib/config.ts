export interface SearchConfig {
  keywords: string[];
  seniorityTerms: string[];
  excludeTerms: string[];
  location: string;
  maxAgeDays: number;
  minRelevanceScore: number;
  agencyKeywords: string[];
  benefitsKeywords: string[];
  equityKeywords: string[];
  designSystemsKeywords: string[];
  aiKeywords: string[];
  companySizeSignals: {
    startup: string[];
    enterprise: string[];
  };
  salaryFloor: number;
  emailTo: string;
}

export const searchConfig: SearchConfig = {
  keywords: [
    "ux designer",
    "product designer",
    "design technologist",
    "senior designer",
    "staff designer",
    "experience designer",
    "ui/ux designer",
    "design lead",
    "creative technologist",
  ],
  seniorityTerms: ["senior", "staff", "lead", "principal"],
  excludeTerms: ["intern", "junior", "entry-level", "entry level", "engineer"],
  location: "remote",
  maxAgeDays: 30,
  minRelevanceScore: 0,

  agencyKeywords: [
    "agency",
    "consultancy",
    "consulting",
    "staffing",
    "contract-to-hire",
    "freelance marketplace",
  ],
  benefitsKeywords: [
    "health insurance",
    "dental",
    "vision",
    "401k",
    "401(k)",
    "pto",
    "paid time off",
    "parental leave",
    "wellness",
    "learning budget",
    "professional development",
  ],
  equityKeywords: ["equity", "stock options", "rsu", "rsus", "shares", "espp"],
  designSystemsKeywords: [
    "design system",
    "design tokens",
    "component library",
    "figma",
    "storybook",
    "pattern library",
  ],
  aiKeywords: [
    "ai",
    "artificial intelligence",
    "llm",
    "machine learning",
    "generative ai",
    "copilot",
    "ai-powered",
  ],
  companySizeSignals: {
    startup: ["seed", "series a", "series b", "early-stage", "startup"],
    enterprise: ["fortune 500", "enterprise", "global team", "10,000+"],
  },

  salaryFloor: 140_000,
  emailTo: "tedpotter23@gmail.com",
};

export const salaryEstimates: Record<string, Record<string, string>> = {
  senior: {
    startup: "$120K–$160K",
    midsize: "$135K–$170K",
    enterprise: "$145K–$185K",
    unknown: "$130K–$170K",
  },
  staff: {
    startup: "$150K–$190K",
    midsize: "$165K–$200K",
    enterprise: "$175K–$220K",
    unknown: "$155K–$200K",
  },
  lead: {
    startup: "$140K–$180K",
    midsize: "$155K–$190K",
    enterprise: "$165K–$210K",
    unknown: "$150K–$190K",
  },
  default: {
    startup: "$110K–$150K",
    midsize: "$125K–$165K",
    enterprise: "$135K–$175K",
    unknown: "$120K–$160K",
  },
};
