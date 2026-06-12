-- Byggefabrikken: ett autonomt byggeløp per kartlegging (godkjent tilbud ->
-- privat GitHub-repo + Vercel-prosjekt + Fable 5 koder førsteversjonen).
-- Skrives av admin (RLS) og av fabrikk-callbacken (service role).
-- Kjørt mot prod 2026-06-12.
create table if not exists public.byggeprosjekter (
  id uuid primary key default gen_random_uuid(),
  kartlegging_id uuid not null unique references public.kartlegginger(id) on delete cascade,
  status text not null default 'ikke_startet'
    check (status in ('ikke_startet','venter','bygger','klar','delt','feilet','stoppet')),
  autobygg boolean not null default false,
  github_repo text,
  vercel_project_id text,
  preview_url text,
  siste_commit_sha text,
  siste_deploy_at timestamptz,
  logg jsonb not null default '[]'::jsonb check (jsonb_typeof(logg) = 'array'),
  delt_med_kunde_at timestamptz,
  kansellert_at timestamptz,
  startet_at timestamptz,
  ferdig_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.byggeprosjekter enable row level security;

drop policy if exists bygg_admin_all on public.byggeprosjekter;
create policy bygg_admin_all on public.byggeprosjekter
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

drop policy if exists bygg_kunde_select on public.byggeprosjekter;
create policy bygg_kunde_select on public.byggeprosjekter
  for select using (
    delt_med_kunde_at is not null
    and exists (
      select 1 from public.kartlegginger k
      where k.id = kartlegging_id and k.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.byggeprosjekter from anon;

create index if not exists byggeprosjekter_kartlegging_idx
  on public.byggeprosjekter (kartlegging_id);

do $$
begin
  begin
    alter publication supabase_realtime add table public.byggeprosjekter;
  exception when duplicate_object then null;
  end;
end $$;
