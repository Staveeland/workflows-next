-- Utvid faktura-status med 'kreditert' (Fiken: associatedCreditNotes ikke tom).
-- Kjørt mot prod 2026-06-12.
alter table public.fakturaer drop constraint if exists fakturaer_status_check;
alter table public.fakturaer add constraint fakturaer_status_check
  check (status in ('utkast','sendt','delbetalt','betalt','forfalt','kreditert','kansellert'));
