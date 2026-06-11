import type { Metadata } from "next";
import AdminApp from "@/components/portal/AdminApp";
import { portalMockEnabled } from "@/lib/portalMock";

// Verkstedkontoret — Petters bakrom. Never indexed, never linked.
export const metadata: Metadata = {
  title: "Verkstedkontoret",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminPage() {
  // Dev-mock flag is resolved HERE (server) — PORTAL_DEV_MOCK is deliberately
  // not NEXT_PUBLIC, so the client learns about it only via this prop.
  return <AdminApp devMock={portalMockEnabled()} />;
}
