# Verkstedet — bildestil og produksjonsguide

All bildeproduksjon for workflows.no (nettside, Instagram, OG, portal-mockups)
bruker samme visuelle språk. Denne guiden er kanonisk — for mennesker og
AI-agenter.

## Stil-prompt (brukes VERBATIM som prefiks)

Modell: `gpt-image-2` · Endepunkt: `POST https://api.openai.com/v1/images/generations`

```
Hand-printed editorial illustration in a linocut-meets-letterpress style with
visible ink texture, slight misregistration and fine film grain. Mood: a
Norwegian workshop at night, quiet and warm, real craftsmanship. Background
must be a solid flat deep burnt-oak near-black, exact hex #171310, with
generous dark negative space — no gradients in the background. STRICT limited
palette only: warm cream #F4EDE3, glowing amber #FFB454 as the single light
source in the scene, muted chalk blue #8FB8DE used sparingly for small line
details, and rare stamp red #E2593D accents. Dramatic warm chiaroscuro from
amber lamplight. Flat printmaking shapes, no photorealism, no 3D render, no
glossy CGI, no purple, absolutely no text, no words, no letters, no numbers,
no logos, no watermarks.
```

Deretter: `Scene: <konkret scenebeskrivelse>`.

Parametre (generations): `size` 1024x1024 / 1536x1024 / 1024x1536,
`quality: "high"` (nettside) eller `"medium"` (portal-mockups, raskere/billigere),
`output_format: "webp"`, `output_compression: 88`.

## Tekniske regler (lært på den harde måten)

1. **Edits-endepunktet** (`/v1/images/edits`, multipart): send KUN
   `model + image + prompt + size + quality`. `output_format`/maske-kombinasjoner
   gir 400 «Invalid image file or mode». Output er PNG (b64). iPhone-foto må
   konverteres til ren baseline-JPEG/PNG først (`sips`).
2. **Portretter av ekte personer** fungerer via edits: stil-prompten +
   «keep a strong, recognizable likeness». Petters portrett:
   `public/verksted/petter-portrett.png`.
3. **Edits regenererer HELE bildet** selv med maske — fargedrift og forskjøvet
   komposisjon. Kirurgiske endringer i eksisterende bilder gjøres med lokal
   pikselmanipulasjon (canvas i headless-nettleser, fargestyrte erstatninger),
   ikke regenerering.
4. **ALDRI tekst i AI-bilder.** Tekstplakater (Instagram, OG-bilder) settes med
   ekte Fraunces via HTML-mal + headless-skjermbilde. Tokens hentes fra
   `src/styles/verksted/base.css`; korn legges med feTurbulence-data-URI.
5. **Bakgrunnsfargen #171310 bakes inn i bildene** (modellen støtter ikke
   transparens). Kantene fades mot siden med CSS-maske (`.vk-ill--feather`).

## Kontinuitet

- **Nattevakten** (liten lykt-hodet robot-vekter) er en fast karakter — se
  `public/verksted/tj-agenter.webp` og `chat-scene.webp`. Gjenbruk ham for
  alt som handler om overvåking/AI-agenter/chat.
- Eksisterende bilder ligger i `public/verksted/`. Sjekk dem før du genererer
  nytt — gjenbruk og beskjæring slår ofte ny generering.

## Nøkkelhåndtering

OpenAI-nøkkelen roteres jevnlig — be Petter om gjeldende nøkkel. Legg den ALDRI
i repo, kode eller logger; bruk midlertidig fil utenfor repoet (umask 077) og
slett etterpå, eller `OPENAI_API_KEY`-env i Vercel for serverbruk.
