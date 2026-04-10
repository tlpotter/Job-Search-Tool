"use client";

import { Slider } from "@/components/ui/slider";

export interface Filters {
  minScore: number;
  remote: boolean;
  localPhoenix: boolean;
  hybrid: boolean;
  hasEquity: boolean;
  hasBenefits: boolean;
  hasSalary: boolean;
  designSystems: boolean;
  mentionsAI: boolean;
  hideAgencies: boolean;
  aiScoredOnly: boolean;
  goodReputationOnly: boolean;
  minAiScore: number;
  postedWithin: string;
  companySize: string;
  roleType: string;
  source: string;
  sortBy: string;
}

export const DEFAULT_FILTERS: Filters = {
  minScore: 40,
  remote: false,
  localPhoenix: false,
  hybrid: false,
  hasEquity: false,
  hasBenefits: false,
  hasSalary: false,
  designSystems: false,
  mentionsAI: false,
  hideAgencies: false,
  aiScoredOnly: false,
  goodReputationOnly: false,
  minAiScore: 0,
  postedWithin: "",
  companySize: "",
  roleType: "",
  source: "",
  sortBy: "relevance_score",
};

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-base-content/70 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function FilterToggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox checkbox-sm checkbox-primary rounded-none"
      />
      <span className="text-sm text-base-content/80 select-none">{label}</span>
    </label>
  );
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="w-56 shrink-0 space-y-6">

      <Section title={`Min score: ${filters.minScore}`}>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filters.minScore]}
          onValueChange={(vals) => update("minScore", Array.isArray(vals) ? vals[0] : vals)}
          className="w-full"
        />
      </Section>

      <Section title={`Min AI fit: ${filters.minAiScore > 0 ? filters.minAiScore : "any"}`}>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filters.minAiScore]}
          onValueChange={(vals) => update("minAiScore", Array.isArray(vals) ? vals[0] : vals)}
          className="w-full"
        />
      </Section>

      <Section title="Must have">
        <FilterToggle id="remote" label="Remote only" checked={filters.remote} onChange={(v) => update("remote", v)} />
        <FilterToggle id="localPhoenix" label="Local Phoenix AZ" checked={filters.localPhoenix} onChange={(v) => update("localPhoenix", v)} />
        <FilterToggle id="hybrid" label="Hybrid" checked={filters.hybrid} onChange={(v) => update("hybrid", v)} />
        <FilterToggle id="hasEquity" label="Equity / RSUs" checked={filters.hasEquity} onChange={(v) => update("hasEquity", v)} />
        <FilterToggle id="hasBenefits" label="Benefits info" checked={filters.hasBenefits} onChange={(v) => update("hasBenefits", v)} />
        <FilterToggle id="hasSalary" label="Salary listed" checked={filters.hasSalary} onChange={(v) => update("hasSalary", v)} />
        <FilterToggle id="designSystems" label="Design Systems" checked={filters.designSystems} onChange={(v) => update("designSystems", v)} />
        <FilterToggle id="mentionsAI" label="Mentions AI" checked={filters.mentionsAI} onChange={(v) => update("mentionsAI", v)} />
        <FilterToggle id="aiScoredOnly" label="AI scored only" checked={filters.aiScoredOnly} onChange={(v) => update("aiScoredOnly", v)} />
        <FilterToggle id="goodReputation" label="Good reputation" checked={filters.goodReputationOnly} onChange={(v) => update("goodReputationOnly", v)} />
        <FilterToggle id="hideAgencies" label="Hide agencies" checked={filters.hideAgencies} onChange={(v) => update("hideAgencies", v)} />
      </Section>

      <Section title="Posted within">
        <select
          value={filters.postedWithin}
          onChange={(e) => update("postedWithin", e.target.value)}
          className="select select-bordered select-sm w-full border-base-300"
        >
          <option value="">Any time</option>
          <option value="3">Last 3 days</option>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </Section>

      <Section title="Role type">
        <select
          value={filters.roleType}
          onChange={(e) => update("roleType", e.target.value)}
          className="select select-bordered select-sm w-full border-base-300"
        >
          <option value="">All types</option>
          <option value="ic">Individual Contributor</option>
          <option value="management">Management</option>
        </select>
      </Section>

      <Section title="Company size">
        <select
          value={filters.companySize}
          onChange={(e) => update("companySize", e.target.value)}
          className="select select-bordered select-sm w-full border-base-300"
        >
          <option value="">All sizes</option>
          <option value="startup">Startup</option>
          <option value="midsize">Midsize</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </Section>

      <Section title="Source">
        <select
          value={filters.source}
          onChange={(e) => update("source", e.target.value)}
          className="select select-bordered select-sm w-full border-base-300"
        >
          <option value="">All sources</option>
          <option value="adzuna">Adzuna</option>
          <option value="jsearch">JSearch</option>
          <option value="indeed">Indeed</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="dribbble">Dribbble</option>
          <option value="remoteok">Remote OK</option>
          <option value="weworkremotely">We Work Remotely</option>
          <option value="jobicy">Jobicy</option>
          <option value="remotive">Remotive</option>
          <option value="coroflot">Coroflot</option>
          <option value="hn-hiring">HN Who&apos;s Hiring</option>
        </select>
      </Section>

      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="btn btn-ghost btn-sm w-full text-base-content/60"
      >
        Reset filters
      </button>
    </aside>
  );
}
