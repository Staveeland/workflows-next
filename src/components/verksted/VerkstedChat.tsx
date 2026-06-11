"use client";

import "@/styles/verksted/base.css";
import "@/styles/verksted/chat.css";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useLang } from "@/components/LanguageProvider";
import { verkstedContent } from "@/lib/verkstedContent";
import { fraunces, schibsted, spline } from "@/components/verksted/fonts";

// ════════════════════════════════════════════════════════════════════
// «Nattevakten» — the workshop night-watch chat.
// Logic ported 1:1 from src/components/ChatWidget.tsx (storage keys,
// webhook payloads, polling, handover) — presentation all new.
// ════════════════════════════════════════════════════════════════════

// Strict sanitization schema: only the inline + block elements we actually
// want to render in chat notes. Links are forced to http(s) only and open
// in a new tab with rel="noopener noreferrer". (Ported verbatim.)
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "code",
    "pre",
    "blockquote",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ["href", /^https?:\/\//i],
      ["title"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https"],
  },
};

type Role = "user" | "assistant" | "petter";
// `fail` marks a local-only delivery-failure card (never sent anywhere).
type Msg = { role: Role; text: string; createdAt?: string; fail?: boolean };
type Mode = "ai" | "form" | "direct";
type WoState = "idle" | "busy" | "stamped" | "failed";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ||
  "https://workflowsas.app.n8n.cloud/webhook/workflows-chat";

const POLL_INTERVAL_MS = 4000;
const IDLE_MS = 90_000;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_EMAIL = "petter@workflows.no";
const PHONE_DISPLAY = "+47 930 77 915";
const PHONE_HREF = "tel:+4793077915";

type VC = (typeof verkstedContent)["no"];

// Buckets for the time-aware welcome. The clock is read in the hatch click
// handler / effects (never during render — render stays pure).
type HourBucket = "natt" | "morgen" | "dag" | "kveld";
function bucketForHour(h: number): HourBucket {
  if (h < 6) return "natt";
  if (h < 12) return "morgen";
  if (h < 18) return "dag";
  return "kveld";
}

// Same storage key as the old widget — returning users keep their session.
function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("wf_chat_session");
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("wf_chat_session", id);
  }
  return id;
}

