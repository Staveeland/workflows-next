# Supabase e-postmaler — Verkstedet-design (kode + lenke)

Limes inn i **Supabase-dashboard → Workflows.no → Authentication → Email
Templates**. To maler brukes av portal-innloggingen: **Magic Link**
(eksisterende brukere) og **Confirm signup** (førstegangsbrukere — også de
som logger inn via `signInWithOtp` første gang). Samme design, litt ulik
hilsen.

> ⚠️ **HARD DEPLOY-FORUTSETNING:** AuthGate på /start viser nå et kodefelt
> og copy som forutsetter at e-posten inneholder en sekssifret kode. Koden
> rendres KUN hvis malen inneholder `{{ .Token }}`. **Begge** malene under
> må limes inn i dashboardet FØR koden deployes — ellers lover portalen en
> kode som aldri kommer.

> Variablene `{{ .Token }}` (den sekssifrede engangskoden) og
> `{{ .ConfirmationURL }}` (selve lenken) må stå urørt — Supabase bytter dem
> ut. Begge peker på samme engangsbillett: tastes koden, dør lenken, og
> omvendt.

Hvorfor begge: lenken åpnes ofte i Gmail/Outlook sin innebygde nettleser på
mobil — da havner innloggingen i feil nettleser, og utkastet (som ligger i
localStorage der kunden skrev) blir strandet. Koden tastes der kunden
allerede sitter. Derfor leder copyen med koden, og lenken er alternativet.

Sjekk samtidig (Authentication → Settings):

- **Email OTP Length** = 6 (standard) — kodefeltet i AuthGate forventer
  seks siffer.
- **Email OTP Expiration** = 3600 s — copyen i portalen sier «virker i én
  time».

---

## 1. Magic Link

**Subject:** `Koden din til verkstedet — døra er åpen`

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#171310;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 8px 18px;font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;color:#FFB454;">workflows.no</td></tr>
      <tr><td style="background-color:#F4EFE5;border-radius:10px;padding:40px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:14px;">VERKSTEDET &middot; HAUGESUND</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#171310;font-weight:600;padding-bottom:16px;">D&oslash;ra er &aring;pen.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#3d362e;padding-bottom:8px;">Tast koden under i fanen der du var, s&aring; fortsetter du akkurat der du slapp &mdash; ingen passord, ingen styr. Koden og knappen virker i &eacute;n time og kan bare brukes &eacute;n gang.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#8a8071;font-style:italic;padding-bottom:24px;">(One-time code and sign-in link for workflows.no &mdash; valid for an hour.)</td></tr>
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:10px;">Engangskoden din</td></tr>
          <tr><td align="center" style="padding-bottom:26px;">
            <span style="display:inline-block;font-family:'Courier New',monospace;font-size:32px;letter-spacing:8px;font-weight:700;color:#171310;background-color:#FFFDF8;border:2px dashed #B8741A;border-radius:8px;padding:14px 16px 14px 24px;">{{ .Token }}</span>
          </td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#3d362e;padding-bottom:18px;">&hellip; eller trykk p&aring; knappen, s&aring; &aring;pner d&oslash;ra seg her:</td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#171310;color:#FFB454;font-family:Georgia,serif;font-size:18px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:10px;border:2px solid #B8741A;">Inn i verkstedet &rarr;</a>
          </td></tr>
          <tr><td style="border-top:1px solid #ddd3c2;padding-top:18px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#8a8071;">var det ikke deg som ba om koden? da kan du trygt ignorere denne &mdash; ingenting skjer uten koden eller knappen.</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:18px 8px 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#C9BBA8;">Workflows AS &middot; Haugesund<br>Bygget for h&aring;nd. Ingen maler. Ingen lock-in.</td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Confirm signup

**Subject:** `Velkommen inn i verkstedet — koden din ligger her`

Samme HTML som over, men med førstegangshilsen i de tre tekstradene:

- Overskrift: `Velkommen inn.`
- Brødtekst: `F&oslash;rste gang hos oss &mdash; hyggelig. Tast koden under i fanen der du var, s&aring; fortsetter du akkurat der du slapp. Ingen passord &aring; huske; vi sender deg en fersk l&aring;s hver gang. Koden og knappen virker i &eacute;n time.`
- Kursivlinje (EN): `(First one-time code and sign-in link for workflows.no &mdash; valid for an hour.)`

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#171310;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 8px 18px;font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;color:#FFB454;">workflows.no</td></tr>
      <tr><td style="background-color:#F4EFE5;border-radius:10px;padding:40px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:14px;">VERKSTEDET &middot; HAUGESUND</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#171310;font-weight:600;padding-bottom:16px;">Velkommen inn.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#3d362e;padding-bottom:8px;">F&oslash;rste gang hos oss &mdash; hyggelig. Tast koden under i fanen der du var, s&aring; fortsetter du akkurat der du slapp. Ingen passord &aring; huske; vi sender deg en fersk l&aring;s hver gang. Koden og knappen virker i &eacute;n time.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#8a8071;font-style:italic;padding-bottom:24px;">(First one-time code and sign-in link for workflows.no &mdash; valid for an hour.)</td></tr>
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:10px;">Engangskoden din</td></tr>
          <tr><td align="center" style="padding-bottom:26px;">
            <span style="display:inline-block;font-family:'Courier New',monospace;font-size:32px;letter-spacing:8px;font-weight:700;color:#171310;background-color:#FFFDF8;border:2px dashed #B8741A;border-radius:8px;padding:14px 16px 14px 24px;">{{ .Token }}</span>
          </td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#3d362e;padding-bottom:18px;">&hellip; eller trykk p&aring; knappen, s&aring; &aring;pner d&oslash;ra seg her:</td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#171310;color:#FFB454;font-family:Georgia,serif;font-size:18px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:10px;border:2px solid #B8741A;">Inn i verkstedet &rarr;</a>
          </td></tr>
          <tr><td style="border-top:1px solid #ddd3c2;padding-top:18px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#8a8071;">var det ikke deg som ba om koden? da kan du trygt ignorere denne &mdash; ingenting skjer uten koden eller knappen.</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:18px 8px 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#C9BBA8;">Workflows AS &middot; Haugesund<br>Bygget for h&aring;nd. Ingen maler. Ingen lock-in.</td></tr>
    </table>
  </td></tr>
</table>
```

---

Steg-e-postene fra portalen (forslag klart / tilbud sendt / godkjent / nytt
i prosjektet) sendes fra koden via Resend og har samme visuelle språk — de
styres i `src/lib/epost.ts`, ikke her. «Åpne verkstedet»-knappen i dem
bruker en engangs innloggings-dyplenke (`lagPortalLenke()` — service-role
`generateLink`, isolert i epost.ts) med fallback til
`/start?innlogging=1` hvis genereringen feiler.

Merk: Supabase holder ÉN gyldig engangsbillett per bruker om gangen — en
fersk varslings-dyplenke ugyldiggjør en eldre ubrukt innloggingskode (og
omvendt). I praksis ufarlig: portalen viser «koden stemmer ikke eller er
utløpt» og kunden ber bare om en ny.
