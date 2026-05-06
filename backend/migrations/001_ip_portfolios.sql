-- Migration for IP Portfolios and Analytics

CREATE TABLE IF NOT EXISTS public.saved_portfolios (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  name text not null,
  portfolio_uri text not null, -- Expected to be objstore://...
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_saved_portfolios_org
  ON public.saved_portfolios(organisation);

CREATE TABLE IF NOT EXISTS public.brand_scenarios (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.saved_portfolios(id) on delete cascade,
  scenario_name text not null,
  metrics jsonb, -- e.g. FTO Risk, Tech Coverage, Competitor Overlap
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_brand_scenarios_portfolio
  ON public.brand_scenarios(portfolio_id);

CREATE TABLE IF NOT EXISTS public.trademark_evaluations (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.saved_portfolios(id) on delete cascade,
  trademark_name text not null,
  evaluation_mode text not null default 'Standard', -- Standard or Verbose
  verdict text,
  reality_check_status text, -- e.g. compared to TMView database
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_trademark_evaluations_portfolio
  ON public.trademark_evaluations(portfolio_id);
