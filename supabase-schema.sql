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
  ai_highlights TEXT[]
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
