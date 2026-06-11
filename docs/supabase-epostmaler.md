# Supabase e-postmaler — Verkstedet-design

Limes inn i **Supabase-dashboard → Workflows.no → Authentication → Email
Templates**. To maler brukes av portal-innloggingen: **Magic Link**
(eksisterende brukere) og **Confirm signup** (førstegangsbrukere). Samme
design, litt ulik hilsen.

> Variabelen `{{ .ConfirmationURL }}` må stå urørt — Supabase bytter den ut
> med selve lenken.

---

## 1. Magic Link

**Subject:** `Døra er åpen — lenken din til verkstedet`

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#171310;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 8px 18px;font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;color:#FFB454;">workflows.no</td></tr>
      <tr><td style="background-color:#F4EFE5;border-radius:10px;padding:40px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:14px;">VERKSTEDET &middot; HAUGESUND</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#171310;font-weight:600;padding-bottom:16px;">D&oslash;ra er &aring;pen.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#3d362e;padding-bottom:8px;">Trykk p&aring; knappen, s&aring; er du inne i verkstedet &mdash; ingen passord, ingen styr. Lenken virker i &eacute;n time og kan bare brukes &eacute;n gang.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#8a8071;font-style:italic;padding-bottom:28px;">(One-time sign-in link for workflows.no &mdash; valid for an hour.)</td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#171310;color:#FFB454;font-family:Georgia,serif;font-size:18px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:10px;border:2px solid #B8741A;">Inn i verkstedet &rarr;</a>
          </td></tr>
          <tr><td style="border-top:1px solid #ddd3c2;padding-top:18px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#8a8071;">var det ikke deg som ba om lenken? da kan du trygt ignorere denne &mdash; ingenting skjer uten knappen.</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:18px 8px 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#C9BBA8;">Workflows AS &middot; Haugesund<br>Bygget for h&aring;nd. Ingen maler. Ingen lock-in.</td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Confirm signup

**Subject:** `Velkommen inn i verkstedet`

Samme HTML som over, men bytt de tre tekstradene:

- Overskrift: `Velkommen inn.`
- Brødtekst: `F&oslash;rste gang hos oss &mdash; hyggelig. Trykk p&aring; knappen, s&aring; er du inne i verkstedet. Ingen passord &aring; huske; vi sender deg en fersk l&aring;s hver gang.`
- Kursivlinje (EN): `(First sign-in link for workflows.no &mdash; valid for an hour.)`

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#171310;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 8px 18px;font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;color:#FFB454;">workflows.no</td></tr>
      <tr><td style="background-color:#F4EFE5;border-radius:10px;padding:40px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A5A14;padding-bottom:14px;">VERKSTEDET &middot; HAUGESUND</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#171310;font-weight:600;padding-bottom:16px;">Velkommen inn.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#3d362e;padding-bottom:8px;">F&oslash;rste gang hos oss &mdash; hyggelig. Trykk p&aring; knappen, s&aring; er du inne i verkstedet. Ingen passord &aring; huske; vi sender deg en fersk l&aring;s hver gang.</td></tr>
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#8a8071;font-style:italic;padding-bottom:28px;">(First sign-in link for workflows.no &mdash; valid for an hour.)</td></tr>
          <tr><td align="center" style="padding-bottom:28px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#171310;color:#FFB454;font-family:Georgia,serif;font-size:18px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:10px;border:2px solid #B8741A;">Inn i verkstedet &rarr;</a>
          </td></tr>
          <tr><td style="border-top:1px solid #ddd3c2;padding-top:18px;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#8a8071;">var det ikke deg som ba om lenken? da kan du trygt ignorere denne &mdash; ingenting skjer uten knappen.</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:18px 8px 0;font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#C9BBA8;">Workflows AS &middot; Haugesund<br>Bygget for h&aring;nd. Ingen maler. Ingen lock-in.</td></tr>
    </table>
  </td></tr>
</table>
```

---

Steg-e-postene fra portalen (forslag klart / tilbud sendt / godkjent) sendes
fra koden via Resend og har samme visuelle språk — de styres i
`src/lib/epost.ts`, ikke her.
