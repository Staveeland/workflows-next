# Workflows — AI agent instructions

Repo for https://workflows.no, et Next.js 16-prosjekt deployet på Vercel.

Disse instruksjonene gjelder for alle AI-kodeagenter (Claude Code, ChatGPT/Codex,
Cursor, Jules, Aider, GitHub Copilot m.fl.).

## Git / push-konvensjoner

- **Committer og author** skal alltid være `staveeland <staveland@live.no>` — ellers feiler Vercel auto-build.
- Bruk `--author` + `git -c user.name=... -c user.email=...` per commit (ikke globalt).
- Push til `main` — Vercel deployer automatisk.

## Etter hver deploy som endrer innhold

Kjør IndexNow-ping slik at Bing, Yandex og andre søkemotorer re-crawler umiddelbart:

```
npm run indexnow
```

Scriptet ligger i `scripts/indexnow.mjs` og pinger:
- api.indexnow.org
- bing.com/indexnow
- yandex.com/indexnow

Nøkkelen er `fc815671ee0b445b910ee21274920669` og er verifisert via `public/fc815671ee0b445b910ee21274920669.txt`.

**Når scriptet skal kjøres:**
- Etter hver `git push origin main` som endrer innhold på forsiden, kundecaser, FAQ eller andre publiserte sider
- Etter at Vercel-deployet er grønt (vent ~1 min etter push før ping for å unngå å pinge før siden er oppdatert)
- IKKE nødvendig for rene kode-refaktoreringer som ikke endrer renderet HTML

**Hvis scriptet utvides:** legg til nye URL-er i `urls`-arrayet i `scripts/indexnow.mjs` og i `src/app/sitemap.ts` samtidig.

## SEO-fundament

Alt SEO-relatert (metadata, JSON-LD, sitemap, robots, canonical) er allerede satt opp. Kanonisk domene er `https://workflows.no` (uten www). `www.workflows.no` gir 308 → workflows.no på Vercel-nivå.

**Viktig:** Alle URL-er i kode, sitemap, JSON-LD og metadata skal bruke `https://workflows.no` (ikke www).

## Build

```
npm run build
```

Brukes for å verifisere at endringer kompilerer. Vercel bygger uansett på push, men lokal build fanger opp feil tidligere.

## Kundeportalen (/start) — lastbærende konvensjoner

- **Datakontrakter:** chip-/steg-id-ene i `kartlegginger.answers` (definert i
  `src/lib/portalContent.ts`) og status-enumen i `src/lib/portalTypes.ts` er
  lagret data — aldri rename, kun legg til. Nye statuser må koordineres i
  klient, API, DB-check og statusmaskin-triggeren samtidig.
- **Statusmaskin i DB:** `kartlegging_vakt()`-triggeren (se
  `supabase/migrations/`) håndhever lovlige statusoverganger og fryser
  tilbud/godkjenning etter kundens aksept. API-ruter må jobbe innenfor den.
- **Auth-modell:** portal-ruter bruker bruker-scopet Supabase-klient
  (`src/lib/portalAuth.ts`) — service role brukes ALDRI i portalflater, kun i
  isolerte moduler (chat, Fiken-tokens, cron).
- **A11y er kontrakt:** fokus-styring ved fasebytter, live-regions,
  `aria-disabled`-mønsteret, `prefers-reduced-motion` og synlige fokus-stiler
  skal bevares og matches i alt nytt portal-UI.
- **XSS-postur:** all brukertekst rendres escaped via React (aldri rå HTML),
  kun https-lenker, filer leveres som signerte attachment-URL-er, SVG aldri
  inline. Markdown kun gjennom rehype-sanitize.
- **Tospråklig:** all kunde-copy ligger i `portalContent.ts` på NO + EN.

## Bildestil

All bildeproduksjon (nettside, SoMe, OG, mockups) følger den kanoniske
stilguiden i [docs/bildestil.md](./docs/bildestil.md) — gjenbrukbar
gpt-image-2-prompt, tekniske regler og karakter-kontinuitet (Nattevakten).
Les den FØR du genererer bilder.
