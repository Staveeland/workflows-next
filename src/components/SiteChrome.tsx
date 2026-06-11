"use client";

// Every route now brings its own verksted chrome: "/" mounts VerkstedHome,
// sub-pages wrap their content in VerkstedShell (nav + main + kolofon), and
// "/start" (kundeportalen) deliberately renders BARE — PortalApp brings its
// own minimal program-like header instead of NavVerksted/Kolofon.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
