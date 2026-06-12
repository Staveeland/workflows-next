-- Modell-innsats per byggeløp. 'auto' = skaler etter tilbudspris (default);
-- ellers eksplisitt nivå valgt av admin. Kjørt mot prod 2026-06-12.
alter table public.byggeprosjekter
  add column if not exists effort text not null default 'auto'
    check (effort in ('auto','low','medium','high','xhigh'));
