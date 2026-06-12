-- Byggenotat: stående føringer til fabrikken (førstebygg). Endringsønske:
-- siste endringsforespørsel (revisjonsbygg som endrer eksisterende repo).
-- Kjørt mot prod 2026-06-12.
alter table public.byggeprosjekter
  add column if not exists byggenotat text,
  add column if not exists endringsonske text;