// SSR-safe reduced-motion probe (same pattern as Tjenester's useFinePointer).
function useReducedPref() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function NoteBody({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={{
        a: ({ href, children, ...props }) => (
          <a
            {...props}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// Premium failure state: the backend pipe may be down (Supabase restore in
// progress) — never show a raw error, always offer the human escape hatch.
function FailCard({ t, style }: { t: VC; style?: CSSProperties }) {
  return (
    <div className="vk-chat-note vk-chat-fail" style={style}>
      <p className="vk-chat-failtitle">{t.chat.workorder.failTitle}</p>
      <p className="vk-chat-failbody">{t.chat.workorder.failBody}</p>
      <div className="vk-chat-faillinks">
        <a className="vk-chat-faillink" href={`mailto:${CONTACT_EMAIL}`}>
          <span className="vk-chat-faillbl">{t.kontakt.emailLabel}</span>
          <span className="vk-chat-failval">{CONTACT_EMAIL}</span>
        </a>
        <a className="vk-chat-faillink" href={PHONE_HREF}>
          <span className="vk-chat-faillbl">{t.kontakt.phoneLabel}</span>
          <span className="vk-chat-failval">{PHONE_DISPLAY}</span>
        </a>
      </div>
    </div>
  );
}

export default function VerkstedChat() {
  const { lang } = useLang();
  const t = verkstedContent[lang];
  const reduced = useReducedPref();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("ai");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [woRequest, setWoRequest] = useState("");
  const [woState, setWoState] = useState<WoState>("idle");
  const [idle, setIdle] = useState(false);
  const [kaffe, setKaffe] = useState(false);
  // Which welcome variant fits the visitor's clock — set when the hatch opens.
  const [hourBucket, setHourBucket] = useState<HourBucket | null>(null);
  // The watchman's current «thinking» line — drawn per request in send().
  const [thinkingLine, setThinkingLine] = useState("");
  // The wink that lands shortly after the welcome (sticks once shown).
  const [followupShown, setFollowupShown] = useState(false);
  // Text mirrored into the hidden polite live region — only genuinely new
  // incoming content (replies, status, failures), never the user's own notes.
  const [liveMsg, setLiveMsg] = useState("");

  const sessionIdRef = useRef<string>("");
  const lastPollRef = useRef<string>(new Date(0).toISOString());
  const historyLoadingRef = useRef(false); // gates polling during restore
  const woRunRef = useRef(0); // invalidates pending stamped→finish choreography
  const prevBusyRef = useRef(false);
  const justOpenedRef = useRef(true);
  const openCountRef = useRef(0); // msg count at open — stagger only that batch
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const woNameRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
    // Return focus to the hatch (launcher) for SR/keyboard users.
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // Announce via the hidden polite region. If the same text repeats
  // back-to-back, toggle a trailing NBSP so the DOM actually changes.
  const announce = useCallback((text: string) => {
    setLiveMsg((prev) => (prev === text ? `${text} ` : text));
  }, []);

  const loadHistory = useCallback(async (e: string) => {
    // Gate the poller while the restore is in flight — otherwise a first
    // tick with since=epoch can re-append Petter's whole history.
    historyLoadingRef.current = true;
    try {
      const res = await fetch(`/api/chat/history?email=${encodeURIComponent(e)}`);
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length) {
        const restored: Msg[] = data.messages
          .filter(
            (m: { role: Role }) =>
              m.role === "user" || m.role === "assistant" || m.role === "petter"
          )
          .map((m: { role: Role; text: string; created_at: string }) => ({
            role: m.role,
            text: m.text,
            createdAt: m.created_at,
          }));
        setMsgs(restored);
        const lastPetter = [...data.messages]
          .reverse()
          .find((m: { role: Role; created_at: string }) => m.role === "petter");
        if (lastPetter) lastPollRef.current = lastPetter.created_at;
      }
    } catch {
      /* ignore — polling and the fail card cover the broken-pipe case */
    } finally {
      historyLoadingRef.current = false;
    }
  }, []);

  // Init: session id + restore identity if present (same storage keys as the
  // old widget — returning users keep their conversation).
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    const savedEmail = localStorage.getItem("wf_chat_email");
    const savedName = localStorage.getItem("wf_chat_name") || "";
    if (savedEmail && EMAIL_RX.test(savedEmail)) {
      setEmail(savedEmail);
      setName(savedName);
      setMode("direct");
      void loadHistory(savedEmail);
    }
  }, [loadHistory]);

  useEffect(() => {
    if (!open) return;
    setUnread(false);
    setLiveMsg(""); // fresh live region per open — no stale re-announce
    justOpenedRef.current = true;
  }, [open]);

  // The watchman's second note — a wink that lands ~1.2s after the welcome.
  // Under reduced motion it shows immediately (the note entry animation is
  // already gated behind prefers-reduced-motion in chat.css). Once shown it
  // stays shown — he doesn't repeat his jokes.
  useEffect(() => {
    if (!open || followupShown || !t.chat.welcomeFollowup) return;
    if (reduced) {
      setFollowupShown(true);
      return;
    }
    const id = setTimeout(() => setFollowupShown(true), 1200);
    return () => clearTimeout(id);
  }, [open, reduced, followupShown, t]);

  // If focus was dropped to <body> (e.g. the send button disabled itself
  // mid-press), hand it back to the bench input when the watchman is done.
  useEffect(() => {
    if (
      prevBusyRef.current &&
      !busy &&
      open &&
      document.activeElement === document.body
    ) {
      inputRef.current?.focus();
    }
    prevBusyRef.current = busy;
  }, [busy, open]);

  // Move focus into the dialog once it has mounted (after the slide-in).
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      if (mode === "form") woNameRef.current?.focus();
      else inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(id);
  }, [open, mode]);

  // Body scroll lock while the dialog is open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus-trap + Esc-to-close while dialog is open (NavVerksted pattern).
  useEffect(() => {
    if (!open) return;

    const getFocusable = (): HTMLElement[] => {
      const root = panelRef.current;
      if (!root) return [];
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeChat();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // If focus has escaped the panel (e.g., shifted to body), pull it back.
      if (!panelRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, mode, closeChat]);

  // Keep the log pinned to the newest note. JS smooth scroll is not
  // auto-disabled by the OS reduced-motion setting — gate it ourselves.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const jump = justOpenedRef.current;
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: jump || reduced ? "auto" : "smooth",
      });
    });
    justOpenedRef.current = false;
  }, [msgs, busy, mode, open, reduced]);

  // Polling for Petter's replies in direct mode. Runs even while the panel
  // is closed (that is what feeds the unread badge); pauses while the tab
  // is hidden so a backgrounded page doesn't hammer the API.
  useEffect(() => {
    if (mode !== "direct" || !email) return;
    let stopped = false;
    const tick = async () => {
      if (document.hidden || historyLoadingRef.current) return;
      try {
        const res = await fetch(
          `/api/chat/poll?email=${encodeURIComponent(email)}&since=${encodeURIComponent(
            lastPollRef.current
          )}`
        );
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length) {
          const newMsgs: Msg[] = data.messages.map(
            (m: { role: Role; text: string; created_at: string }) => ({
              role: m.role,
              text: m.text,
              createdAt: m.created_at,
            })
          );
          setMsgs((prev) => [...prev, ...newMsgs]);
          lastPollRef.current = data.messages[data.messages.length - 1].created_at;
          if (!open) setUnread(true);
          const fromPetter = newMsgs.filter((m) => m.role === "petter");
          if (fromPetter.length) {
            announce(
              fromPetter
                .map((m) => `${t.chat.petterStamp}: ${m.text}`)
                .join(" ")
            );
          }
        }
      } catch {
        /* swallow */
      }
    };
    void tick();
    const id = window.setInterval(() => {
      if (!stopped) void tick();
    }, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [mode, email, open, announce, t]);

  // Idle: after 90s open without activity the watchman rests his eyes.
  // Skipped under reduced motion and while the tab is hidden.
  useEffect(() => {
    setIdle(false);
    if (!open || reduced) return;
    const id = setTimeout(() => {
      if (!document.hidden) setIdle(true);
    }, IDLE_MS);
    return () => clearTimeout(id);
  }, [open, reduced, msgs, input, mode]);

  // Auto-size the textarea (1–3 rows).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
  }, [input, open, mode]);

  async function sendAi(text: string) {
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current }),
      });
      // Non-200 first: n8n error bodies carry a `message` field that would
      // otherwise pass the reply-extraction below and surface a raw error.
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      const data = await res.json().catch(() => ({}));
      const reply: string = data.reply || data.output || data.message || "";
      if (!reply) throw new Error("empty reply");
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
      announce(`${t.chat.modeAi}: ${reply}`);
      if (!open) setUnread(true);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "", fail: true }]);
      announce(`${t.chat.workorder.failTitle}. ${t.chat.workorder.failBody}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendDirect(text: string) {
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, text }),
      });
      if (!res.ok) throw new Error("send failed");
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "", fail: true }]);
      announce(`${t.chat.workorder.failTitle}. ${t.chat.workorder.failBody}`);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    // Easter egg: a fresh cup rises by the watchman, then business as usual.
    if (!reduced && text.toLowerCase() === "kaffe") {
      setKaffe(true);
      after(3000, () => setKaffe(false));
    }
    // Draw tonight's thinking line here in the handler — render stays pure.
    const lines = t.chat.thinkingLines;
    const line = lines[Math.floor(Math.random() * lines.length)] ?? "";
    setThinkingLine(line);
    // Mirror the visible thinking line (the log itself is aria-live=off).
    announce(line);
    if (mode === "ai") await sendAi(text);
    else if (mode === "direct") await sendDirect(text);
  }

  async function submitWorkorder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (woState !== "idle") return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    // Native required/type/pattern validation gates submission; this is
    // belt-and-braces only.
    if (!cleanName || !EMAIL_RX.test(cleanEmail)) return;
    // Mode switches invalidate this run so the stamped→finish timer can't
    // yank the user into direct mode after «Tilbake til nattevakten».
    const run = ++woRunRef.current;
    setWoState("busy");
    try {
      const history = msgs
        .filter((m) => !m.fail && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({ role: m.role as "user" | "assistant", text: m.text }));
      const res = await fetch("/api/chat/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          initialRequest: woRequest.trim(),
          history,
        }),
      });
      if (!res.ok) throw new Error("handover failed");
      localStorage.setItem("wf_chat_email", cleanEmail);
      localStorage.setItem("wf_chat_name", cleanName);
      setEmail(cleanEmail);
      setName(cleanName);
      lastPollRef.current = new Date().toISOString();
      const sentNote = t.chat.workorder.sent;
      const finish = () => {
        if (woRunRef.current !== run) return; // user switched modes meanwhile
        setWoState("idle");
        setWoRequest("");
        setMode("direct");
        setMsgs((prev) => [...prev, { role: "assistant", text: sentNote }]);
        announce(sentNote);
      };
      if (reduced) {
        finish(); // reduced motion: instant swap, no stamp choreography
      } else {
        setWoState("stamped"); // LEVERT slams, card slides up the wall
        after(1100, finish);
      }
    } catch {
      setWoState("failed");
    }
  }

  function switchToAi() {
    woRunRef.current += 1; // cancel any pending work-order choreography
    setMode("ai");
    setWoState("idle");
    setMsgs([]);
  }

  async function switchToDirect() {
    woRunRef.current += 1; // cancel any pending work-order choreography
    // Gate on the PERSISTED identity (only written after a successful
    // handover) — in-memory `email` may hold a failed form attempt, and
    // direct mode without a chat_users row 404s on every send.
    const savedEmail = localStorage.getItem("wf_chat_email");
    if (!savedEmail || !EMAIL_RX.test(savedEmail)) {
      setWoState("idle");
      setMode("form");
      return;
    }
    setEmail(savedEmail);
    setName(localStorage.getItem("wf_chat_name") || "");
    setMode("direct");
    setMsgs([]);
    lastPollRef.current = new Date(0).toISOString();
    // The recipient changed — say so (the footer line alone is silent).
    announce(t.chat.directInfo);
    await loadHistory(savedEmail);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const noteDelay = (i: number): CSSProperties =>
    ({
      "--vk-d": `${i < openCountRef.current ? Math.min(i, 8) * 36 : 0}ms`,
    }) as CSSProperties;

  return (
    <div
      className={`vk-chatroot ${fraunces.variable} ${schibsted.variable} ${spline.variable}`}
    >
      <button
        ref={launcherRef}
        type="button"
        className={`vk-chat-hatch${open ? " vk-chat-hatch--hidden" : ""}`}
        aria-label={t.chat.hatchAria}
        aria-expanded={open}
        // idref must resolve — the dialog only exists in the DOM while open
        aria-controls={open ? "vk-chat-dialog" : undefined}
        onClick={() => {
          openCountRef.current = msgs.length;
          // Read the visitor's clock now (event handler, not render) so the
          // welcome matches the hour — fresh on every open.
          setHourBucket(bucketForHour(new Date().getHours()));
          setOpen(true);
        }}
      >
        <span className="vk-chat-hatchimg">
          <Image
            src="/verksted/chat-hatch.webp"
            alt=""
            width={112}
            height={112}
            sizes="112px"
          />
        </span>
        {unread && <span className="vk-chat-hatchdot" aria-hidden="true" />}
        {/* Always-mounted status region — live regions inserted together
            with their content are not reliably announced. */}
        <span role="status" className="vk-sr">
          {unread ? t.chat.a11yNewMsg : ""}
        </span>
        <span className="vk-chat-hatchlabel" aria-hidden="true">
          {t.chat.hatchLabel}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id="vk-chat-dialog"
          className="vk-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t.chat.a11yDialog}
        >
          <header className="vk-chat-head">
            <div>
              <p className="vk-chat-title">{t.chat.title}</p>
              <p className="vk-chat-sub">
                <span
                  className={`vk-chat-statusdot${idle ? " is-idle" : ""}`}
                  aria-hidden="true"
                />
                {t.chat.subtitle}
              </p>
            </div>
            <button
              type="button"
              className="vk-chat-close"
              aria-label={t.chat.close}
              onClick={closeChat}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Hidden polite region — mirrors only genuinely new incoming
              content (replies, thinking/status, failures). The visible log
              is aria-live=off, so the user's own notes, restored history
              and the work-order form are never read out wholesale. */}
          <div className="vk-sr" aria-live="polite">
            {liveMsg}
          </div>

          <div className="vk-chat-main">
            {/* The watchman at his desk — decorative backdrop. */}
            <div
              className={`vk-chat-scene${busy ? " is-typing" : ""}${idle ? " is-idle" : ""}`}
              aria-hidden="true"
            >
              <Image
                src="/verksted/chat-scene.webp"
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 560px"
                className="vk-chat-sceneimg"
              />
              <span className="vk-chat-lantern" />
              {kaffe && (
                <svg
                  className="vk-chat-kaffe"
                  viewBox="0 0 40 44"
                  aria-hidden="true"
                >
                  <path
                    className="vk-chat-kaffesteam"
                    d="M14 14c-1.5-2.5 1.5-4 0-6.5C12.7 5.3 14.5 4 14 2"
                  />
                  <path
                    className="vk-chat-kaffesteam vk-chat-kaffesteam--late"
                    d="M22 14c-1.5-2.5 1.5-4 0-6.5C20.7 5.3 22.5 4 22 2"
                  />
                  <path
                    d="M7 18h22v8a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8v-8Z"
                    fill="#f4ede3"
                    stroke="#171310"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M29 20h3a4 4 0 0 1 0 8h-3"
                    fill="none"
                    stroke="#f4ede3"
                    strokeWidth="2.5"
                  />
                  <ellipse cx="18" cy="38.5" rx="11" ry="2.5" fill="#0d0a08" />
                </svg>
              )}
            </div>
            {/* Luminance fade so high notes stay readable on the dark wall. */}
            <div className="vk-chat-fade" aria-hidden="true" />

            <div
              ref={scrollRef}
              className="vk-chat-log"
              /* Transcript. role="log" implies aria-live=polite — we
                 explicitly turn it OFF so the user's own notes are not
                 echoed back; new incoming messages are mirrored into the
                 hidden polite region above instead (WCAG 4.1.3). tabIndex
                 makes the scroller keyboard-operable (WCAG 2.1.1) — it is
                 a named region, so focusing it is legitimate. */
              role="log"
              aria-live="off"
              aria-label={t.chat.title}
              tabIndex={0}
            >
              {mode !== "direct" && (
                <div className="vk-chat-note vk-chat-note--ai">
                  <span className="vk-sr">{t.chat.modeAi}: </span>
                  <p>
                    {(hourBucket && t.chat.welcomeByHour?.[hourBucket]) ||
                      t.chat.welcome}
                  </p>
                </div>
              )}
              {mode !== "direct" && followupShown && t.chat.welcomeFollowup && (
                <div className="vk-chat-note vk-chat-note--ai">
                  <span className="vk-sr">{t.chat.modeAi}: </span>
                  <p>{t.chat.welcomeFollowup}</p>
                </div>
              )}

              {msgs.map((m, i) => {
                if (m.fail) return <FailCard key={i} t={t} style={noteDelay(i)} />;
                if (m.role === "user") {
                  return (
                    <div
                      key={i}
                      className={`vk-chat-note vk-chat-note--user vk-paper ${
                        i % 2 ? "vk-rot-c" : "vk-rot-a"
                      }`}
                      style={noteDelay(i)}
                    >
                      <NoteBody text={m.text} />
                    </div>
                  );
                }
                if (m.role === "petter") {
                  return (
                    <div
                      key={i}
                      className="vk-chat-note vk-chat-note--petter vk-paper"
                      style={noteDelay(i)}
                    >
                      <span className="vk-chat-petterstamp" aria-hidden="true">
                        {t.chat.petterStamp}
                      </span>
                      <span className="vk-sr">{t.chat.petterStamp}: </span>
                      <NoteBody text={m.text} />
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className="vk-chat-note vk-chat-note--ai"
                    style={noteDelay(i)}
                  >
                    <span className="vk-sr">{t.chat.modeAi}: </span>
                    <NoteBody text={m.text} />
                  </div>
                );
              })}

              {busy && <p className="vk-chat-thinking">{thinkingLine}</p>}

              {mode === "form" &&
                (woState === "failed" ? (
                  <>
                    <FailCard t={t} />
                    <button
                      type="button"
                      className="vk-chat-woretry"
                      onClick={() => setWoState("idle")}
                    >
                      {t.chat.workorder.retry}
                    </button>
                  </>
                ) : (
                  <form
                    className={`vk-paper vk-chat-wo${
                      woState === "stamped" ? " vk-chat-wo--stamped" : ""
                    }`}
                    onSubmit={submitWorkorder}
                    aria-labelledby="vk-chat-wo-title"
                  >
                    <p className="vk-chat-wotitle" id="vk-chat-wo-title">
                      {t.chat.workorder.title}
                    </p>
                    <label className="vk-chat-wolabel" htmlFor="vk-chat-wo-name">
                      {t.chat.workorder.name}
                    </label>
                    <input
                      ref={woNameRef}
                      id="vk-chat-wo-name"
                      className="vk-chat-wofield"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={woState !== "idle"}
                    />
                    <label className="vk-chat-wolabel" htmlFor="vk-chat-wo-email">
                      {t.chat.workorder.email}
                    </label>
                    <input
                      id="vk-chat-wo-email"
                      className="vk-chat-wofield"
                      type="email"
                      required
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={woState !== "idle"}
                    />
                    <label className="vk-chat-wolabel" htmlFor="vk-chat-wo-req">
                      {t.chat.workorder.request}
                    </label>
                    <textarea
                      id="vk-chat-wo-req"
                      className="vk-chat-wofield vk-chat-wofield--area"
                      rows={3}
                      value={woRequest}
                      onChange={(e) => setWoRequest(e.target.value)}
                      disabled={woState !== "idle"}
                      aria-describedby="vk-chat-wo-hint"
                    />
                    <p className="vk-chat-wohint" id="vk-chat-wo-hint">
                      {t.chat.workorder.requestHint}
                    </p>
                    <button
                      type="submit"
                      className="vk-chat-wosubmit"
                      disabled={woState !== "idle"}
                    >
                      {woState === "busy"
                        ? t.chat.workorder.sending
                        : t.chat.workorder.submit}
                    </button>
                    {woState === "stamped" && (
                      <span className="vk-chat-wostamp" aria-hidden="true">
                        {t.chat.workorder.stampSent}
                      </span>
                    )}
                  </form>
                ))}
            </div>

            {idle && (
              <p className="vk-chat-idleline" aria-hidden="true">
                {t.chat.idle}
              </p>
            )}
          </div>

          <footer className="vk-chat-foot">
            {mode === "ai" && (
              <button
                type="button"
                className="vk-chat-modetab"
                onClick={() => void switchToDirect()}
              >
                {t.chat.modePetter}
              </button>
            )}
            {mode === "direct" && (
              <div className="vk-chat-directrow">
                <p className="vk-chat-directinfo" id="vk-chat-directinfo">
                  {t.chat.directInfo}
                </p>
                <button
                  type="button"
                  className="vk-chat-backtab"
                  onClick={switchToAi}
                >
                  {t.chat.backToAi}
                </button>
              </div>
            )}
            {mode === "form" && (
              <button
                type="button"
                className="vk-chat-backtab"
                onClick={switchToAi}
              >
                {t.chat.backToAi}
              </button>
            )}

            {mode !== "form" && (
              <form
                className="vk-chat-inputrow"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <label className="vk-sr" htmlFor="vk-chat-input">
                  {t.chat.placeholder}
                </label>
                <textarea
                  ref={inputRef}
                  id="vk-chat-input"
                  className="vk-chat-input"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder={t.chat.placeholder}
                  /* NOT disabled while busy — disabling the focused field
                     drops focus to <body> on every Enter-send. send() guards
                     re-entry on `busy` instead. */
                  aria-describedby={
                    mode === "direct" ? "vk-chat-directinfo" : undefined
                  }
                />
                <button
                  type="submit"
                  className="vk-chat-send"
                  aria-label={t.chat.sendAria}
                  disabled={busy || !input.trim()}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}
