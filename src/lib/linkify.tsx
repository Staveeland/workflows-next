import type { ReactNode } from "react";

/**
 * Linkify — render https://-URLs in USER TEXT as safe inline links.
 *
 * The XSS wall stays exactly where it is: everything that is not a
 * validated https-URL remains plain React text nodes (escaped by React).
 * No dangerouslySetInnerHTML, no markdown, no other URL schemes — http,
 * mailto, javascript etc. all stay inert text.
 *
 * Every candidate goes through `new URL()` and must parse, be https:,
 * and carry no smuggled credentials (user:pass@host). Long URLs are
 * shortened VISUALLY (middle ellipsis) — the href is always the full,
 * validated URL.
 *
 * Used by the Benken feed (customer), the AdminBenken feed (office) and
 * the Oversikt tab's siste-aktivitet excerpts.
 */

/** Candidate matcher — broad on purpose; `new URL()` is the real gate. */
const KANDIDAT_RE = /https:\/\/[^\s<>"'`]+/g;

/** Sentence punctuation that glues itself onto pasted URLs. */
const HALE_TEGN = ".,;:!?…»«'\"";

/** Hrefs beyond this are suspicious paste-noise — leave them as text. */
const HREF_MAX = 2048;

/** Visible length cap — longer URLs get a middle ellipsis. */
const VIS_MAX = 64;

/**
 * The ONE validator: parses with `new URL()`, requires https:, refuses
 * credentials. Returns the normalized href — or null when the string
 * must stay plain text. Exported so panels validating standalone URLs
 * (e.g. the Forhåndsvisning prop) share the exact same wall.
 */
export function validerHttpsUrl(raw: string): string | null {
  if (!raw || raw.length > HREF_MAX) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return url.href;
}

/** «https://example.com/very/long/…» → middle-shortened display text. */
export function kortUrlTekst(href: string): string {
  const uten = href.replace(/^https:\/\//, "");
  if (uten.length <= VIS_MAX) return uten;
  return `${uten.slice(0, 42)}…${uten.slice(-18)}`;
}

/**
 * Trim sentence punctuation off the END of a candidate match — «se
 * https://a.no/b.» must not link the final period. A closing `)` or `]`
 * is only trimmed when the URL itself has no matching opener (so
 * wiki-style hrefs with parentheses survive).
 */
function trimHale(kandidat: string): string {
  let s = kandidat;
  for (;;) {
    const siste = s[s.length - 1];
    if (!siste) break;
    if (HALE_TEGN.includes(siste)) {
      s = s.slice(0, -1);
      continue;
    }
    if (
      (siste === ")" && !s.includes("(")) ||
      (siste === "]" && !s.includes("[")) ||
      (siste === "}" && !s.includes("{"))
    ) {
      s = s.slice(0, -1);
      continue;
    }
    break;
  }
  return s;
}

/**
 * Text → React nodes where validated https-URLs are
 * `<a target="_blank" rel="noopener noreferrer" class="vk-lenke-inline">`
 * and everything else is untouched text. Whitespace survives verbatim
 * (callers may render inside `white-space: pre-wrap`).
 */
export function linkify(tekst: string): ReactNode {
  if (!tekst || !tekst.includes("https://")) return tekst;
  const ut: ReactNode[] = [];
  let sist = 0;
  let n = 0;
  for (const m of tekst.matchAll(KANDIDAT_RE)) {
    const start = m.index ?? 0;
    const kandidat = trimHale(m[0]);
    const href = validerHttpsUrl(kandidat);
    if (!href) continue; // stays inside the surrounding text slice
    if (start > sist) ut.push(tekst.slice(sist, start));
    n += 1;
    ut.push(
      <a
        key={`lenke-${n}-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="vk-lenke-inline"
      >
        {kortUrlTekst(href)}
      </a>
    );
    // The trimmed tail (punctuation) flows into the next text slice.
    sist = start + kandidat.length;
  }
  if (ut.length === 0) return tekst;
  if (sist < tekst.length) ut.push(tekst.slice(sist));
  return ut;
}
