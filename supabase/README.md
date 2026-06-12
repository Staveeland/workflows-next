# Supabase — Workflows.no (naxyqrhrknudllcegtrp)

Skjemaet levde opprinnelig kun i Supabase-dashboardet. Fra og med 2026-06-12
versjoneres alle endringer som migrasjonsfiler her, og de samme migrasjonene
er registrert i prosjektets migrasjonshistorikk (supabase_migrations).

Grunnskjemaet (før første fil her) består av:
- `kartlegginger` — ett kundeløp per rad (answers/assessment/tilbud jsonb, status-enum)
- `prosjekt_innlegg` — Benken-feeden (melding/leveranse/foresporsel/status)
- `chat_users` / `chat_messages` — nettsidechatten (service-role-only, RLS uten policyer)
- Buckets: `mockups`, `prosjektfiler` (private, RLS på storage.objects)
- `is_portal_admin()` — admin = petter@workflows.no via JWT-epost

Migrasjonene kjøres mot prod via Supabase MCP (`apply_migration`) eller
`supabase db push`. Filnavn: `YYYYMMDDHHMMSS_navn.sql`.
