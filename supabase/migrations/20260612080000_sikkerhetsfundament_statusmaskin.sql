-- ============================================================================
-- Sikkerhetsfundament for kundeportalen (fase A) — kjørt mot prod 2026-06-12
-- 1) Nye kolonner: levert/lest-markører, soft delete, sluttrapport
-- 2) Ny status 'levert' (nivå 5) + innleggstyper 'faktura'/'milepael'
-- 3) Statusmaskin-trigger: kunder kan KUN gjøre de lovlige overgangene,
--    kontraktsfelter (tilbud/godkjent_*) fryses etter godkjenning
-- 4) is_portal_admin: pinned search_path
-- 5) fakturaer-tabell for Fiken-integrasjonen
-- 6) Grants-hygiene + indekser + realtime-publikasjon
-- ============================================================================

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'petter@workflows.no'
$$;

alter table public.kartlegginger
  add column if not exists levert_at timestamptz,
  add column if not exists kunde_sett_at timestamptz,
  add column if not exists slettet_at timestamptz,
  add column if not exists sluttrapport jsonb;

alter table public.kartlegginger drop constraint if exists kartlegginger_status_check;
alter table public.kartlegginger add constraint kartlegginger_status_check
  check (status = any (array['innsendt','genererer','forslag_klart','likt','tilbud_sendt','videre','levert','feilet']));

alter table public.prosjekt_innlegg drop constraint if exists prosjekt_innlegg_type_check;
alter table public.prosjekt_innlegg add constraint prosjekt_innlegg_type_check
  check (type = any (array['melding','leveranse','foresporsel','status','faktura','milepael']));

drop policy if exists kartlegging_select_own on public.kartlegginger;
create policy kartlegging_select_own on public.kartlegginger
  for select using (auth.uid() = user_id and slettet_at is null);

create or replace function public.kartlegging_vakt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  jwt_role text;
  er_admin boolean;
begin
  -- Direkte SQL (postgres) og service role går fri — vedlikehold/bakrom.
  if claims is null then return new; end if;
  jwt_role := coalesce(claims->>'role', '');
  if jwt_role = 'service_role' then return new; end if;

  er_admin := public.is_portal_admin();

  if tg_op = 'DELETE' then
    if old.godkjent_at is not null then
      raise exception 'kartlegging: godkjente løp kan ikke hard-slettes (bruk slettet_at)';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if er_admin then return new; end if;
    if new.status not in ('innsendt','genererer') then
      raise exception 'kartlegging: ugyldig startstatus %', new.status;
    end if;
    if new.tilbud is not null or new.tilbud_sendt_at is not null
       or new.godkjent_at is not null or new.godkjent_vilkar is not null
       or new.liked_at is not null or new.uke is not null
       or new.admin_sett_at is not null or new.levert_at is not null
       or new.sluttrapport is not null or new.slettet_at is not null then
      raise exception 'kartlegging: felt utenfor kartleggingen kan ikke settes ved innsending';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'kartlegging: identitetsfelt kan ikke endres';
  end if;

  if er_admin then
    if old.status in ('videre','levert') then
      if new.tilbud is distinct from old.tilbud
         or new.godkjent_at is distinct from old.godkjent_at
         or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
        raise exception 'kartlegging: tilbud og godkjenning er låst etter godkjenning';
      end if;
    end if;
    if new.status is distinct from old.status then
      if not (
        (old.status in ('forslag_klart','likt') and new.status = 'tilbud_sendt')
        or (old.status = 'videre' and new.status = 'levert')
        or (old.status = 'levert' and new.status = 'videre')
        or (old.status = 'feilet' and new.status = 'genererer')
      ) then
        raise exception 'kartlegging: ugyldig statusovergang % -> %', old.status, new.status;
      end if;
    end if;
    return new;
  end if;

  -- KUNDE. Felt som ALLTID er frosset for kunder ved update:
  if new.answers is distinct from old.answers
     or new.lang is distinct from old.lang
     or new.uke is distinct from old.uke
     or new.admin_sett_at is distinct from old.admin_sett_at
     or new.tilbud_sendt_at is distinct from old.tilbud_sendt_at
     or new.slettet_at is distinct from old.slettet_at
     or new.sluttrapport is distinct from old.sluttrapport
     or new.levert_at is distinct from old.levert_at
     or new.tilbud is distinct from old.tilbud then
    raise exception 'kartlegging: feltet kan ikke endres av kunde';
  end if;

  if new.status is not distinct from old.status then
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.liked_at is distinct from old.liked_at
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: kun lest-markøren kan oppdateres uten statusovergang';
    end if;
    return new;
  end if;

  if old.status = 'genererer' and new.status in ('forslag_klart','feilet') then
    if new.liked_at is distinct from old.liked_at
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: ugyldig feltendring under generering';
    end if;
    return new;
  end if;

  if old.status = 'forslag_klart' and new.status = 'likt' then
    if new.liked_at is null then
      raise exception 'kartlegging: likt krever liked_at';
    end if;
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.godkjent_at is distinct from old.godkjent_at
       or new.godkjent_vilkar is distinct from old.godkjent_vilkar then
      raise exception 'kartlegging: ugyldig feltendring ved likt';
    end if;
    return new;
  end if;

  if old.status = 'tilbud_sendt' and new.status = 'videre' then
    if new.godkjent_at is null or new.godkjent_vilkar is null then
      raise exception 'kartlegging: godkjenning krever godkjent_at og godkjent_vilkar';
    end if;
    if new.assessment is distinct from old.assessment
       or new.mockup_path is distinct from old.mockup_path
       or new.liked_at is distinct from old.liked_at then
      raise exception 'kartlegging: ugyldig feltendring ved godkjenning';
    end if;
    return new;
  end if;

  raise exception 'kartlegging: ugyldig statusovergang % -> %', old.status, new.status;
