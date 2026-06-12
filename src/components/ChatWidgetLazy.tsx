"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// VerkstedChat («Nattevakten») is a non-critical, interactive overlay. It
// pulls in react-markdown, remark-gfm and rehype-sanitize — a sizable chunk
// of client JS. We defer mounting until the browser is idle so it doesn't
// block first paint or LCP. The widget only shows the hatch until opened.
const VerkstedChat = dynamic(() => import("@/components/verksted/VerkstedChat"), {
  ssr: false,
  loading: () => null,
});

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export default function ChatWidgetLazy() {
  const pathname = usePathname();
  const [shouldMount, setShouldMount] = useState(false);

  // The customer portal (/start, /start/admin) has its own identity and its
  // own composer — the anonymous hatch must not float on top of it.
  const onPortal = pathname === "/start" || pathname.startsWith("/start/");

  useEffect(() => {
    const w = window as IdleWindow;
    let cancelled = false;
    const schedule = (cb: () => void) => {
      if (typeof w.requestIdleCallback === "function") {
        w.requestIdleCallback(cb, { timeout: 2500 });
      } else {
        window.setTimeout(cb, 1500);
      }
    };
    schedule(() => {
      if (!cancelled) setShouldMount(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (onPortal || !shouldMount) return null;
  return <VerkstedChat />;
}
