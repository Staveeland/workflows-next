# Fiken-integrasjonen — oppsett og sikkerhetsmodell

Fakturering fra kundeportalen: fakturautkast lages fra godkjente tilbud i
verkstedkontoret, og status (sendt/delbetalt/betalt/forfalt) synkes tilbake
og vises for både deg og kunden. Alt går server-side mot **din** Fiken-konto
— kundene autentiserer aldri mot Fiken.

## Sikkerhetsmodellen (les denne først)

Integrasjonen **endrer eller sletter aldri eksisterende data i Fiken**.
Dette er håndhevet strukturelt i koden (`src/lib/fiken.ts`): kun GET og
POST slipper gjennom, og POST kun mot en eksplisitt allowlist:

| Kall | Når |
|---|---|
| POST ny kontakt | KUN når søk på e-post og deretter org.nr. ikke fant match |
| POST nytt fakturautkast | «Lag fakturautkast»-skjemaet |
| POST utkast → faktura (`createInvoice`) | KUN bak «Lag faktura i Fiken»-knappen |
| POST send | KUN bak «Send faktura»-knappen (med bekreftelse) |

PUT/PATCH/DELETE finnes ikke i koden og blokkeres før nettverket om noen
skulle prøve. Fakturanummer-serien (counteren) opprettes heller aldri av
integrasjonen — mangler den, får du beskjed om å ordne den i Fiken selv
(lag første faktura manuelt i Fiken, eller sett startnummer i
faktura-innstillingene der).

Rate limit respekteres strengt (maks én samtidig request, godt under
4 req/s) — alle kall går gjennom en seriell kø med backoff på 429.

## 1. Aktiver API-tillegget i Fiken

API-tilgang er en tilleggstjeneste hos Fiken (99 kr/mnd):

1. Logg inn på fiken.no
2. **Foretak → Tilleggstjenester**
3. Aktiver **API**

## 2. Lag en personlig API-nøkkel (anbefalt vei)

1. Klikk navnet ditt oppe til høyre → **Rediger konto**
2. **API → Personlige API-nøkler** → lag ny nøkkel
3. Kopier nøkkelen (den utløper aldri, men kan slettes/roteres der)

Legg den i Vercel som `FIKEN_PERSONAL_TOKEN`. Det er alt — OAuth trengs
ikke når denne er satt.

## 3. (Valgfritt) OAuth-fallback

Hvis du heller vil koble til via OAuth (eller den personlige nøkkelen
mangler), trenger integrasjonen en API-klient fra Fiken:

1. Be om/lag OAuth-klient i Fiken (API-innstillingene) med redirect-URI
   `https://www.workflows.no/api/fiken/callback` (www-varianten —
   Vercel 308-er til workflows.no med path og query intakt)
2. Sett `FIKEN_CLIENT_ID` og `FIKEN_CLIENT_SECRET` i Vercel
3. Gå til verkstedkontoret → Fakturering → **Koble til Fiken**, logg inn
   og godkjenn

Tokens lagres i `fiken_tokens`-tabellen (deny-all RLS, kun service role)
og fornyes automatisk; et rotert refresh-token lagres alltid. Access-token
lever ca. ett døgn — fornyelsen skjer av seg selv ved neste kall.

## 4. Env-variabler

| Variabel | Påkrevd | Hva |
|---|---|---|
| `FIKEN_PERSONAL_TOKEN` | anbefalt | Personlig API-nøkkel — primærveien |
| `FIKEN_CLIENT_ID` / `FIKEN_CLIENT_SECRET` | kun for OAuth | OAuth-klienten; secreten signerer også state-cookien i tilkoblingsflyten |
| `FIKEN_COMPANY_SLUG` | kun ved flere selskaper | Overstyrer selskapsvalget. Med ett selskap på kontoen velges det automatisk; med flere får du en feilmelding som lister slugs |
| `FIKEN_REDIRECT_URI` | nei | Overstyrer callback-URI (dev). Default `https://www.workflows.no/api/fiken/callback` |
| `CRON_SECRET` | ja | Vernet på `/api/cron/fiken-sync` — Vercel cron sender den automatisk som Bearer når env-en er satt |

(`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` brukes også, men de er
allerede satt for portalen.)

## 5. Test-foretak (anbefalt før første ekte faktura)

1. I Fiken: **«Registrer et foretak som ikke er i Brønnøysundregistrene»**
   — det blir et testselskap (`testCompany: true`, vises som
   «(testselskap)» i tilkoblingslinja)
2. Send e-post til **api@fiken.no** og be om gratis API-tilgang for
   test-foretaket
3. Sett `FIKEN_COMPANY_SLUG` til test-foretakets slug mens du tester

## 6. Slik henger det sammen

```
godkjent tilbud (kartlegging i «videre»)
   │
   ▼  «Lag fakturautkast» (linjer/beløp tastes eksplisitt — fritekstprisen
   │   i tilbudet parses aldri)
fakturaer-rad (status 'utkast') + UTKAST i Fiken
   │
   ▼  «Lag faktura i Fiken» (bekreftes med to trykk)
ekte faktura i Fiken — raden beholder 'utkast' til den er sendt,
   │   så kunden ikke ser den for tidlig (kunde-RLS skjuler 'utkast')
   ▼  «Send faktura» (bekreftes med to trykk)
status 'sendt' → kunden ser fakturaen i Benken
   │
   ▼  synk (daglig cron 06:00 UTC + «Synk status»-knappen; Fiken har
   │   ingen webhooks, så vi poller)
'delbetalt' / 'forfalt' / 'betalt' — ved betalt postes
«Faktura nr. X er betalt — takk!» i Benken-feeden
```

Beløp lagres i øre overalt (`150000` = 1 500,00 kr). Mva-satser i
skjemaet: 25 % (standard), 15 %, 12 %, 0 %. Inntektskonto på linjene er
3000. Fikens tall (fakturanummer, KID, brutto/netto/mva, forfall) er
fasit og overskriver våre estimater ved hver synk.
