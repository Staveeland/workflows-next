"use client";

// Every route now brings its own verksted chrome: "/" mounts VerkstedHome,
// all other routes wrap their content in VerkstedShell (nav + main + kolofon).
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
