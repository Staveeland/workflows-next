"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// ChatWidget is a non-critical, interactive overlay. It pulls in framer-motion,
// react-markdown, remark-gfm and rehype-sanitize — combined ~330KB of client JS.
// We defer mounting until the browser is idle so it doesn't block first paint or
// LCP. The widget itself only shows a small button until the user opens it.
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export default function ChatWidgetLazy() {
  const [shouldMount, setShouldMount] = useState(false);

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

  if (!shouldMount) return null;
  return <ChatWidget />;
}
