"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// The verksted homepage ("/") brings its own chrome INCLUDING <main id="main">
// (nav/footer must sit outside main for the skip link and the banner/
// contentinfo landmarks); every other route keeps the legacy chrome.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
