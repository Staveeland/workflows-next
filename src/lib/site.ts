/**
 * Canonical site URL and related identifiers used across metadata,
 * JSON-LD, sitemap and robots. Keep these in sync with AGENTS.md
 * (canonical domain is `workflows.no`).
 */
export const SITE_URL = "https://workflows.no";

/** Stable JSON-LD @id for the Organization node defined in layout.tsx. */
export const ORG_ID = `${SITE_URL}/#organization`;

/** Stable JSON-LD @id for the WebSite node defined in layout.tsx. */
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Build an absolute URL from a path. Accepts paths with or without
 * a leading slash; the root path returns SITE_URL with no trailing slash.
 */
export function urlFor(path: string = "/"): string {
  if (path === "" || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
