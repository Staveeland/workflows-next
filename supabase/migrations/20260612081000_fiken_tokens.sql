-- Fiken OAuth-tokens (single-tenant: én rad). Deny-all RLS — leses og skrives
-- KUN server-side med service role. Brukes bare hvis FIKEN_PERSONAL_TOKEN ikke
-- er satt i env (personlig API-nøkkel er anbefalt primærvei).
create table if not exists public.fiken_tokens (
  id smallint primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  company_slug text,
  updated_at timestamptz not null default now()
);
alter table public.fiken_tokens enable row level security;
revoke all on public.fiken_tokens from anon, authenticated;
