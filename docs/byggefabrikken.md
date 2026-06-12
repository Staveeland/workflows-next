# Byggefabrikken

Autonom førsteversjon av kundeprosjekter. Fabrikken bor i det private repoet
[Staveeland/workflows-fabrikk](https://github.com/Staveeland/workflows-fabrikk)
(GitHub Actions); portalen er bestiller og mottaker.

## Flyten

1. **Start**: kunden godkjenner tilbudet (hvis «Autobygg» er slått på i
   admin → Bygging — da med 10 min angrefrist + Telegram-varsel), eller
   Petter trykker «Start bygget» manuelt (ingen frist).
2. **Fabrikken** henter hele kartleggingen (`/api/fabrikk/brief`), oppretter
   privat kunde-repo (`kunde-<slug>-<id>`), lar Fable 5 destillere kundens
   uttrykk til en designbrief og deretter kode en komplett førsteversjon
   (bilder genereres agentisk med gpt-image-2), verifiserer `npm run build`,
   pusher, oppretter Vercel-prosjekt (deployment protection av) og venter på
   grønn deploy.
3. **Ferdig**: status «klar» + Telegram med repo- og forhåndsvisningslenke.
   Petter finpusser direkte i kunde-repoet med valgfri kodemodell — hver
   push deployes automatisk, og portalen viser ALLTID siste grønne deploy
   (`hentSisteDeploy` i `src/lib/fabrikk.ts`).
4. **Deling**: «Del med kunden» i admin → Bygging poster en leveranse med
   lenken i prosjektrommet (+ e-post med dyplenke) og åpner kundens
   Forhåndsvisning-fane.

## Hvor tingene bor

| Hva | Hvor |
|---|---|
| Tilstand | `public.byggeprosjekter` (status, repo, preview, logg — realtime på) |
| Admin-API | `src/app/api/portal/admin/bygg/route.ts` (start/stopp/del/autobygg) |
| Kunde-API | `src/app/api/portal/bygg/route.ts` (kun delt forhåndsvisning) |
| Fabrikk-API | `src/app/api/fabrikk/{brief,status}/route.ts` (X-Fabrikk-Secret, service role — fabrikk-infrastruktur, aldri kundeflate) |
| Hjelpere | `src/lib/fabrikk.ts`, typer i `src/lib/byggTypes.ts` |
| Selve fabrikken | workflows-fabrikk: `.github/workflows/bygg.yml`, `scripts/bygg.mjs`, `maler/{DESIGNBRIEF,OPPDRAG}.md` |

## Env-variabler

Portalen (Vercel workflows-next): `GH_FABRIKK_TOKEN` (trigge fabrikken),
`VERCEL_API_TOKEN` (lese siste deploy), `FABRIKK_WEBHOOK_SECRET` (verifisere
fabrikkens kall). Fabrikken (Actions-secrets): de samme tre pluss
`ANTHROPIC_API_KEY` og `OPENAI_API_KEY`. Full tabell i fabrikk-repoets README.

## Vakter

- Statusmaskin: `ikke_startet → venter → bygger → klar → delt`, med
  `stoppet`/`feilet`; callbacks kan aldri gjenopplive et stoppet løp, og
  autobygg-flippet ligger bak godkjenn-rutas idempotensvakt (aldri to bygg).
- Fabrikken spør portalen «skal jeg fortsatt bygge?» før hver dyre fase.
- Kostnadstak: 120 min timeout, Fable 5 på `--effort low`, 3–6 bilder.
- Kunden ser KUN delt forhåndsvisning (RLS krever `delt_med_kunde_at` +
  eierskap; kunde-API-et filtrerer i tillegg eksplisitt på `user_id`).
