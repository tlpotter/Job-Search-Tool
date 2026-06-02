"use client";

import { useEffect } from "react";
import { Select } from "@/components/ui/input";

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

/** Number of filters set to something other than the default. Excludes sortBy. */
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.minScore !== DEFAULT_FILTERS.minScore) n++;
  if (f.minAiScore !== DEFAULT_FILTERS.minAiScore) n++;
  if (f.remote) n++;
  if (f.localPhoenix) n++;
  if (f.hybrid) n++;
  if (f.hasEquity) n++;
  if (f.hasBenefits) n++;
  if (f.hasSalary) n++;
  if (f.designSystems) n++;
  if (f.mentionsAI) n++;
  if (f.hideAgencies) n++;
  if (f.aiScoredOnly) n++;
  if (f.goodReputationOnly) n++;
  if (f.postedWithin) n++;
  if (f.companySize) n++;
  if (f.roleType) n++;
  if (f.source) n++;
  return n;
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Mobile drawer open state */
  mobileOpen?: boolean;
  /** Called when the user closes the mobile drawer */
  onMobileClose?: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-white/45">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FilterToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group select-none"
    >
      <span
        className={[
          "w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all duration-200",
          "border",
          checked
            ? "bg-[rgba(251,146,60,.85)] border-[rgba(251,146,60,1)] shadow-[0_0_12px_rgba(251,146,60,.4)]"
            : "bg-white/[0.04] border-white/[0.15] group-hover:border-white/30",
        ].join(" ")}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
            <path
              d="M2.5 6l2.5 2.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={[
          "text-[13px] transition-colors duration-200",
          checked ? "text-white" : "text-white/65 group-hover:text-white/90",
        ].join(" ")}
      >
        {label}
      </span>
    </label>
  );
}

function Range({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative pt-1 pb-2">
      <div
        className="h-[3px] rounded-full bg-white/[0.08] relative overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(251,146,60,.7), rgba(56,189,248,.7))",
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute top-[2px] w-3 h-3 rounded-full -translate-x-1/2 pointer-events-none"
        style={{
          left: `${pct}%`,
          background: "#fff",
          boxShadow: "0 0 12px rgba(56,189,248,.6), 0 0 0 2px rgba(2,6,8,1)",
        }}
      />
    </div>
  );
}

export function FilterSidebar({
  filters,
  onChange,
  mobileOpen = false,
  onMobileClose,
}: FilterSidebarProps) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  // Lock background scroll while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  const body = (
    <>
      <Section title={`Min score: ${filters.minScore}`}>
        <Range
          value={filters.minScore}
          onChange={(n) => update("minScore", n)}
        />
      </Section>

      <Section title={`Min AI fit: ${filters.minAiScore > 0 ? filters.minAiScore : "any"}`}>
        <Range
          value={filters.minAiScore}
          onChange={(n) => update("minAiScore", n)}
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
        <Select value={filters.postedWithin} size="sm" onChange={(e) => update("postedWithin", e.target.value)} className="w-full">
          <option value="">Any time</option>
          <option value="3">Last 3 days</option>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </Select>
      </Section>

      <Section title="Role type">
        <Select value={filters.roleType} size="sm" onChange={(e) => update("roleType", e.target.value)} className="w-full">
          <option value="">All types</option>
          <option value="ic">Individual Contributor</option>
          <option value="management">Management</option>
        </Select>
      </Section>

      <Section title="Company size">
        <Select value={filters.companySize} size="sm" onChange={(e) => update("companySize", e.target.value)} className="w-full">
          <option value="">All sizes</option>
          <option value="startup">Startup</option>
          <option value="midsize">Midsize</option>
          <option value="enterprise">Enterprise</option>
        </Select>
      </Section>

      <Section title="Source">
        <Select value={filters.source} size="sm" onChange={(e) => update("source", e.target.value)} className="w-full">
          <option value="">All sources</option>
          <option value="adzuna">Adzuna</option>
          <option value="jsearch">JSearch</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="bamboohr">BambooHR</option>
          <option value="workday">Workday</option>
          <option value="remoteok">Remote OK</option>
          <option value="weworkremotely">We Work Remotely</option>
          <option value="jobicy">Jobicy</option>
        </Select>
      </Section>

      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 hover:text-[rgba(251,146,60,.95)] transition-colors duration-300 py-2"
      >
        Reset filters
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — visible only at lg+ */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col space-y-7 sticky top-24 self-start">
        {body}
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-[60] transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
        role="dialog"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        {/* Panel */}
        <div
          className={[
            "absolute inset-y-0 left-0 w-[88%] max-w-[340px] overflow-y-auto",
            "bg-[#060a0f] border-r border-white/[0.08]",
            "transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-[#060a0f] z-10">
            <div className="eyebrow">Filters</div>
            <button
              onClick={onMobileClose}
              className="w-8 h-8 rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] inline-flex items-center justify-center transition-colors"
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-6 space-y-7">{body}</div>
        </div>
      </div>
    </>
  );
}