end;
$$;

drop trigger if exists kartlegging_vakt_iud on public.kartlegginger;
create trigger kartlegging_vakt_iud
  before insert or update or delete on public.kartlegginger
  for each row execute function public.kartlegging_vakt();

create table if not exists public.fakturaer (
  id uuid primary key default gen_random_uuid(),
  kartlegging_id uuid not null references public.kartlegginger(id) on delete cascade,
  fiken_draft_id bigint,
  fiken_invoice_id bigint,
  fiken_uuid uuid not null default gen_random_uuid(),
  invoice_number bigint,
  kid text,
  belop_ore bigint check (belop_ore is null or belop_ore >= 0),
  netto_ore bigint,
  mva_ore bigint,
  valuta text not null default 'NOK',
  beskrivelse text not null default '' check (char_length(beskrivelse) <= 500),
  issue_date date,
  due_date date,
  status text not null default 'utkast'
    check (status in ('utkast','sendt','delbetalt','betalt','forfalt','kansellert')),
  settled_at date,
  sendt_via text,
  sist_synket_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fakturaer enable row level security;

drop policy if exists fakturaer_admin_all on public.fakturaer;
create policy fakturaer_admin_all on public.fakturaer
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

drop policy if exists fakturaer_kunde_select on public.fakturaer;
create policy fakturaer_kunde_select on public.fakturaer
  for select using (
    status <> 'utkast'
    and exists (
      select 1 from public.kartlegginger k
      where k.id = kartlegging_id and k.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.kartlegginger from anon;
revoke insert, update, delete on public.prosjekt_innlegg from anon;
revoke insert, update, delete on public.fakturaer from anon;
revoke insert, update, delete on public.chat_users from anon, authenticated;
revoke insert, update, delete on public.chat_messages from anon, authenticated;

create index if not exists kartlegginger_user_created_idx
  on public.kartlegginger (user_id, created_at desc);
create index if not exists prosjekt_innlegg_kartlegging_created_idx
  on public.prosjekt_innlegg (kartlegging_id, created_at);
create index if not exists fakturaer_kartlegging_idx
  on public.fakturaer (kartlegging_id, created_at desc);

do $$
begin
  begin
    alter publication supabase_realtime add table public.prosjekt_innlegg;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.kartlegginger;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.fakturaer;
  exception when duplicate_object then null;
  end;
end $$;
