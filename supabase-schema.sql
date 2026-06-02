-- Run this in Supabase SQL editor to create the database schema

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  remote BOOLEAN DEFAULT false,
  url TEXT NOT NULL,
  salary TEXT,
  posted_date DATE,
  description TEXT,
  relevance_score INTEGER,
  first_seen DATE NOT NULL,
  benefits TEXT[],
  has_equity BOOLEAN DEFAULT false,
  company_size TEXT,
  is_agency BOOLEAN DEFAULT false,
  role_type TEXT,
  mentions_ai BOOLEAN DEFAULT false,
  mentions_design_systems BOOLEAN DEFAULT false,
  has_salary_info BOOLEAN DEFAULT false,
  has_benefits_info BOOLEAN DEFAULT false,
  days_old INTEGER,

  -- Salary estimation
  estimated_salary TEXT,
  salary_source TEXT DEFAULT 'unknown',
  salary_below_floor BOOLEAN DEFAULT false,

  -- Company reputation
  company_rating REAL,
  company_wlb REAL,
  company_growth_trend TEXT DEFAULT 'unknown',
  company_headcount INTEGER,
  company_red_flags TEXT[],
  company_reputation_source TEXT,
  company_reputation_available BOOLEAN DEFAULT false,

  -- AI ranking
  ai_fit_score INTEGER,
  ai_fit_summary TEXT,
  ai_skill_gaps TEXT[],
  ai_highlights TEXT[],
  ai_description_summary TEXT,

  -- AI sub-scores (0-100 each). Weighted total becomes ai_fit_score.
  -- Weights: role 35%, company 25%, comp 15%, industry 15%, growth 10%.
  ai_score_role INTEGER,
  ai_score_company INTEGER,
  ai_score_comp INTEGER,
  ai_score_industry INTEGER,
  ai_score_growth INTEGER
);

CREATE TABLE IF NOT EXISTS user_actions (
  listing_id TEXT REFERENCES listings(id),
  status TEXT DEFAULT 'not_reviewed',
  bookmarked BOOLEAN DEFAULT false,
  notes TEXT,
  status_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_score ON listings(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted ON listings(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_user_actions_status ON user_actions(status);

-- ATS slug health: tracks 404 history per (platform, slug) so the crawler
-- can skip dead boards instead of re-hitting them daily.
-- Behavior:
--   200 from board                  -> active, consecutive_404s = 0, retry tomorrow
--   404 (1st-2nd consecutive)       -> active, retry tomorrow
--   404 (3rd consecutive)           -> cooldown, retry in 7 days
--   404 after cooldown retry        -> dormant, retry in 30 days
--   404 while dormant               -> dormant, retry in 30 more days
--   5xx / network errors            -> no state change (transient)
CREATE TABLE IF NOT EXISTS ats_slug_health (
  platform TEXT NOT NULL,
  slug TEXT NOT NULL,
  consecutive_404s INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  PRIMARY KEY (platform, slug)
);

CREATE INDEX IF NOT EXISTS idx_ats_health_next_attempt ON ats_slug_health(platform, next_attempt_at);
