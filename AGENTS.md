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
