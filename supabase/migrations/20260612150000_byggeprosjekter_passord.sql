-- Passord-port på genererte kundenettsider (Basic Auth i den genererte
-- appen). Lav sensitivitet — forhåndsvisningspassord. Kjørt mot prod
-- 2026-06-12.
alter table public.byggeprosjekter
  add column if not exists nettsted_bruker text,
  add column if not exists nettsted_passord text;
