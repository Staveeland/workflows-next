-- Utvid effort-valgene med 'max' (CLI-ens dypeste flagg-nivå).
-- Kjørt mot prod 2026-06-12.
alter table public.byggeprosjekter drop constraint if exists byggeprosjekter_effort_check;
alter table public.byggeprosjekter add constraint byggeprosjekter_effort_check
  check (effort in ('auto','low','medium','high','xhigh','max'));
