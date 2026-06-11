import type { Metadata } from "next";
import PortalApp from "@/components/portal/PortalApp";
import { portalMockEnabled } from "@/lib/portalMock";

// Kundeportalen v1 is unlinked — noindex until it earns a place in the nav.
export const metadata: Metadata = {
  title: "Hva trenger dere egentlig?",
  description:
    "Svar på åtte spørsmål og få en ærlig vurdering — også hvis svaret er at dere ikke trenger AI.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function StartPage() {
  // Dev-mock flag is resolved HERE (server) — PORTAL_DEV_MOCK is deliberately
  // not NEXT_PUBLIC, so the client learns about it only via this prop.
  return <PortalApp devMock={portalMockEnabled()} />;
}
