-- HeyCommerce Acquisition OS — Supabase Schema
-- Run this in Supabase → SQL Editor

-- ──────────────────────────────────────────────
-- LEADS (from Typeform)
-- ──────────────────────────────────────────────
create table if not exists leads (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  typeform_response_id  text unique not null,
  nome                  text,
  telefone              text,
  faturamento           text,
  nicho                 text,
  utm_campaign          text,
  utm_source            text,
  utm_medium            text,
  status                text check (status in ('MQL','Desqualificado','Indefinido')) default 'Indefinido',
  monday_item_id        text,
  reuniao_agendada_at   timestamptz,
  contrato_assinado_at  timestamptz,
  submitted_at          timestamptz not null
);

create index if not exists leads_submitted_at_idx  on leads (submitted_at desc);
create index if not exists leads_utm_campaign_idx   on leads (utm_campaign);
create index if not exists leads_status_idx         on leads (status);

-- ──────────────────────────────────────────────
-- CAMPAIGNS (Meta / Google)
-- ──────────────────────────────────────────────
create table if not exists campaigns (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  meta_campaign_id    text unique,
  google_campaign_id  text unique,
  name                text not null,
  platform            text check (platform in ('meta','google')) default 'meta',
  status              text check (status in ('ativo','pausado','encerrado')) default 'pausado',
  daily_budget        numeric,
  objective           text,
  utm_campaign        text
);

-- ──────────────────────────────────────────────
-- CREATIVES (ad creatives)
-- ──────────────────────────────────────────────
create table if not exists creatives (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  name              text not null,
  campaign_id       uuid references campaigns(id) on delete set null,
  platform          text default 'meta',
  format            text check (format in ('imagem','video','carousel')) default 'imagem',
  asset_url         text,
  headline          text,
  body              text,
  cta               text default 'LEARN_MORE',
  meta_creative_id  text,
  status            text check (status in ('rascunho','aprovado','publicado','pausado','rejeitado')) default 'rascunho',
  metrics           jsonb default '{}'::jsonb
);

-- ──────────────────────────────────────────────
-- CONTRACTS (from Monday.com)
-- ──────────────────────────────────────────────
create table if not exists contracts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  monday_item_id  text unique not null,
  nome            text,
  telefone        text,
  valor           numeric default 0,
  plataforma      text,
  closer          text,
  utm_campaign    text,
  lead_id         uuid references leads(id) on delete set null,
  signed_at       timestamptz not null default now()
);

create index if not exists contracts_signed_at_idx   on contracts (signed_at desc);
create index if not exists contracts_utm_campaign_idx on contracts (utm_campaign);

-- ──────────────────────────────────────────────
-- TOKEN BALANCES (API budget tracking)
-- ──────────────────────────────────────────────
create table if not exists token_balances (
  id           uuid primary key default gen_random_uuid(),
  service      text unique not null,  -- 'meta' | 'monday' | 'typeform' | 'anthropic' | 'google'
  available    integer not null default 0,
  daily_limit  integer not null default 0,
  reset_at     timestamptz not null,
  unit         text not null default 'calls',
  updated_at   timestamptz default now()
);

-- Seed default balances
insert into token_balances (service, available, daily_limit, reset_at, unit) values
  ('meta',       200,    200,    now() + interval '1 day', 'calls'),
  ('monday',     500,    500,    now() + interval '1 day', 'calls'),
  ('typeform',   100,    100,    now() + interval '1 day', 'calls'),
  ('anthropic',  100000, 100000, now() + interval '1 day', 'tokens'),
  ('google',     100,    100,    now() + interval '1 day', 'calls')
on conflict (service) do nothing;

-- ──────────────────────────────────────────────
-- AGENT RUNS (execution log)
-- ──────────────────────────────────────────────
create table if not exists agent_runs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  task_id         text not null,
  task_name       text not null,
  status          text check (status in ('queued','running','completed','failed')) default 'queued',
  started_at      timestamptz,
  finished_at     timestamptz,
  cost_used       jsonb default '{}'::jsonb,
  result_summary  text,
  error           text
);

create index if not exists agent_runs_created_at_idx on agent_runs (created_at desc);
create index if not exists agent_runs_status_idx     on agent_runs (status);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────
alter table leads          enable row level security;
alter table campaigns      enable row level security;
alter table creatives      enable row level security;
alter table contracts      enable row level security;
alter table token_balances enable row level security;
alter table agent_runs     enable row level security;

-- Allow all for service_role (used by server-side agents)
create policy "service role full access" on leads          for all using (true);
create policy "service role full access" on campaigns      for all using (true);
create policy "service role full access" on creatives      for all using (true);
create policy "service role full access" on contracts      for all using (true);
create policy "service role full access" on token_balances for all using (true);
create policy "service role full access" on agent_runs     for all using (true);
